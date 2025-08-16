import { useEffect, useRef, useState } from "react";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "@/components/Button/DropDownButton";
import CategoryTag from "@/components/TemplateWrite/CategoryTag";
import MDEditor from "@uiw/react-md-editor";
import PostSaveModal, {
  type PostSavePayload,
} from "@/pages/TempWrite/PostSaveModal";
import PostLoadingModal from "@/pages/TempWrite/PostLoadingModal";
import TemplateSelectModal from "@/pages/TempWrite/TemplateSelectModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useProjectList } from "@/hooks/useProjectList";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import { toCreatePostRequest, type PostForm } from "@/mappers/postMapper";
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
} from "@/api/post.api";

export type BlockData = {
  id: number;
  title: string;
  content: string;
  isSaved: boolean;
};

const errorOptions = [
  "Build / Compile Error",
  "Runtime Error",
  "Dependency / Version Error",
  "Network / API Error",
  "Authentication / Authorization Error",
  "Database Error",
  "UI / Rendering Error",
  "Configuration Error",
  "Timeout / Error Handling",
  "Third-Party Library Error",
  "Others",
];

export default function FreeFormWritePage() {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: Date.now(), title: "", content: "", isSaved: false },
  ]);

  // 모달 & 알림 상태
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  // 생성/요약 진행 상태
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [templateLabel, setTemplateLabel] = useState("");

  type SummaryStatus =
    | "PENDING"
    | "STARTED"
    | "PREPROCESSING"
    | "ANALYZING"
    | "POSTPROCESSING"
    | "COMPLETED";
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string>("");

  const closingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { projectId?: number } };
  const initialProjectId = location.state?.projectId;
  const { data: projectList, loading: projectsLoading } = useProjectList();

  // 자유양식 -> 서버 DTO
  const toContentDtoList = (items: BlockData[]): PostContentDto[] =>
    items
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map((b, i) => ({
        subTitle: (b.title ?? "").trim() || `Section ${i + 1}`,
        body: b.content,
        sequence: i + 1,
        authorType: "USER_WRITTEN",
        summaryType: "NONE",
      }));

  const toGuideContent = (text: string) =>
    (text ?? "").split(/\n{2,}/).map((s) => s.trim());

  const handleAddBlock = () => {
    if (blocks.length >= 10) return;
    setBlocks((prev) => [
      ...prev,
      { id: Date.now(), title: "", content: "", isSaved: false },
    ]);
  };

  const handleChangeBlock = (
    id: number,
    key: "title" | "content",
    value: string
  ) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [key]: value } : b))
    );
  };

  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    if (!blocks[0]?.content.trim()) {
      setShowBlockAlert(true);
      setTimeout(() => setShowBlockAlert(false), 3000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };

  const handleNextInPostSaveModal = (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);
    setIsTemplateSelectModalOpen(true);
  };

  // 템플릿 선택 -> 문서 생성 + 요약 시작
  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    try {
      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("");
      setTemplateLabel(label);

      const form: PostForm = {
        title,
        introduction: previewMeta?.description ?? "",
        postTags: selectedTags,
        isVisible: (previewMeta?.visibility ?? "public") === "public",
        isSummaryCreated: false,
        postStatus: "DRAFT",
        starRating: String(previewMeta?.importance ?? "0"),
        thumbnailImageUrl: previewMeta?.thumbnail ?? undefined,
        projectId: previewMeta?.projectId ?? 0,
        errorTag: selectedErrorType ?? "",
        contents: toContentDtoList(blocks),
      };

      const req = toCreatePostRequest(form);
      const created = await createPost(req);
      const postId = created.id;
      setCreatedPostId(postId);

      const start = await startSummary(postId, { type });
      setSummaryTaskId(start.taskId);
    } catch (e) {
      console.error(e);
      setIsLoadingModalOpen(false);
      setIsTemplateSelectModalOpen(true);
      setSummaryTaskId(null);
      setCreatedPostId(null);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("요약 시작에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  // 요약 상태
  useEffect(() => {
    if (!isLoadingModalOpen || !createdPostId || !summaryTaskId) return;

    let stopped = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const data = await getSummaryStatus(createdPostId, summaryTaskId);
        if (stopped) return;
        const p = Math.max(0, Math.min(100, data.progress ?? 0));
        setSummaryProgress(p);
        if (data.status) setSummaryStatus(data.status as SummaryStatus);
        if (data.message) setStatusMessage(data.message);
        if (data.status === "COMPLETED" || p >= 100) {
          setSummaryProgress(100);
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    tick();
    timer = window.setInterval(tick, 1200);

    return () => {
      stopped = true;
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, [isLoadingModalOpen, createdPostId, summaryTaskId]);

  // 미리보기
  const handleLater = () => {
    const filled = blocks.filter((b) => b.content?.trim().length > 0);
    const questions = filled.map((b) =>
      b.title?.trim() ? b.title.trim() : "(제목 없음)"
    );
    const contents = filled.map((b) => toGuideContent(b.content));

    navigate(PATH.PREVIEW, {
      state: {
        title,
        tags: selectedTags,
        errorType: selectedErrorType,
        importance: previewMeta?.importance,
        authorName: "나",
        authorProfile: null,
        authorBio: "",
        date: new Date().toISOString().slice(2, 10).replace(/-/g, "."),
        questions,
        contents,
      },
    });
  };

  // 로딩 모달 닫기(요약 취소)
  const handleCloseLoading = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      if (summaryProgress < 100 && createdPostId && summaryTaskId) {
        try {
          await cancelSummary(createdPostId, summaryTaskId);
        } catch (e) {
          console.error("요약 작업 취소 실패:", e);
        }
      }
      setIsLoadingModalOpen(false);
      setSummaryTaskId(null);
      setSummaryProgress(0);
      setShowCancelAlert(true);
      setTimeout(() => setShowCancelAlert(false), 3000);
    } finally {
      closingRef.current = false;
    }
  };

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[360px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1200px] flex-col gap-3">
          {/* Alerts */}
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목과 에러 종류를 모두 입력해주세요.
            </div>
          )}
          {showBlockAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              첫 번째 블록의 내용이 비어있습니다.
            </div>
          )}
          {showSaveAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-white border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              저장되었습니다.
            </div>
          )}
          {showCancelAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              요약 작업이 중단되었어요.
            </div>
          )}

          {/* 제목 + 태그 */}
          <div className="flex flex-col items-start gap-[40px]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="text-[36px] md:text-[48px] font-bold text-black outline-none w-full leading-tight"
            />
            <div className="flex gap-[36px] items-center">
              <DropDownButton
                options={errorOptions}
                placeholder="에러 종류를 선택하세요"
                width="w-[340px]"
                onSelect={(selectedError) =>
                  setSelectedErrorType(selectedError)
                }
              />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          {/* 블록들 */}
          {blocks.map((block, idx) => (
            <div key={block.id} className="max-w-[1200px]">
              <div className="w-full flex flex-row justify-center items-end h-[60px] mb-3">
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) =>
                    handleChangeBlock(block.id, "title", e.target.value)
                  }
                  placeholder="소제목을 입력하세요"
                  className="w-[1070px] p-2 border-none rounded font-bold text-black text-[24px]"
                />
                {/* Save / End (첫 블록에만 End 노출) */}
                <div className="flex items-end justify-center gap-2">
                  <button
                    onClick={() => {
                      setShowSaveAlert(true);
                      setTimeout(() => setShowSaveAlert(false), 3000);
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100"
                  >
                    Save
                  </button>
                  {idx === 0 && (
                    <button
                      onClick={handleEnd}
                      className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600"
                    >
                      End
                    </button>
                  )}
                </div>
              </div>

              <MDEditor
                value={block.content}
                onChange={(val) =>
                  handleChangeBlock(block.id, "content", val || "")
                }
                preview="edit"
              />
            </div>
          ))}

          {/* 블록 추가 */}
          <button
            onClick={handleAddBlock}
            disabled={blocks.length >= 10}
            className="border-2 border-dashed p-4 rounded-xl w-full h-[140px] mt-4 text-gray-500 text-[20px] hover:bg-gray-50 disabled:opacity-50"
          >
            + 블록 추가하기 ({blocks.length}/10)
          </button>

          {/* 모달들 */}
          {isPostSaveModalOpen && (
            <PostSaveModal
              onClose={() => setIsPostSaveModalOpen(false)}
              onNext={handleNextInPostSaveModal}
              projects={projectList.map((p) => ({ id: p.id, name: p.name }))}
              loadingProjects={projectsLoading}
              defaultProjectId={initialProjectId}
              selectedTags={selectedTags}
              summaryType="NONE"
            />
          )}

          {isTemplateSelectModalOpen && (
            <TemplateSelectModal
              onConfirm={(type, label) => handleConfirmTemplate(type, label)}
              onClose={() => setIsTemplateSelectModalOpen(false)}
              onLater={handleLater}
            />
          )}

          {isLoadingModalOpen && (
            <PostLoadingModal
              onClose={handleCloseLoading}
              progress={summaryProgress}
              templateLabel={templateLabel}
              status={summaryStatus ?? undefined}
              serverMessage={statusMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
