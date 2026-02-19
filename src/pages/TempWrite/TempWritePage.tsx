import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import HeaderWoSearch from "@/layouts/Header/HeaderWoSearch";
import DropDownButton from "@/shared/ui/Button/DropDownButton";
import CategoryTag from "@/shared/ui/Editor/CategoryTag";
import EditorBlock, { type BlockData } from "@/shared/ui/Editor/EditorBlock";
import { questionData } from "@/features/template-write/lib/questionTemplate";
import PostSaveModal, {
  type PostSavePayload,
} from "../../shared/ui/Modal/PostSaveModal";
import PostLoadingModal from "../../shared/ui/Modal/PostLoadingModal";
import TemplateSelectModal from "../../shared/ui/Modal/TemplateSelectModal";
import PostSuccessModal from "../../shared/ui/Modal/PostSuccessModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "@/shared/config/paths";

import {
  toCreatePostRequest,
  toEditPostRequest,
} from "@/entities/trouble/mappers/postMapper";

import type {
  PostContentDto,
  SummaryTypeParam,
} from "@/models/post.model";
import { useProjectSelection } from "@/shared/hooks/useProjectSelection";
import { createPost, editPost, getPostDetail } from "@/api/post.api";
import { uploadImage } from "@/api/image.api";
import { canonicalizeTags } from "@/shared/utils/canonicalizeTags";
import {
  ERROR_OPTIONS,
  toErrorLabel,
} from "@/shared/utils/errorCodeLabel";
import { useSummaryPolling } from "@/shared/hooks/useSummaryPolling";
import { useWriteModals } from "@/shared/hooks/useWriteModals";
import { useWriteSummaryFlow } from "@/shared/hooks/useWriteSummaryFlow";
import { WriteToast } from "@/shared/ui/WriteToast";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";

// ---- 숫자 인덱스 변환 유틸 ----
const QI = { ERROR: 0, REASON: 1 } as const;
const OFFSET = 1;

const Q_ERROR = questionData[QI.ERROR]?.question;
const Q_REASON = questionData[QI.REASON]?.question;

function encodeChecklistToNumbers(bs: BlockData[]) {
  const errorItems = questionData[QI.ERROR]?.checklistItems ?? [];
  const reasonItems = questionData[QI.REASON]?.checklistItems ?? [];

  const err = new Set<number>();
  const rea = new Set<number>();

  for (const b of bs) {
    const q = String((b as any).question ?? "");
    const selected: string[] = Array.isArray((b as any).checklist)
      ? (b as any).checklist
      : [];
    if (!selected.length) continue;

    if (q === Q_ERROR) {
      selected.forEach((s) => {
        const i = errorItems.indexOf(s);
        if (i >= 0) err.add(i + OFFSET);
      });
    } else if (q === Q_REASON) {
      selected.forEach((s) => {
        const i = reasonItems.indexOf(s);
        if (i >= 0) rea.add(i + OFFSET);
      });
    }
  }

  return {
    checklistError: [...err].sort((a, b) => a - b), // 순서대로(오름차순)
    checklistReason: [...rea].sort((a, b) => a - b), // 순서대로(오름차순)
  };
}

// 숫자 → 문자열 디코드 유틸
function decodeChecklistNumbers(nums: number[], kind: "ERROR" | "REASON") {
  const items =
    kind === "ERROR"
      ? questionData[QI.ERROR]?.checklistItems ?? []
      : questionData[QI.REASON]?.checklistItems ?? [];
  return (nums ?? [])
    .map((n) => items[n - OFFSET])
    .filter((v): v is string => typeof v === "string");
}

// ---------- 상태 타입 ----------
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
  postId?: number; // 수정 식별용
  mode?: "edit" | "create";
};

