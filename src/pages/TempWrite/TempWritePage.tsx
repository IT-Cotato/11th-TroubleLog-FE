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
import { toCreatePostRequest, type PostForm } from "@/mappers/postMapper";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import { useProjectList } from "@/hooks/useProjectList";
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
} from "@/api/post.api";

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

  const location = useLocation() as { state?: IncomingTemplateState };
  const initialProjectId = location.state?.projectId;

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
        authorType: "USER_WRITTEN",
        summaryType: "NONE",
      }));

  // 프리필 반영
  useEffect(() => {
    if (location.state?.editorType === "TEMPLATE") {
      if (location.state.title) setTitle(location.state.title);
      if (location.state.tags) setSelectedTags(location.state.tags);
      if (location.state.errorType !== undefined)
        setSelectedErrorType(location.state.errorType ?? null);
      if (location.state.blocks?.length) setBlocks(location.state.blocks);
    }
  }, [location.state]);

  // 첫 블록 생성 (프리필 없을 때만)
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

  const handleNextInPostSaveModal = (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);
    setIsTemplateSelectModalOpen(true);
  };

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

      // 요약을 돌릴 거라 임시로 DRAFT로 생성
      const req = toCreatePostRequest(buildCreateForm("DRAFT"));
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
      await createPost(req);
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

  const buildCreateForm = (postStatus: "COMPLETED" | "DRAFT") => {
    const form: PostForm = {
      title,
      introduction: previewMeta?.description ?? "",
      postTags: selectedTags,
      isVisible: (previewMeta?.visibility ?? "public") === "public",
      isSummaryCreated: false,
      postStatus,
      starRating: String(previewMeta?.importance ?? 0),
      thumbnailImageUrl: previewMeta?.thumbnail ?? undefined,
      projectId: previewMeta?.projectId ?? 0,
      errorTag: selectedErrorType ?? "",
      contents: toContentDtoList(blocks),
    };
    return form;
  };

  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[225px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1500px] flex-col gap-[36px]">
          {showAlert && (
            <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목, 에러 종류, 첫 번째 블록 내용을 모두 입력해주세요.
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
                options={[
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
                ]}
                placeholder="에러 종류를 선택하세요"
                width="w-[340px] h-[36px]"
                onSelect={(selectedError) =>
                  setSelectedErrorType(selectedError)
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
              // 수정 프리필 반영
              initialImportance={location.state?.savePrefill?.importance}
              initialDescription={location.state?.savePrefill?.description}
              initialVisibility={location.state?.savePrefill?.visibility}
              initialProjectId={
                location.state?.savePrefill?.projectId ??
                initialProjectId ??
                null
              }
              initialThumbnail={location.state?.savePrefill?.thumbnail ?? null}
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
};

export default TempWritePage;
