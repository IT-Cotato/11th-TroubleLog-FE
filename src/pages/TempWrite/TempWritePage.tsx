import { useEffect, useState, useRef } from "react";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import DropDownButton from "@/components/Button/DropDownButton";
import CategoryTag from "@/components/TemplateWrite/CategoryTag";
import EditorBlock, {
  type BlockData,
} from "@/components/TemplateWrite/EditorBlock";
import { questionData } from "@/components/TemplateWrite/questionTemplate";
import PostSaveModal, { type PostSavePayload } from "./PostSaveModal";
import PostLoadingModal from "./PostLoadingModal";
import TemplateSelectModal from "./TemplateSelectModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "@/constants/paths";
// import { toCreatePostRequest, type PostForm } from "@/mappers/postMapper";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import { useProjectList } from "@/hooks/useProjectList";
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
  getTagsByKeyword,
} from "@/api/post.api";
import type { CreatePostRequest } from "@/models/post.model";

type IncomingTemplateState = {
  editorType?: "TEMPLATE";
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

const TempWritePage = () => {
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const navigate = useNavigate();
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const { data: projectList, loading: projectsLoading } = useProjectList();

  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [templateLabel, setTemplateLabel] = useState<string>("");
  const closingRef = useRef(false);

  // 더블클릭
  const [isCreating, setIsCreating] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);

  const location = useLocation() as { state?: IncomingTemplateState };
  const initialProjectId = location.state?.projectId;

  // UI 서버
  type UiPostStatus = "WRITING" | "COMPLETED";
  type ServerPostStatus = "WRITING" | "COMPLETE";
  const toServerPostStatus = (s: UiPostStatus): ServerPostStatus =>
    s === "COMPLETED" ? "COMPLETE" : "WRITING";

  const ERROR_TAG_OPTIONS = [
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
  ] as const;

  // ✅ 서버에서 정의한 "체크리스트 문항 → 정수 ID"를 여기에 채워 넣으세요.
  //   (아래 숫자는 예시입니다. 반드시 실제 ID로 교체!)
  const CHECKLIST_ERROR_ID_MAP: Record<string, number> = {
    "오류 메시지를 정확히 읽고 이해했나요?": 1,
    "로컬과 배포 환경의 차이를 점검해봤나요?": 2,
    "문제가 발생한 모듈/기능 범위를 파악했나요?": 3,
    "디버깅 툴이나 로그 추적을 활용해보셨나요?": 4,
    "개발 환경 (IDE, OS, 실행 조건 등)을 확인했나요?": 5,
  };

  const CHECKLIST_REASON_ID_MAP: Record<string, number> = {
    "공식 문서 또는 라이브러리 문서 확인": 1,
    "구글 검색": 2,
    "GPT / 오픈 AI 사용": 3,
    "StackOverflow, OKKY 등 질문 커뮤니티": 4,
    "GitHub Issue 또는 블로그 참고": 5,
  };
  // "오류를 정확히 인식하셨나요?" 섹션 → checklistError
  // 나머지 섹션(원인/Tip/회고) → checklistReason
  const buildChecklistIdsFromBlocks = (bs: BlockData[]) => {
    const errorIds = new Set<number>();
    const reasonIds = new Set<number>();

    bs.forEach((b) => {
      if (!b.checklist || b.checklist.length === 0) return;

      const isErrorSection = b.checklistTitle === "오류를 정확히 인식하셨나요?";
      const map = isErrorSection
        ? CHECKLIST_ERROR_ID_MAP
        : CHECKLIST_REASON_ID_MAP;

      b.checklist.forEach((label) => {
        const id = map[label];
        if (typeof id === "number") {
          (isErrorSection ? errorIds : reasonIds).add(id);
        } else {
          console.log("체크리스트 에러");
        }
      });
    });

    return {
      checklistErrorIds: Array.from(errorIds),
      checklistReasonIds: Array.from(reasonIds),
    };
  };

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

  const toContentDtoList = (bs: BlockData[]): PostContentDto[] =>
    bs
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map((b, i) => ({
        subTitle: b.question,
        body: b.content,
        sequence: i + 1,
      }));

  // ---------- prefill ----------
  useEffect(() => {
    if (location.state?.editorType === "TEMPLATE") {
      if (location.state.title) setTitle(location.state.title);
      if (location.state.tags) setSelectedTags(location.state.tags);
      if (location.state.errorType !== undefined)
        setSelectedErrorType(location.state.errorType ?? null);
      if (location.state.blocks?.length) setBlocks(location.state.blocks);
    }
  }, [location.state]);

  // 첫번째 블록 내용 필수
  useEffect(() => {
    const hasPrefill = !!(
      location.state?.editorType === "TEMPLATE" && location.state.blocks?.length
    );
    if (!hasPrefill && blocks.length === 0 && questionData.length > 0) {
      const firstBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: questionData[0].checklistItems ?? [],
        checklistTitle: questionData[0].title ?? "",
        question: questionData[0].question,
        isSaved: false,
      };
      setBlocks([firstBlock]);
    }
  }, [blocks.length, location.state]);

  const handleChangeBlockContent = (
    index: number,
    updated: Partial<BlockData>
  ) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], ...updated };
      return newBlocks;
    });
  };

  const handleToggleChecklist = (
    index: number,
    item: string,
    checked: boolean
  ) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      const checklist = new Set(newBlocks[index].checklist);
      if (checked) checklist.add(item);
      else checklist.delete(item);
      newBlocks[index].checklist = Array.from(checklist);
      return newBlocks;
    });
  };

  const handleAddBlock = () => {
    setBlocks((prev) => {
      const nextStep = prev.length;
      if (nextStep >= questionData.length) return prev;
      const stepData = questionData[nextStep];
      const newBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: stepData.checklistItems ?? [],
        checklistTitle: stepData.title ?? "",
        question: stepData.question,
        isSaved: false,
      };
      const newBlocks = [...prev, newBlock];
      setActiveIndex(newBlocks.length - 1);
      return newBlocks;
    });
  };

  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType || !blocks[0]?.content.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };

  const handleShowSaveAlert = () => {
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  // 저장버튼 필수 항목 -- 포스트 저장 모달
  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    if (isCreating) return;
    setIsCreating(true);

    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (
      !payload.projectId ||
      !title.trim() ||
      !selectedErrorType ||
      !blocks[0]?.content.trim()
    ) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setIsCreating(false);
      return;
    }

    try {
      const canonicalTags: string[] = [];
      const seen = new Set<string>();

      for (const raw of selectedTags) {
        const q = String(raw).replace(/^#\s*/, "").trim();
        if (!q) continue;

        const list = await getTagsByKeyword({ tagName: q });
        const exact = list.find((n) => n.toLowerCase() === q.toLowerCase());
        const pick = exact ?? list[0];
        if (!pick) throw new Error(`태그를 찾을 수 없습니다: ${raw}`);

        const normalized = String(pick).trim();
        if (!seen.has(normalized.toLowerCase())) {
          seen.add(normalized.toLowerCase());
          canonicalTags.push(normalized);
        }
      }

      const req = buildCreateForm("WRITING", payload, canonicalTags);
      const created = await createPost(req as any);
      setCreatedPostId(Number((created as any).id));
      setIsTemplateSelectModalOpen(true);
    } catch (e) {
      console.error(e);
      setStatusMessage("문서 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  // ---------- start summary ----------
  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);

    try {
      if (!createdPostId) throw new Error("Post가 아직 생성되지 않았어요.");

      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("");
      setTemplateLabel(label);

      console.log("[startSummary:req]", { postId: createdPostId, type });
      const start = await startSummary(createdPostId, type);
      console.log("[startSummary:res]", start);
      setSummaryTaskId(start.taskId);
    } catch (e) {
      console.error(e);
      setIsLoadingModalOpen(false);
      setIsTemplateSelectModalOpen(true);
      setSummaryTaskId(null);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("요약 시작에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsStartingSummary(false);
    }
  };

  // ---------- polling ----------
  useEffect(() => {
    if (!isLoadingModalOpen || !createdPostId || !summaryTaskId) return;

    let stopped = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const data = await getSummaryStatus(createdPostId, summaryTaskId);
        const p = Math.max(0, Math.min(100, data.progress ?? 0));
        if (stopped) return;
        setSummaryProgress(p);
        if (data.status) setSummaryStatus(data.status as any);
        if (data.currentStep) setStatusMessage(data.currentStep);
        else if (
          data.result &&
          typeof data.result === "object" &&
          "message" in (data.result as any)
        ) {
          setStatusMessage((data.result as any).message ?? "");
        }
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

  // ---------- later / cancel ----------
  const handleLater = async () => {
    if (createdPostId) {
      navigate(PATH.PREVIEW(createdPostId), { replace: true });
      return;
    }
    if (previewMeta?.projectId) {
      navigate(PATH.PROJECT_DETAIL(String(previewMeta.projectId)), {
        state: { projectName: previewMeta.projectName },
        replace: true,
      });
      return;
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
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

  // ---------- build form  ----------
  const buildCreateForm = (
    postStatus: "COMPLETED" | "WRITING",
    meta: PostSavePayload,
    tagsOverride?: string[]
  ) => {
    const { checklistErrorIds, checklistReasonIds } =
      buildChecklistIdsFromBlocks(blocks);

    return {
      title,
      introduction: meta.description ?? "",
      isVisible: (meta.visibility ?? "public") === "public",
      isSummaryCreated: false,
      postStatus: toServerPostStatus(postStatus),
      starRating: Number(meta.importance ?? 0),
      templateType: "GUIDELINE",
      projectId: Number(meta.projectId),
      thumbnailImageUrl: meta.thumbnail ?? undefined,

      errorTagName: selectedErrorType!,
      contentDtoList: toContentDtoList(blocks),
      postTags: (tagsOverride ?? selectedTags).map((t) =>
        t.replace(/^#\s*/, "").trim()
      ),

      checklistError: checklistErrorIds,
      checklistReason: checklistReasonIds,
    } satisfies CreatePostRequest;
  };

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[225px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1500px] flex-col gap-[36px]">
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목, 에러 종류, 첫 번째 블록, 프로젝트를 모두 입력/선택해주세요.
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
                options={ERROR_TAG_OPTIONS as unknown as string[]}
                placeholder="에러 종류를 선택하세요"
                width="w-[340px] h-[36px]"
                onSelect={(selectedErrorType) =>
                  setSelectedErrorType(selectedErrorType)
                }
              />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          <div>
            {[...blocks].reverse().map((block, index) => {
              const originalIndex = blocks.length - 1 - index;
              return (
                <EditorBlock
                  key={block.id}
                  block={block}
                  index={originalIndex}
                  isActive={originalIndex === activeIndex}
                  isLast={originalIndex === questionData.length - 1}
                  onChange={handleChangeBlockContent}
                  onToggleChecklist={handleToggleChecklist}
                  onAddBlock={handleAddBlock}
                  onEnd={handleEnd}
                  title={title}
                  selectedErrorType={selectedErrorType}
                  onShowSaveAlert={handleShowSaveAlert}
                  onActivate={(i) => setActiveIndex(i)}
                />
              );
            })}
          </div>

          {isPostSaveModalOpen && (
            <PostSaveModal
              onClose={() => setIsPostSaveModalOpen(false)}
              onNext={handleNextInPostSaveModal}
              projects={projectList.map((p) => ({ id: p.id, name: p.name }))}
              loadingProjects={projectsLoading}
              defaultProjectId={initialProjectId}
              selectedTags={selectedTags}
              selectedErrorType={selectedErrorType}
              initialImportance={location.state?.savePrefill?.importance}
              initialDescription={location.state?.savePrefill?.description}
              initialVisibility={location.state?.savePrefill?.visibility}
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
};

export default TempWritePage;