// ---------- 체크리스트 ----------
const enrichBlocksWithChecklist = (
  blocks: BlockData[],
  nums?: { error?: number[]; reason?: number[] } // ← 추가
): BlockData[] => {
  const decodedError = nums?.error
    ? decodeChecklistNumbers(nums.error, "ERROR")
    : null;
  const decodedReason = nums?.reason
    ? decodeChecklistNumbers(nums.reason, "REASON")
    : null;

  return blocks.map((b, i) => {
    const matched =
      questionData.find(
        (q) =>
          q.question === (b as any).question ||
          q.question === (b as any).checklistTitle
      ) ?? questionData[i];

    const q = (b as any).question ?? matched?.question ?? `질문 ${i + 1}`;

    // 기본 체크리스트(문자열) 확보
    let checklist: string[] = Array.isArray((b as any).checklist)
      ? (b as any).checklist
      : [];

    // 숫자 프리필이 있으면 Q1/Q2에 주입
    if (q === Q_ERROR && decodedError) checklist = decodedError;
    if (q === Q_REASON && decodedReason) checklist = decodedReason;

    return {
      ...b,
      question: q,
      checklistItems: (b as any).checklistItems?.length
        ? (b as any).checklistItems
        : matched?.checklistItems ?? [],
      checklistTitle: (b as any).checklistTitle ?? matched?.title ?? "",
      checklist,
      isSaved: (b as any).isSaved ?? false,
    } as BlockData;
  });
};

