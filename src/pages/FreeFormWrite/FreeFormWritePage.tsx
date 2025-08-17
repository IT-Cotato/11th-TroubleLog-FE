import { useEffect, useMemo, useRef, useState } from "react";
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
  editPost,
} from "@/api/post.api";

export type BlockData = {
  id: number;
  title: string;
  content: string;
  isSaved: boolean;
};

type IncomingFreeformState = {
  editorType?: "FREEFORM";
  title?: string;
  tags?: string[];
  errorType?: string | null;
  blocks?: BlockData[];
  savePrefill?: {
    importance?: number;
    description?: string;
    visibility?: "public" | "private";
    projectId?: number | null;
    projectName?: string;
    thumbnail?: string | null;
  };
  projectId?: number;

  // 수정 식별용
  postId?: number;
  mode?: "edit" | "create";
};

const errorOptions = [
  "Build/Compile Error",
  "Runtime Error",
  "Dependency/Version Error",
  "Network/API Error",
  "Authentication/Authorization Error",
  "Database Error",
  "UI/Rendering Error",
  "Configuration Error",
  "Timeout/Error Handling",
  "Third-Party Library Error",
];

const ERROR_CODE_TO_LABEL: Record<string, string> = {
  BUILD_COMPILE_ERROR: "Build/Compile Error",
  RUNTIME_ERROR: "Runtime Error",
  DEPENDENCY_VERSION_ERROR: "Dependency/Version Error",
  NETWORK_API_ERROR: "Network/API Error",
  AUTHENTICATION_AUTHORIZATION_ERROR: "Authentication/Authorization Error",
  DATABASE_ERROR: "Database Error",
  UI_RENDERING_ERROR: "UI/Rendering Error",
  CONFIGURATION_ERROR: "Configuration Error",
  TIMEOUT_ERROR_HANDLING: "Timeout/Error Handling",
  THIRD_PARTY_LIBRARY_ERROR: "Third-Party Library Error",
};
const toErrorLabel = (code?: string | null) =>
  code ? ERROR_CODE_TO_LABEL[code] ?? code : null;

