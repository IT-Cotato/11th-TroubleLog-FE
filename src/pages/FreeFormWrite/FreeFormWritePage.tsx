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
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
  getTagsByKeyword,
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

// ==== 서버 스키마 맞춤 유틸 ====
type UiPostStatus = "WRITING" | "COMPLETED";
type ServerPostStatus = "WRITING" | "COMPLETE";
const toServerPostStatus = (s: UiPostStatus): ServerPostStatus =>
  s === "COMPLETED" ? "COMPLETE" : "WRITING";

// errorTag 매핑(슬래시/공백 차이 흡수)
const ERROR_TAG_MAP: Record<string, string> = {
  BUILD_COMPILE: "BUILD_COMPILE",
  RUNTIME: "RUNTIME",
  DEPENDENCY: "DEPENDENCY",
  NETWORK_API: "NETWORK_API",
  AUTH: "AUTH",
  DATABASE: "DATABASE",
  UI_RENDER: "UI_RENDER",
  CONFIG: "CONFIG",
  TIMEOUT_HANDLING: "TIMEOUT_HANDLING",
  THIRD_PARTY: "THIRD_PARTY",
  OTHERS: "OTHERS",
};
const normalizeErrorLabel = (label: string) =>
  label
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/\/+/g, "_")
    .replace(/AUTHENTICATIONAUTHORIZATION/g, "AUTH")
    .replace(/UIRENDERING/g, "UI_RENDER")
    .replace(/BUILD_COMPILE/g, "BUILD_COMPILE")
    .replace(/DEPENDENCYVERSION/g, "DEPENDENCY")
    .replace(/NETWORK_API/g, "NETWORK_API")
    .replace(/TIMEOUTERRORHANDLING/g, "TIMEOUT_HANDLING")
    .replace(/THIRDPARTYLIBRARY/g, "THIRD_PARTY");

const mapErrorTag = (label: string | null): string => {
  if (!label) return "OTHERS";
  const key = normalizeErrorLabel(label);
  return ERROR_TAG_MAP[key] ?? "OTHERS";
};