// ---------- 페이지 ----------
const TempWritePage = () => {
  // 네비게이션 & 라우트 상태
  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingTemplateState };
  const {
    selectedProjectId: selectedProjectIdPage,
    setSelectedProjectId: setSelectedProjectIdPage,
    initialProjectId,
    projectList,
    projectNames,
    nameToId,
    projectNameById,
    loading: projectsLoading,
  } = useProjectSelection({
    initialProjectId:
      location.state?.projectId ?? location.state?.savePrefill?.projectId ?? null,
  });

  // 기본 상태
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

  const [draftPostId, setDraftPostId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    isPostSaveModalOpen,
    setIsPostSaveModalOpen,
    isTemplateSelectModalOpen,
    setIsTemplateSelectModalOpen,
    isLoadingModalOpen,
    setIsLoadingModalOpen,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    showAlert,
    setShowAlert,
    showSaveAlert,
    setShowSaveAlert,
    showCancelAlert,
    setShowCancelAlert,
  } = useWriteModals();

  // 요약 상태
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [templateLabel, setTemplateLabel] = useState<string>("");
  const [completedSummaryId, setCompletedSummaryId] = useState<number | null>(
    null
  );

  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 더블클릭 가드
  const [isCreating, setIsCreating] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);
  const closingRef = useRef(false);

  // 이어쓰기(수정) 판단
  const resumePostId = useMemo(() => {
    const pid = location.state?.postId;
    return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
  }, [location.state]);
  const isResume = resumePostId != null;

  useEffect(() => {
    if (isResume && resumePostId) setDraftPostId(resumePostId);
  }, [isResume, resumePostId]);

  const currentPostId = useMemo(
    () => draftPostId ?? resumePostId ?? null,
    [draftPostId, resumePostId]
  );

  // 썸네일 상태
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  // 최초 작성 상태
  const [initialPostStatus, setInitialPostStatus] = useState<
    "WRITING" | "COMPLETED" | "SUMMARIZED" | null
  >(null);
  const wasEverCompleted = useMemo(
    () =>
      initialPostStatus === "COMPLETED" || initialPostStatus === "SUMMARIZED",
    [initialPostStatus]
  );
  const [detailPrefill, setDetailPrefill] = useState<PostSavePayload | null>(
    null
  );

  // 수정 모드 초기 진입 시 상세 조회에서 가져오기
  useEffect(() => {
    (async () => {
      if (!isResume || !resumePostId) return;
      try {
        const d: any = await getPostDetail(resumePostId);
        setCurrentThumbnail(d?.thumbnailImageUrl ?? null);
        // 서버 필드명 상이할 수 있어 둘 다 고려
        const s = (d?.postStatus ?? d?.status) as
          | "WRITING"
          | "COMPLETED"
          | "SUMMARIZED"
          | undefined;
        setInitialPostStatus(s ?? null);
        // ← 기존 introduction / starRating / visibility / projectId 등을 프리필에 저장
        setDetailPrefill({
          importance: Number(d?.starRating ?? 0),
          description: String(d?.introduction ?? ""),
          visibility: d?.isVisible ? "public" : "private",
          projectId: Number.isFinite(d?.projectId) ? Number(d.projectId) : null,
          projectName: "", // 필요시 후속 조회로 채워도 무방
          thumbnail: d?.thumbnailImageUrl ?? null,
        });
      } catch {
        /* ignore */
      }
    })();
  }, [isResume, resumePostId]);

  // ---------- 프리필 ----------
  useEffect(() => {
    if (location.state?.editorType === "TEMPLATE") {
      if (location.state.title) setTitle(location.state.title);
      if (location.state.tags) setSelectedTags(location.state.tags);
      if (location.state.errorType !== undefined)
        setSelectedErrorType(
          toErrorLabel(location.state.errorType) ??
            location.state.errorType ??
            null
        );
      if (location.state.blocks?.length) {
        setBlocks(
          enrichBlocksWithChecklist(location.state.blocks, {
            error: (location.state as any)?.checklistError, // number[]
            reason: (location.state as any)?.checklistReason, // number[]
          })
        );
      }
    }
  }, [location.state]);

  // 초기 활성 블록
  const initialActiveSetRef = useRef(false);
  useEffect(() => {
    if (initialActiveSetRef.current) return;
    if (blocks.length > 0) {
      setActiveIndex(blocks.length - 1);
      initialActiveSetRef.current = true;
    }
  }, [blocks.length]);

  // 프리필 없으면 첫 블록 생성
  useEffect(() => {
    const hasPrefill =
      location.state?.editorType === "TEMPLATE" &&
      !!location.state.blocks?.length;
    if (!hasPrefill && blocks.length === 0 && questionData.length > 0) {
      const firstBlock: BlockData = {
        id: Date.now(),
        content: "",
        checklist: [],
        checklistItems: questionData[0].checklistItems ?? [],
        checklistTitle: questionData[0].title ?? "",
        question: questionData[0].question,
        isSaved: false,
      } as any;
      setBlocks([firstBlock]);
    }
  }, [blocks.length, location.state]);

  // ---------- DTO ----------
  const toContentDtoList = (bs: BlockData[]): PostContentDto[] =>
    bs
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map(
        (b, i) =>
          ({
            subTitle: (b as any).question,
            body: b.content,
            sequence: i + 1,
            authorType: "USER_WRITTEN",
            summaryType: "NONE",
          } as any)
      );

  // 현재 화면 상태 + PostSaveModal에서 받은 meta로 수정 페이로드 만들기
  const buildEditFormFromMeta = async (
    meta: PostSavePayload,
    opts?: { mode?: "temp" | "final" | "summary" } // temp: 임시저장, final: 최종저장(요약 안함), summary: 요약 직전 최종저장
  ) => {
    const mode = opts?.mode ?? "temp";
    const canonicalTags = await canonicalizeTags(selectedTags);
    const { checklistError, checklistReason } =
      encodeChecklistToNumbers(blocks);
    const nextStatus: "WRITING" | "COMPLETED" | "SUMMARIZED" = (() => {
      // 최종 저장(요약 유무와 무관)에서는 COMPLETED로 고정,
      // 다만 기존이 SUMMARIZED면 그대로 유지
      if (mode === "final" || mode === "summary") {
        return initialPostStatus === "SUMMARIZED" ? "SUMMARIZED" : "COMPLETED";
      }
      // 임시 저장은 기존 정책 유지: 과거에 완료 이력 있으면 그대로 유지, 아니면 WRITING
      return wasEverCompleted ? initialPostStatus ?? "COMPLETED" : "WRITING";
    })();

    return {
      title,
      introduction: meta.description ?? "",
      postTags: canonicalTags,
      isVisible: (meta.visibility ?? "private") === "public",
      isSummaryCreated: false,
      postStatus: nextStatus, // 저장(완료) 상태로 반영
      starRating: Number(meta.importance ?? 0),
      templateType: "GUIDELINE",
      projectId: Number(meta.projectId),
      thumbnailImageUrl: meta.thumbnail ?? undefined,
      errorTag: selectedErrorType ?? "",
      contents: toContentDtoList(blocks),
      checklistError,
      checklistReason,
    };
  };

  // 수정 모드에서만 호출: 템플릿 선택 모달에서 요약을 시작하지 않는 경우에 저장
  const persistEditsIfEditMode = async () => {
    if (!isResume || !resumePostId || !previewMeta) return;
    const form = await buildEditFormFromMeta(previewMeta, { mode: "final" });
    await editPost(resumePostId, toEditPostRequest(form) as any);
    setDraftPostId(resumePostId);
  };

  // ---------- upsert ----------
  const upsertPost = async (maybeId: number | null, form: any) => {
    if (maybeId) {
      await editPost(maybeId, toEditPostRequest(form) as any);
      return maybeId;
    }
    const created: any = await createPost(toCreatePostRequest(form) as any);
    const newId = Number(
      created?.id ?? created?.data?.id ?? created?.content?.id
    );
    if (!Number.isFinite(newId)) throw new Error("생성된 포스트 ID 누락");
    return newId;
  };

  // ---------- 종료 버튼 ----------
  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType || !blocks[0]?.content?.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };
  const handleShowSaveAlert = () => {
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 1000);
  };
  const handleShowAlert = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 1000);
  };

  // ---------- 저장 모달 Next (=최종 저장) ----------
  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    if (isCreating) return;
    setIsCreating(true);

    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (
      !payload.projectId ||
      !title.trim() ||
      !selectedErrorType ||
      !blocks[0]?.content?.trim()
    ) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setIsCreating(false);
      return;
    }

    try {
      if (isResume) {
        // --- 수정 모드 ---
        // 여기서는 수정 API 호출하지 않음! (템플릿 모달에서 분기)
        setIsTemplateSelectModalOpen(true);
      } else {
        // --- 생성 모드 (기존 동작 유지) ---
        const canonicalTags = await canonicalizeTags(selectedTags);
        const { checklistError, checklistReason } =
          encodeChecklistToNumbers(blocks);

        const form = {
          title,
          introduction: payload.description ?? "",
          postTags: canonicalTags,
          isVisible: (payload.visibility ?? "private") === "public",
          isSummaryCreated: false,
          postStatus: "COMPLETED",
          starRating: Number(payload.importance ?? 0),
          templateType: "GUIDELINE",
          projectId: Number(payload.projectId),
          thumbnailImageUrl: payload.thumbnail ?? undefined,
          errorTag: selectedErrorType ?? "",
          contents: toContentDtoList(blocks),
          checklistError,
          checklistReason,
        };

        const id = await upsertPost(currentPostId, form);
        setDraftPostId(id);
        setCreatedPostId(id);
        setIsTemplateSelectModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage("문서 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  // ---------- 템플릿 확정 후 요약 ----------
  // const startSummaryCompat = async (postId: number, type: SummaryTypeParam) => {
  //   try {
  //     const res: any = await startSummary(postId, { type } as any);
  //     const taskId = res?.taskId ?? res?.data?.taskId ?? res?.content?.taskId;
  //     if (!taskId) throw new Error("No taskId (object signature)");
  //     return taskId as string;
  //   } catch {
  //     const res2: any = await startSummary(postId, type as any);
  //     const taskId2 =
  //       res2?.taskId ?? res2?.data?.taskId ?? res2?.content?.taskId;
  //     if (!taskId2) throw new Error("No taskId (positional signature)");
  //     return taskId2 as string;
  //   }
  // };

  const { runConfirmTemplate, closeLoadingModal } = useWriteSummaryFlow({
    postId: createdPostId ?? resumePostId,
    summaryTaskId,
    summaryProgress,
    setSummaryTaskId,
    setSummaryProgress,
    setSummaryStatus,
    setStatusMessage,
    setTemplateLabel,
    setIsTemplateSelectModalOpen,
    setIsLoadingModalOpen,
    setCreatedPostId,
    setShowCancelAlert,
    cancelAlertDuration: 3000,
  });

  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);
    try {
      const postId = createdPostId ?? resumePostId;
      if (!postId) throw new Error("Post가 아직 생성되지 않았어요.");

      const effectiveMeta: PostSavePayload = {
        importance: previewMeta?.importance ?? detailPrefill?.importance ?? 0,
        description:
          previewMeta?.description ?? detailPrefill?.description ?? "",
        visibility:
          previewMeta?.visibility ?? detailPrefill?.visibility ?? "private",
        projectId:
          previewMeta?.projectId ??
          detailPrefill?.projectId ??
          selectedProjectIdPage ??
          initialProjectId ??
          null,
        projectName:
          previewMeta?.projectName ||
          detailPrefill?.projectName ||
          projectNameById(selectedProjectIdPage) ||
          projectNameById(initialProjectId),
        thumbnail: previewMeta?.thumbnail ?? detailPrefill?.thumbnail ?? null,
      };
      if (!effectiveMeta.projectId) {
        throw new Error("프로젝트를 선택해주세요.");
      }

      await runConfirmTemplate(type, label, async () => {
        const form = await buildEditFormFromMeta(effectiveMeta, {
          mode: "summary",
        });
        return toEditPostRequest(form) as any;
      });
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

  // ---------- 폴링 ----------
  const handlePollComplete = useCallback(
    (postSummaryId?: number) => {
      if (typeof postSummaryId === "number") {
        setCompletedSummaryId(postSummaryId);
        setIsLoadingModalOpen(false);
        setIsSuccessModalOpen(true);
      } else {
        setIsLoadingModalOpen(false);
      }
    },
    []
  );

  useSummaryPolling({
    postId: createdPostId ?? resumePostId,
    summaryTaskId,
    isActive: !!isLoadingModalOpen,
    onProgress: setSummaryProgress,
    onStatus: setSummaryStatus,
    onMessage: setStatusMessage,
    onComplete: handlePollComplete,
  });

  const buildPreviewState = () => ({
    editorType: "TEMPLATE" as const,
    title,
    tags: selectedTags,
    errorType: selectedErrorType,
    date: new Date().toISOString(),
    isMine: true,
    importance: Number(previewMeta?.importance ?? 0),
    savePrefill: previewMeta ?? undefined,
    questions: blocks.map((b) => (b as any).question),
    contents: blocks.map((b) => [b.content]),
  });

  const handleLater = async () => {
    if (createdPostId) {
      navigate(PATH.PREVIEW(createdPostId), {
        replace: true,
        state: buildPreviewState(),
      });
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
    setTimeout(() => setShowAlert(false), 1000);
  };

  const handleCloseLoading = () => closeLoadingModal(closingRef);

  // ---------- 임시 저장 ----------
  const handleClickSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);

    try {
      // 최소 검증
      if (!title.trim() || !selectedErrorType || !blocks[0]?.content?.trim()) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 1000);
        return false;
      }

      const canonicalTags = await canonicalizeTags(selectedTags);
      const { checklistError, checklistReason } =
        encodeChecklistToNumbers(blocks);

      const meta: PostSavePayload = {
        importance: previewMeta?.importance ?? detailPrefill?.importance ?? 0,
        description:
          previewMeta?.description ?? detailPrefill?.description ?? "",
        visibility:
          previewMeta?.visibility ?? detailPrefill?.visibility ?? "private",
        projectId:
          selectedProjectIdPage ??
          previewMeta?.projectId ??
          detailPrefill?.projectId ??
          location.state?.savePrefill?.projectId ??
          initialProjectId ??
          null,
        projectName:
          projectNameById(selectedProjectIdPage) ||
          previewMeta?.projectName ||
          detailPrefill?.projectName ||
          location.state?.savePrefill?.projectName ||
          projectNameById(initialProjectId),
        thumbnail: previewMeta?.thumbnail ?? detailPrefill?.thumbnail ?? null,
      };

      if (!meta.projectId) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return false;
      }

      const form = {
        title,
        introduction: meta.description ?? "",
        postTags: canonicalTags,
        isVisible: (meta.visibility ?? "private") === "public",
        isSummaryCreated: false,
        postStatus: wasEverCompleted
          ? initialPostStatus ?? "COMPLETED"
          : "WRITING",
        starRating: Number(meta.importance ?? 0),
        templateType: "GUIDELINE",
        projectId: Number(meta.projectId),
        thumbnailImageUrl: meta.thumbnail ?? undefined, // 빈문자 대신 undefined
        errorTag: selectedErrorType ?? "",
        contents: toContentDtoList(blocks),
        checklistError,
        checklistReason,
      };

      const id = await upsertPost(currentPostId, form);
      setDraftPostId(id);
      setCreatedPostId(id);

      return true;
    } catch (e) {
      console.error(e);
      setStatusMessage("임시 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 저장 가능 여부
  const canSave = useMemo(() => {
    const hasTitle = !!title.trim();
    const hasError = !!selectedErrorType;
    const hasFirstContent = !!blocks[0]?.content?.trim();

    const projectId =
      selectedProjectIdPage ??
      previewMeta?.projectId ??
      location.state?.savePrefill?.projectId ??
      initialProjectId ??
      null;

    const hasProject = !!projectId;
    return hasTitle && hasError && hasFirstContent && hasProject;
  }, [
    title,
    selectedErrorType,
    blocks,
    previewMeta?.projectId,
    location.state?.savePrefill?.projectId,
    initialProjectId,
    selectedProjectIdPage,
  ]);

  // ---------- 블록 핸들러 ----------
  const handleChangeBlockContent = useCallback(
    (index: number, updated: Partial<BlockData>) => {
      setBlocks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updated };
        return next;
      });
    },
    []
  );

  const handleToggleChecklist = useCallback(
    (index: number, item: string, checked: boolean) => {
      setBlocks((prev) => {
        const next = [...prev];
        const checklist = new Set<string>((next[index] as any).checklist ?? []);
        if (checked) checklist.add(item);
        else checklist.delete(item);
        (next[index] as any).checklist = Array.from(checklist);
        return next;
      });
    },
    []
  );

  const handleAddBlock = useCallback(() => {
    setBlocks((prev) => {
      const nextStep = prev.length;

      // 1) 아직 questionData 남아 있는 경우: 새 블록 생성
      if (nextStep < questionData.length) {
        const stepData = questionData[nextStep];
        const newBlock: BlockData = {
          id: Date.now(),
          content: "",
          checklist: [],
          checklistItems: stepData.checklistItems ?? [],
          checklistTitle: stepData.title ?? "",
          question: stepData.question,
          isSaved: false,
        } as any;

        const next = [...prev, newBlock];
        setActiveIndex(next.length - 1); // 새 블록으로 포커싱
        return next;
      }

      // 2) 이미 모든 블록이 생성된 경우
      setActiveIndex((idx) => {
        const nextIdx = Math.min(idx + 1, prev.length - 1);
        return nextIdx;
      });

      return prev;
    });
  }, []);

  // 이미지 업로드 - 드래그 앤 드롭
  const insertImageMarkdown = (blockId: number, url: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, content: `${b.content?.trim()}\n\n![image](${url})` }
          : b
      )
    );
  };

  const handlePasteImage = async (
    blockId: number,
    e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const files = e.clipboardData?.files;
    const file = files && files[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      try {
        const url = await uploadImage(file); // onProgress 필요하면 2번째 인자 사용 가능
        insertImageMarkdown(blockId, url);
      } catch {
        setStatusMessage("이미지 업로드에 실패했어요.");
      }
    }
  };

  const handleDropImage = async (
    blockId: number,
    e: React.DragEvent<HTMLTextAreaElement>
  ) => {
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      try {
        const url = await uploadImage(file);
        insertImageMarkdown(blockId, url);
      } catch {
        setStatusMessage("이미지 업로드에 실패했어요.");
      }
    }
  };

  const reversedBlocks = useMemo(() => {
    return [...blocks].reverse().map((block, index) => ({
      block,
      originalIndex: blocks.length - 1 - index,
    }));
  }, [blocks]);

  // next 누를시에 다음 블록에 자동 포커싱
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const el = blockRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeIndex]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen">
      <HeaderWoSearch />
      <div className="w-full max-w-[1680px] sm:pl-64 lg:pl-64 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-[1680px] flex flex-col gap-8 sm:gap-9">
          <WriteToast
            show={showAlert}
            message="제목, 프로젝트, 에러 종류, 첫 번째 블록 내용을 모두 입력해주세요."
          />
          <WriteToast show={showSaveAlert} message="저장되었습니다." variant="success" />
          <WriteToast show={showCancelAlert} message="요약 작업이 중단되었어요." />

          <div className="flex flex-col gap-6 sm:gap-10">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="
    w-[1100px] md:w-[870px]
    text-2xl sm:text-3xl md:text-4xl lg:text-5xl
    font-bold text-black outline-none leading-tight
    whitespace-pre-wrap break-words
    relative
    border-none bg-transparent
  "
            />

            <div className="flex flex-col gap-3 max-w-[1100px] md:max-w-[900px] lg:w-auto">
              <div className="flex gap-3 items-center flex-wrap">
                <DropDownButton
                  options={projectNames}
                  placeholder={
                    projectsLoading
                      ? "프로젝트 불러오는 중..."
                      : projectNameById(selectedProjectIdPage) ||
                        "프로젝트를 선택하세요"
                  }
                  width="w-full sm:w-[170px] md:w-[190px]"
                  onSelect={(name: string) =>
                    setSelectedProjectIdPage(nameToId.get(name) ?? null)
                  }
                />

                <DropDownButton
                  options={ERROR_OPTIONS}
                  placeholder={selectedErrorType ?? "에러 종류를 선택하세요"}
                  width="w-full sm:w-[180px] lg:w-[220px]"
                  onSelect={(v: string) => setSelectedErrorType(v)}
                />
              </div>

              <div className="w-full sm:w-auto min-w-[180px]">
                <CategoryTag value={selectedTags} onChange={setSelectedTags} />
              </div>
            </div>
          </div>

          <div className="flex flex-col pb-2">
            {reversedBlocks.map(({ block, originalIndex }) => (
              <div
                key={block.id}
                ref={(el) => {
                  blockRefs.current[originalIndex] = el;
                }}
              >
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
                  onShowAlert={handleShowAlert}
                  onSave={handleClickSave}
                  isSaving={isSaving}
                  canSave={canSave}
                  onActivate={(i) => setActiveIndex(i)}
                  onPasteImage={handlePasteImage}
                  onDropImage={handleDropImage}
                />
              </div>
            ))}
          </div>

          {isPostSaveModalOpen && (
            <PostSaveModal
              onClose={() => setIsPostSaveModalOpen(false)}
              onNext={handleNextInPostSaveModal}
              projects={projectList.map((p) => ({ id: p.id, name: p.name }))}
              loadingProjects={projectsLoading}
              defaultProjectId={initialProjectId ?? undefined}
              selectedTags={selectedTags}
              selectedErrorType={selectedErrorType}
              initialImportance={
                previewMeta?.importance ??
                detailPrefill?.importance ??
                location.state?.savePrefill?.importance
              }
              initialDescription={
                previewMeta?.description ??
                detailPrefill?.description ??
                location.state?.savePrefill?.description
              }
              initialVisibility={
                previewMeta?.visibility ??
                detailPrefill?.visibility ??
                location.state?.savePrefill?.visibility ??
                "public"
              }
              initialProjectId={
                selectedProjectIdPage ??
                previewMeta?.projectId ??
                detailPrefill?.projectId ??
                location.state?.savePrefill?.projectId ??
                initialProjectId ??
                null
              }
              initialThumbnail={
                previewMeta?.thumbnail ??
                detailPrefill?.thumbnail ??
                currentThumbnail ??
                location.state?.savePrefill?.thumbnail ??
                null
              }
            />
          )}

          {isTemplateSelectModalOpen && (
            <TemplateSelectModal
              onConfirm={(type, label) => handleConfirmTemplate(type, label)} // 요약 시작: 수정 API 호출 X
              onClose={async () => {
                await persistEditsIfEditMode(); // 요약 안 함 → 수정 반영
                setIsTemplateSelectModalOpen(false);
              }}
              onLater={async () => {
                await persistEditsIfEditMode(); // 요약 안 함 → 수정 반영
                await handleLater();
              }}
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

          {isSuccessModalOpen && completedSummaryId != null && (
            <PostSuccessModal
              onClose={() => setIsSuccessModalOpen(false)}
              summaryId={completedSummaryId}
              postId={createdPostId ?? resumePostId ?? undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default TempWritePage;
