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

import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import { useProjectList } from "@/hooks/useProjectList";
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
  editPost,
  getTagsByKeyword,
  getPostDetail,
} from "@/api/post.api";
import { uploadImage } from "@/api/image.api";
import {
  commands,
  TextAreaTextApi,
  type ICommand,
  type TextState,
} from "@uiw/react-md-editor";
import { isAxiosError } from "axios";
import { startRefresh } from "@/api/axios";

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

// ---------- 에러 라벨/코드  ----------
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
  const initialProjectId =
    location.state?.projectId ?? location.state?.savePrefill?.projectId ?? null;

  // 프로젝트 목록
  const { data: projectList = [], loading: projectsLoading } = useProjectList();

  // 기본 상태
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

  // 페이지 내 프로젝트 선택값
  const [selectedProjectIdPage, setSelectedProjectIdPage] = useState<
    number | null
  >(null);
  useEffect(() => {
    if (initialProjectId != null)
      setSelectedProjectIdPage(Number(initialProjectId));
  }, [initialProjectId]);

  const projectNames = useMemo(
    () => projectList.map((p) => p.name),
    [projectList]
  );
  const nameToId = useMemo(
    () => new Map(projectList.map((p) => [p.name, p.id])),
    [projectList]
  );
  const projectNameById = useCallback(
    (id?: number | null) => projectList.find((p) => p.id === id)?.name ?? "",
    [projectList]
  );

  const [draftPostId, setDraftPostId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 모달/알림
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  // 요약 상태
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [templateLabel, setTemplateLabel] = useState<string>("");
  const [completedSummaryId, setCompletedSummaryId] = useState<number | null>(
    null
  );

  type SummaryStatus =
    | "PENDING"
    | "STARTED"
    | "PREPROCESSING"
    | "ANALYZING"
    | "POSTPROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
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

  // ---------- 태그 정규화 ----------
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
      const names = list
        .map((t) => (typeof t === "string" ? t : t?.name ?? t))
        .filter(Boolean);
      const exact = names.find(
        (n: string) => n.toLowerCase() === q.toLowerCase()
      );
      const pick = (exact ?? names[0]) as string | undefined;

      const normalized = String(pick ?? q).trim();
      if (!seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        out.push(normalized);
      }
    }
    return out;
  };

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
  const startSummaryCompat = async (postId: number, type: SummaryTypeParam) => {
    try {
      const res: any = await startSummary(postId, { type } as any);
      const taskId = res?.taskId ?? res?.data?.taskId ?? res?.content?.taskId;
      if (!taskId) throw new Error("No taskId (object signature)");
      return taskId as string;
    } catch {
      const res2: any = await startSummary(postId, type as any);
      const taskId2 =
        res2?.taskId ?? res2?.data?.taskId ?? res2?.content?.taskId;
      if (!taskId2) throw new Error("No taskId (positional signature)");
      return taskId2 as string;
    }
  };

  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);
    try {
      const postId = createdPostId ?? resumePostId;
      if (!postId) throw new Error("Post가 아직 생성되지 않았어요.");

      // 1) 요약 시작 전, 항상 최신 내용으로 수정 API 호출
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

      const editForm = await buildEditFormFromMeta(effectiveMeta, {
        mode: "summary",
      });
      await editPost(postId, toEditPostRequest(editForm) as any);

      // 2) 수정 성공 후에만 요약 로딩 UI 오픈 및 요약 시작
      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("");
      setTemplateLabel(label);

      const taskId = await startSummaryCompat(postId, type);
      setSummaryTaskId(taskId);
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
  useEffect(() => {
    if (
      !isLoadingModalOpen ||
      !(createdPostId ?? resumePostId) ||
      !summaryTaskId
    )
      return;

    let stopped = false;
    let timer: number | null = null;

    const tick = async () => {
      const awaitRefreshIfAny = async () => {
        const p = (window as any).__authRefreshPromise as Promise<
          string | null
        > | null;
        if (p) {
          try {
            await p;
          } catch {
            /* ignore */
          }
        }
      };

      try {
        const targetId = (createdPostId ?? resumePostId) as number;

        await awaitRefreshIfAny();

        const fetchOnce = () =>
          getSummaryStatus(targetId, summaryTaskId, {
            __skipGlobalAuthGuard: true,
          });

        let data: any;
        try {
          data = await fetchOnce();
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 401) {
            const inflight = (window as any).__authRefreshPromise as Promise<
              string | null
            > | null;
            const token = inflight ? await inflight : await startRefresh();
            if (!token) throw e;

            data = await getSummaryStatus(targetId, summaryTaskId, {
              __skipGlobalAuthGuard: true,
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            throw e;
          }
        }

        const p = Math.max(0, Math.min(100, data?.progress ?? 0));
        if (stopped) return;

        setSummaryProgress(p);
        if (data?.status) setSummaryStatus(data.status as SummaryStatus);

        if (data?.currentStep) setStatusMessage(data.currentStep);
        else if (data?.message) setStatusMessage(data.message);
        else if (
          data?.result &&
          typeof data.result === "object" &&
          "message" in (data.result as any)
        ) {
          setStatusMessage((data.result as any).message ?? "");
        }

        if (data?.status === "COMPLETED" || p >= 100) {
          setSummaryProgress(100);
          if (typeof data?.postSummaryId === "number") {
            setCompletedSummaryId(data.postSummaryId);
            setIsLoadingModalOpen(false);
            setIsSuccessModalOpen(true);
          } else {
            setIsLoadingModalOpen(false);
          }
          if (timer !== null) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (err) {
        console.error("poll tick error:", err);
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
  }, [isLoadingModalOpen, createdPostId, resumePostId, summaryTaskId]);

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

  const handleCloseLoading = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    try {
      const targetId = createdPostId ?? resumePostId;
      if (summaryProgress < 100 && targetId && summaryTaskId) {
        try {
          await cancelSummary(targetId, summaryTaskId);
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
      } as any;
      const next = [...prev, newBlock];
      setActiveIndex(next.length - 1);
      return next;
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

  // 이미지 업로드 - 파일 선택
  const fileRef = useRef<HTMLInputElement | null>(null);

  // 선택 텍스트를 alt로 쓰고, 없으면 기본 "image" 사용
  const insertImage = (state: TextState, api: TextAreaTextApi, url: string) => {
    const alt = state.selectedText?.trim() || "image";
    const md = `![${alt}](${url})`;
    api.replaceSelection(md);

    const pos = state.selection.start + md.length;
    api.setSelectionRange({ start: pos, end: pos });
  };

  const imageUploadCmd: ICommand = {
    name: "imageUpload",
    keyCommand: "image",
    icon: commands.image.icon, // 기본 이미지 아이콘 재사용
    buttonProps: { "aria-label": "이미지 업로드" },
    execute: (state, api) => {
      const input = fileRef.current;
      if (!input) return;

      const onPick = async (e: Event) => {
        input.removeEventListener("change", onPick);
        const file = (e.target as HTMLInputElement).files?.[0];
        (e.target as HTMLInputElement).value = ""; // 같은 파일 재선택 허용
        if (!file) return;

        try {
          const url = await uploadImage(file);
          insertImage(state, api, url);
        } catch {
          // 필요시 상태 메시지/토스트 처리
          // setStatusMessage("이미지 업로드에 실패했어요.");
        }
      };

      input.accept = "image/*";
      input.addEventListener("change", onPick, { once: true });
      input.click();
    },
  };

  const reversedBlocks = useMemo(() => {
    return [...blocks].reverse().map((block, index) => ({
      block,
      originalIndex: blocks.length - 1 - index,
    }));
  }, [blocks]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen">
      <HeaderWoSearch />
      <div className="w-full max-w-[1680px] sm:pl-64 lg:pl-64 pt-8 sm:pt-12">
        <div className="mx-auto w-full max-w-[1680px] flex flex-col gap-8 sm:gap-9">
          {showAlert && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              제목, 프로젝트, 에러 종류, 첫 번째 블록 내용을 모두 입력해주세요.
            </div>
          )}
          {showSaveAlert && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-white border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              저장되었습니다.
            </div>
          )}
          {showCancelAlert && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
              요약 작업이 중단되었어요.
            </div>
          )}

          <div className="flex flex-col gap-6 sm:gap-10">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="w-full text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black outline-none leading-tight placeholder:text-neutral-400"
            />

            <div className="flex gap-5 items-center flex-wrap w-full lg:w-auto ">
              <DropDownButton
                options={projectNames}
                placeholder={
                  projectsLoading
                    ? "프로젝트 불러오는 중..."
                    : projectNameById(selectedProjectIdPage) ||
                      "프로젝트를 선택하세요"
                }
                width="w-full sm:w-[160px] lg:w-[200px]"
                onSelect={(name: string) =>
                  setSelectedProjectIdPage(nameToId.get(name) ?? null)
                }
              />

              <DropDownButton
                options={[
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
                ]}
                placeholder={selectedErrorType ?? "에러 종류를 선택하세요"}
                width="w-full sm:w-[200px] lg:w-[240px]"
                onSelect={(v: string) => setSelectedErrorType(v)}
              />

              <div className="w-full sm:w-auto min-w-[200px]">
                <CategoryTag value={selectedTags} onChange={setSelectedTags} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:gap-8">
            {reversedBlocks.map(({ block, originalIndex }) => (
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
                commandsFilter={(cmd) =>
                  cmd.keyCommand === "image" ? imageUploadCmd : cmd
                }
              />
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
                "private"
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

      <input ref={fileRef} type="file" accept="image/*" hidden />
    </div>
  );
};
export default TempWritePage;