// ==== 페이지 컴포넌트 ====
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
  const [showSubtitleAlert, setShowSubtitleAlert] = useState(false);

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

  // 더블 클릭 가드
  const [isCreating, setIsCreating] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);
  const closingRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingFreeformState };
  const initialProjectId = location.state?.projectId;
  const { data: projectList, loading: projectsLoading } = useProjectList();

  // 프리필 반영
  useEffect(() => {
    if (location.state?.editorType === "FREEFORM") {
      if (location.state.title) setTitle(location.state.title);
      if (location.state.tags) setSelectedTags(location.state.tags);
      if (location.state.errorType !== undefined)
        setSelectedErrorType(location.state.errorType ?? null);
      if (location.state.blocks?.length) setBlocks(location.state.blocks);
    }
  }, [location.state]);

  // contents 변환
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

  // 블록 조작
  const handleAddBlock = () => {
    if (blocks.length >= 20) return;
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

  // 서버 폼 빌드(템플릿 페이지와 동일 스키마)
  const buildCreateForm = (
    postStatus: UiPostStatus,
    meta: PostSavePayload,
    postTags: string[]
  ) => ({
    title,
    introduction: meta?.description ?? "",
    isVisible: (meta?.visibility ?? "public") === "public",
    isSummaryCreated: false,
    postStatus: toServerPostStatus(postStatus),
    starRating: String(meta?.importance ?? 0),
    projectId: Number(meta.projectId),
    thumbnailImageUrl: meta?.thumbnail ?? undefined,

    errorTagName: mapErrorTag(selectedErrorType),
    contentDtoList: toContentDtoList(blocks),
    postTags,
  });

  // 태그 정규화(백엔드 사전 태그 매칭)
  const canonicalizeTags = async (rawTags: string[]) => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of rawTags) {
      const q = String(raw).replace(/^#\s*/, "").trim();
      if (!q) continue;
      const res: any = await getTagsByKeyword({ tagName: q });
      const list: any[] = Array.isArray(res)
        ? res
        : res?.data ?? res?.content ?? res?.results ?? [];

      const exact = list.find((t: any) => {
        const n = typeof t === "string" ? t : t?.name ?? t;
        return typeof n === "string" && n.toLowerCase() === q.toLowerCase();
      });

      const pickRaw = exact ?? list[0];
      const pick =
        typeof pickRaw === "string" ? pickRaw : pickRaw?.name ?? pickRaw;
      if (!pick) throw new Error(`태그를 찾을 수 없습니다: ${raw}`);

      const normalized = String(pick).trim();
      if (!seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        out.push(normalized);
      }
    }
    return out;
  };

  // 저장(상단 Save 버튼) -> 원본만 저장
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
      setIsTemplateSelectModalOpen(false);
      setIsPostSaveModalOpen(true);
      setStatusMessage("프로젝트를 먼저 선택해주세요.");
      return;
    }

    try {
      const canonicalTags = await canonicalizeTags(selectedTags);
      const req = buildCreateForm("COMPLETED", previewMeta, canonicalTags);
      await createPost(req as any);
      navigate(PATH.PROJECT_DETAIL(String(previewMeta.projectId)), {
        state: { projectName: previewMeta.projectName },
      });
    } catch (e: any) {
      console.error(e);
      setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  // End -> 템플릿 선택 → 요약
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
    for (const block of blocks) {
      if (!(block.title ?? "").trim()) {
        setShowSubtitleAlert(true);
        setTimeout(() => setShowSubtitleAlert(false), 3000);
        return;
      }
    }
    setNextAction("SUMMARY");
    setIsPostSaveModalOpen(true);
  };

  // 저장 모달 → Next
  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (nextAction === "SAVE") {
      try {
        const canonicalTags = await canonicalizeTags(selectedTags);
        const req = buildCreateForm("COMPLETED", payload, canonicalTags);
        await createPost(req as any);
        navigate(PATH.PROJECT_DETAIL(String(payload.projectId)), {
          state: { projectName: payload.projectName },
        });
      } catch (e) {
        console.error(e);
        setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
      return;
    }

    // 요약 플로우
    setIsTemplateSelectModalOpen(true);
  };

  // 템플릿 확정 → 초안 생성 → 요약 시작
  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);
    try {
      if (!previewMeta) throw new Error("저장 메타가 없습니다.");

      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("");
      setTemplateLabel(label);

      const canonicalTags = await canonicalizeTags(selectedTags);
      const req = buildCreateForm("WRITING", previewMeta, canonicalTags); // 초안(WRITING)
      const created = await createPost(req as any);
      const postId = Number((created as any).id);
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
    } finally {
      setIsStartingSummary(false);
    }
  };

  // 폴링
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

  // 나중에 하기(요약 건너뛰고 원본 저장)
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
      const canonicalTags = await canonicalizeTags(selectedTags);
      const req = buildCreateForm("COMPLETED", previewMeta, canonicalTags);
      await createPost(req as any);
      navigate(PATH.PROJECT_DETAIL(String(previewMeta.projectId)), {
        state: { projectName: previewMeta.projectName },
      });
    } catch (e) {
      console.error(e);
      setStatusMessage("원본 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
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
              제목과 에러 종류, 첫 블록 내용을 모두 입력해주세요.
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
          {showSubtitleAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              소제목을 입력해주세요.
            </div>
          )}

          {/* 제목/태그 + 상단 액션바 */}
          <div className="flex flex-col items-start gap-[40px]">
            <input
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
                  placeholder="에러 종류를 선택하세요"
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
            disabled={blocks.length >= 20}
            className="border-2 border-dashed p-4 rounded-xl w-full h-[140px] mt-4 text-gray-500 text-[20px] hover:bg-gray-50 disabled:opacity-50"
          >
            + 블록 추가하기 ({blocks.length}/20)
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
              selectedErrorType={selectedErrorType}
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