export default function FreeFormWritePage() {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: Date.now(), title: "", content: "", isSaved: false },
  ]);

  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

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

  const [nextAction, setNextAction] = useState<"SUMMARY" | "SAVE" | null>(null);

  const closingRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingFreeformState };
  const initialProjectId = location.state?.projectId;
  const { data: projectList, loading: projectsLoading } = useProjectList();

  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // 수정여부 판단
  const resumePostId = useMemo(() => {
    const pid = location.state?.postId;
    return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
  }, [location.state]);
  const isResume = resumePostId != null;

  // 프리필 반영
  useEffect(() => {
    if (
      location.state?.editorType === "FREEFORM" &&
      location.state.blocks?.length
    ) {
      setTitle(location.state.title ?? "");
      setSelectedTags(location.state.tags ?? []);
      setSelectedErrorType(toErrorLabel(location.state.errorType) ?? null);
      setBlocks(location.state.blocks);

      // 프리필 후 최상단으로 포커스
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [location.state]);

  // 초기 진입 시에도 한 번 보장
  useEffect(() => {
    setTimeout(() => titleInputRef.current?.focus(), 0);
  }, []);

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

  const buildCreateForm = (
    postStatus: "COMPLETED" | "WRITING",
    meta: PostSavePayload | null = previewMeta
  ): PostForm => ({
    title,
    introduction: meta?.description ?? "",
    postTags: selectedTags?.filter(Boolean) ?? [],
    isVisible: (meta?.visibility ?? "public") === "public",
    isSummaryCreated: false,
    postStatus,
    starRating: String(meta?.importance ?? 0),
    templateType:
      location.state?.editorType === "FREEFORM" ? "FREE_FORM" : "GUIDELINE",
    thumbnailImageUrl: meta?.thumbnail ?? undefined,
    projectId: Number(meta?.projectId ?? 0),
    errorTag: selectedErrorType ?? "",
    contents: toContentDtoList(blocks),
  });

  // (원본 저장 함수) create ↔ edit 분기
  const saveOriginalOnly = async (
    meta: PostSavePayload | null = previewMeta
  ) => {
    if (!meta?.projectId) {
      setIsPostSaveModalOpen(true);
      return;
    }
    try {
      const req = toCreatePostRequest(buildCreateForm("COMPLETED", meta));
      console.debug(
        isResume ? "[editPost] payload" : "[createPost] payload",
        req
      );

      if (isResume && resumePostId) {
        await editPost(resumePostId, req as any);
      } else {
        await createPost(req);
      }

      navigate(PATH.PROJECT_DETAIL(String(meta.projectId)), {
        state: { projectName: meta.projectName },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error(
        isResume ? "editPost error" : "createPost error",
        status,
        data,
        err
      );

      if (status === 401) {
        setStatusMessage("로그인이 만료되었어요. 다시 로그인해주세요.");
        navigate(PATH.LOGIN);
        return;
      }

      const msg =
        (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        "원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.";
      setStatusMessage(msg);
    }
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
    setNextAction("SUMMARY");
    setIsPostSaveModalOpen(true);
  };

  const handleGlobalSave = async () => {
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

    setBlocks((prev) => prev.map((b) => ({ ...b, isSaved: true })));
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);

    setNextAction("SAVE");

    if (!previewMeta?.projectId) {
      setIsPostSaveModalOpen(true);
      return;
    }

    try {
      await saveOriginalOnly(previewMeta);
    } catch (e) {
      console.error(e);
      setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (nextAction === "SAVE") {
      try {
        await saveOriginalOnly(payload);
      } catch (e) {
        console.error(e);
        setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
      return;
    }
    setIsTemplateSelectModalOpen(true);
  };

  // (요약 시작 분기) 기존: 생성 → 요약 시작
  // 이어쓰기면 수정(WRITING) → 기존 postId로 요약 시작
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

      const req = toCreatePostRequest(buildCreateForm("WRITING"));

      let targetPostId: number;
      if (isResume && resumePostId) {
        await editPost(resumePostId, req as any);
        targetPostId = resumePostId;
      } else {
        const created = await createPost(req);
        targetPostId = created.id;
      }

      setCreatedPostId(targetPostId);

      const start = await startSummary(targetPostId, { type });
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
        if (data.status) setSummaryStatus(data.status as any);
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

  // (나중에 완료 저장) create ↔ edit 분기
  const handleLater = async () => {
    if (
      !title.trim() ||
      !selectedErrorType ||
      !blocks[0]?.content.trim() ||
      !previewMeta?.projectId
    ) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    try {
      const req = toCreatePostRequest(buildCreateForm("COMPLETED"));
      if (isResume && resumePostId) {
        await editPost(resumePostId, req as any);
      } else {
        await createPost(req);
      }
      navigate(PATH.PROJECT_DETAIL(String(previewMeta.projectId)), {
        state: { projectName: previewMeta.projectName },
      });
    } catch (e) {
      console.error(e);
      setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

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

          {/* 제목/태그 + 상단 액션바 */}
          <div className="flex flex-col items-start gap-[40px]">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="text-[36px] md:text-[48px] font-bold text-black outline-none w-full leading-tight"
            />
            <div className="flex w-[1200px] justify-between">
              <div className="flex gap-[36px] items-center">
                <DropDownButton
                  options={errorOptions}
                  placeholder={selectedErrorType ?? "에러 종류를 선택하세요"}
                  width="w-[340px]"
                  onSelect={(selectedError) =>
                    setSelectedErrorType(selectedError)
                  }
                />
                <CategoryTag value={selectedTags} onChange={setSelectedTags} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGlobalSave}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100"
                >
                  Save
                </button>
                <button
                  onClick={handleEnd}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600"
                >
                  End
                </button>
              </div>
            </div>
          </div>

          {/* 블록 리스트 */}
          {blocks.map((block) => (
            <div key={block.id} className="max-w-[1200px]">
              <div className="w-full flex items-end h-[60px] mb-2">
                <input
                  type="text"
                  value={block.title}
                  onChange={(e) =>
                    handleChangeBlock(block.id, "title", e.target.value)
                  }
                  placeholder="소제목을 입력하세요"
                  className="flex-1 px-0 py-2 border-none rounded font-bold text-black text-[24px]"
                />
              </div>

              <MDEditor
                className="mt-2"
                value={block.content}
                onChange={(val) =>
                  handleChangeBlock(block.id, "content", val || "")
                }
                preview="edit"
              />
            </div>
          ))}

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
              initialImportance={
                previewMeta?.importance ??
                location.state?.savePrefill?.importance
              }
              initialDescription={
                previewMeta?.description ??
                location.state?.savePrefill?.description
              }
              initialVisibility={
                previewMeta?.visibility ??
                location.state?.savePrefill?.visibility
              }
              initialProjectId={
                previewMeta?.projectId ??
                location.state?.savePrefill?.projectId ??
                initialProjectId ??
                null
              }
              initialThumbnail={
                previewMeta?.thumbnail ??
                location.state?.savePrefill?.thumbnail ??
                null
              }
            />
          )}

          {isTemplateSelectModalOpen && (
            <TemplateSelectModal
              onConfirm={(type, label) => handleConfirmTemplate(type, label)}
              onClose={() => setIsTemplateSelectModalOpen(false)}
              onLater={handleLater}
              onPrev={() => {
                setIsTemplateSelectModalOpen(false);
                setIsPostSaveModalOpen(true);
              }}
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
