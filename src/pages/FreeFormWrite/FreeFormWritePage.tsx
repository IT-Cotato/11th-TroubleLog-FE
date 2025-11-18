import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import HeaderWoSearch from "@/layouts/Header/HeaderWoSearch";
import DropDownButton from "@/shared/ui/Button/DropDownButton";
import CategoryTag from "@/shared/ui/Editor/CategoryTag";
import MDEditor, {
  commands,
  TextAreaTextApi,
  type ICommand,
  type TextState,
} from "@uiw/react-md-editor";
import PostSaveModal, {
  type PostSavePayload,
} from "@/shared/ui/Modal/PostSaveModal";
import PostLoadingModal from "@/shared/ui/Modal/PostLoadingModal";
import TemplateSelectModal from "@/shared/ui/Modal/TemplateSelectModal";
import PostSuccessModal from "@/shared/ui/Modal/PostSuccessModal";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import { useProjectList } from "@/hooks/useProjectList";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import {
  toCreatePostRequest,
  toEditPostRequest,
  type PostForm,
} from "@/entities/trouble/mappers/postMapper";
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
import { isAxiosError } from "axios";
import { startRefresh } from "@/api/axios";

// ---------- 타입 ----------
export type BlockData = {
  id: number;
  title: string;
  content: string;
  isSaved: boolean;
};

// 라우터에서 주입되는 상태
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

// 서버가 내려줄 수 있는 요약 상태들
export type SummaryStatus =
  | "PENDING"
  | "STARTED"
  | "PREPROCESSING"
  | "ANALYZING"
  | "POSTPROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export default function FreeFormWritePage() {
  // ------------ 기본 상태 ------------
  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingFreeformState };
  const params = useParams<{ id?: string; postId?: string }>();
  const paramPostId = useMemo(() => {
    const raw = params?.id ?? params?.postId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [params]);

  // const [wasCompleted, setWasCompleted] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );
  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: Date.now(), title: "", content: "", isSaved: false },
  ]);

  const [createdPostId, setCreatedPostId] = useState<number | null>(null);

  // 프로젝트 목록
  const { data: projectList = [], loading: projectsLoading } = useProjectList();
  const projectNames = useMemo(
    () => projectList.map((p) => p.name),
    [projectList]
  );
  const nameToId = useMemo(
    () => new Map(projectList.map((p) => [p.name, p.id])),
    [projectList]
  );
  const projectNameById = (id?: number | null) =>
    projectList.find((p) => p.id === id)?.name ?? "";

  // 최초 진입 시 선택된 프로젝트 추론
  const initialProjectId = useMemo(() => {
    return (
      location.state?.projectId ??
      location.state?.savePrefill?.projectId ??
      null
    );
  }, [location.state]);

  const [selectedProjectIdPage, setSelectedProjectIdPage] = useState<
    number | null
  >(null);
  useEffect(() => {
    if (initialProjectId != null)
      setSelectedProjectIdPage(Number(initialProjectId));
  }, [initialProjectId]);

  // 이어쓰기(수정) 여부 + 대상 포스트
  const resumePostId = useMemo(() => {
    const pid = location.state?.postId ?? paramPostId;
    return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
  }, [location.state, paramPostId]);
  const isResume = resumePostId != null;

  // 초안 ID (새로 작성 시 create 결과, 이어쓰기 시 기존 id)
  const [draftPostId, setDraftPostId] = useState<number | null>(resumePostId);
  useEffect(() => {
    if (resumePostId) setDraftPostId(resumePostId);
  }, [resumePostId]);

  // 모든 저장/요약 경로에서 이 ID만 사용
  const currentPostId = useMemo(
    () => createdPostId ?? draftPostId ?? resumePostId ?? paramPostId ?? null,
    [createdPostId, draftPostId, resumePostId, paramPostId]
  );

  // // 최초 1회 완료 여부 (completedAt 존재)
  // useEffect(() => {
  //   (async () => {
  //     if (!isResume || !resumePostId) return;
  //     try {
  //       const detail: any = await getPostDetail(resumePostId);
  //       const completedAt = detail?.completedAt ?? null;
  //       setWasCompleted(Boolean(completedAt));
  //     } catch {
  //       // ignore
  //     }
  //   })();
  // }, [isResume, resumePostId]);

  // ------------ 모달/알림 ------------
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [showAlert, setShowAlert] = useState(false);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [showSubtitleAlert, setShowSubtitleAlert] = useState(false);

  // ------------ 요약/상태 ------------
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [templateLabel, setTemplateLabel] = useState("");
  const [completedSummaryId, setCompletedSummaryId] = useState<number | null>(
    null
  );

  const [nextAction, setNextAction] = useState<"SUMMARY" | "SAVE" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);
  const closingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // 썸네일 상태
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
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
  const [detailLoaded, setDetailLoaded] = useState(!isResume);
  useEffect(() => {
    (async () => {
      if (!isResume || !resumePostId) return;
      try {
        const d: any = await getPostDetail(resumePostId);
        setCurrentThumbnail(d?.thumbnailImageUrl ?? null);
        const s = (d?.postStatus ?? d?.status) as
          | "WRITING"
          | "COMPLETED"
          | "SUMMARIZED"
          | undefined;
        setInitialPostStatus(s ?? null);
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
      } finally {
        setDetailLoaded(true);
      }
    })();
  }, [isResume, resumePostId]);

  // 프리필 + 포커스
  useEffect(() => {
    if (location.state?.editorType === "FREEFORM") {
      setTitle(location.state.title ?? "");
      setSelectedTags(location.state.tags ?? []);
      setSelectedErrorType(
        toErrorLabel(location.state.errorType) ??
          location.state.errorType ??
          null
      );
      if (location.state.blocks?.length) setBlocks(location.state.blocks);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  }, [location.state]);
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // ------------ DTO 변환 ------------
  const toContentDtoList = (items: BlockData[]): PostContentDto[] =>
    items
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map(
        (b, i) =>
          ({
            subTitle: (b.title ?? "").trim() || `Section ${i + 1}`,
            body: b.content,
            sequence: i + 1,
            authorType: "USER_WRITTEN",
            summaryType: "NONE",
          } as any)
      );

  // ------------ 태그 정규화 ------------
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
        .filter(Boolean) as string[];

      const exact = names.find((n) => n.toLowerCase() === q.toLowerCase());
      const pick = (exact ?? names[0]) as string | undefined;

      const normalized = String(pick ?? q).trim();
      if (!seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        out.push(normalized);
      }
    }
    return out;
  };

  // ------------ 서버 폼 빌드 ------------
  const buildForm = (
    postStatus: "COMPLETED" | "WRITING" | "SUMMARIZED",
    meta: PostSavePayload,
    postTags: string[]
  ): PostForm => ({
    title,
    introduction: meta?.description ?? "",
    postTags,
    isVisible: (meta?.visibility ?? "private") === "public",
    isSummaryCreated: false,
    postStatus,
    starRating: Number(meta?.importance ?? 0),
    templateType: "FREE_FORM",
    thumbnailImageUrl: meta?.thumbnail ?? undefined,
    projectId: Number(meta?.projectId ?? 0),
    errorTag: selectedErrorType ?? "",
    contents: toContentDtoList(blocks),
    checklistError: [],
    checklistReason: [],
  });

  // ------------ 검증 ------------
  const validateBasic = () => {
    if (!title.trim() || !selectedErrorType) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
      return false;
    }
    if (!blocks[0]?.content.trim()) {
      setShowBlockAlert(true);
      setTimeout(() => setShowBlockAlert(false), 1000);
      return false;
    }
    return true;
  };

  // ------------ upsert 유틸 ------------
  const upsertPost = async (
    maybeId: number | null,
    form: PostForm,
    opts?: { forceEdit?: boolean }
  ) => {
    // 수정 모드에선 어떤 경우에도 생성 금지
    const resolvedId = opts?.forceEdit
      ? resumePostId ?? paramPostId ?? maybeId
      : maybeId;

    if (resolvedId) {
      await editPost(resolvedId, toEditPostRequest(form) as any);
      return resolvedId;
    }

    const created: any = await createPost(toCreatePostRequest(form) as any);
    const newId = Number(
      created?.id ?? created?.data?.id ?? created?.content?.id
    );
    if (!Number.isFinite(newId)) throw new Error("생성된 포스트 ID 누락");
    return newId;
  };

  // ------------ 임시 저장 (WRITING) ------------
  const handleClickTempSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    if (isResume && !detailLoaded) {
      setStatusMessage(
        "문서 정보를 불러오는 중이에요. 잠시 후 다시 시도해주세요."
      );
      return false;
    }
    setIsSaving(true);
    try {
      if (!validateBasic()) return false;

      const projectId =
        selectedProjectIdPage ??
        previewMeta?.projectId ??
        detailPrefill?.projectId ??
        location.state?.savePrefill?.projectId ??
        initialProjectId ??
        null;

      if (!projectId) {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 1000);
        return false;
      }

      const canonicalTags = await canonicalizeTags(selectedTags);
      const meta: PostSavePayload = {
        importance: previewMeta?.importance ?? detailPrefill?.importance ?? 0,
        description:
          previewMeta?.description ?? detailPrefill?.description ?? "",
        visibility:
          previewMeta?.visibility ?? detailPrefill?.visibility ?? "private",
        projectId: Number(projectId),
        projectName:
          projectNameById(selectedProjectIdPage) ||
          previewMeta?.projectName ||
          detailPrefill?.projectName ||
          location.state?.savePrefill?.projectName ||
          projectNameById(initialProjectId),
        thumbnail: previewMeta?.thumbnail ?? detailPrefill?.thumbnail ?? null,
      };

      const form = buildForm(
        wasEverCompleted ? initialPostStatus ?? "COMPLETED" : "WRITING",
        meta,
        canonicalTags
      );
      const id = await upsertPost(currentPostId, form, { forceEdit: isResume });

      setDraftPostId(id);
      setCreatedPostId(id);
      setBlocks((prev) => prev.map((b) => ({ ...b, isSaved: true })));

      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 1000);
      return true;
    } catch (e) {
      console.error(e);
      setStatusMessage("임시 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ------------ 최종 저장 (원본 COMPLETED 저장) ------------
  const saveOriginal = async (meta: PostSavePayload) => {
    const tags = await canonicalizeTags(selectedTags);
    // 최종 저장은 COMPLETED 고정(단, 기존이 SUMMARIZED면 유지)
    const nextStatus: "COMPLETED" | "SUMMARIZED" =
      initialPostStatus === "SUMMARIZED" ? "SUMMARIZED" : "COMPLETED";
    const form = buildForm(nextStatus, meta, tags);

    try {
      const id = await upsertPost(currentPostId, form, { forceEdit: isResume });
      setDraftPostId(id);
      setCreatedPostId(id);

      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 1000);

      navigate(PATH.PROJECT_DETAIL(String(meta.projectId)), {
        state: { projectName: meta.projectName },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("saveOriginal error", status, data, err);

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

  // 상단 Save 버튼: 원본 저장 + 임시저장 보조
  const handleGlobalSave = async () => {
    if (!validateBasic()) return;
    await handleClickTempSave(); // 내부에서 저장 후 토스트만 띄움
  };

  // End → 템플릿 선택 → 요약
  const handleEnd = () => {
    if (isResume && !detailLoaded) {
      setStatusMessage(
        "문서 정보를 불러오는 중이에요. 잠시 후 다시 시도해주세요."
      );
      return false;
    }

    if (!validateBasic()) return;
    for (const block of blocks) {
      if (!(block.title ?? "").trim()) {
        setShowSubtitleAlert(true);
        setTimeout(() => setShowSubtitleAlert(false), 1000);
        return;
      }
    }
    setNextAction("SUMMARY");
    setIsPostSaveModalOpen(true);
  };

  // 저장 모달 → Next
  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    if (isResume && !detailLoaded) {
      setStatusMessage(
        "문서 정보를 불러오는 중이에요. 잠시 후 다시 시도해주세요."
      );
      return false;
    }
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (nextAction === "SAVE") {
      await saveOriginal(payload);
      return;
    }

    // SUMMARY 경로
    try {
      if (isResume) {
        // --- 수정 모드 ---
        setCreatedPostId(resumePostId); // 이후 흐름에서 사용
        setIsTemplateSelectModalOpen(true);
      } else {
        // --- 생성 모드(기존 동작) ---
        const tags = await canonicalizeTags(selectedTags);
        const form = buildForm("COMPLETED", payload, tags);
        const id = await upsertPost(currentPostId, form, {
          forceEdit: isResume,
        }); // create 또는 edit
        setDraftPostId(id);
        setCreatedPostId(id);
        setIsTemplateSelectModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage("문서 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  // startSummary 파라미터 호환
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

  // 템플릿 확정 → 요약 시작
  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);
    try {
      const postId = createdPostId ?? resumePostId;
      if (!postId) throw new Error("Post가 아직 생성되지 않았어요.");

      // 1) 요약 시작 전, 최신 내용으로 반드시 수정 API 호출
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
        thumbnail:
          previewMeta?.thumbnail ??
          detailPrefill?.thumbnail ??
          currentThumbnail ??
          null,
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

  // 폴링
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
      // 리프레시 진행 중이면 먼저 대기
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
            __skipGlobalAuthGuard: true, // 전역 가드 스킵(자체 처리)
          });

        let data: any;
        try {
          data = await fetchOnce();
        } catch (e) {
          // 401이면 리프레시 후 1회 재시도
          if (isAxiosError(e) && e.response?.status === 401) {
            const inflight = (window as any).__authRefreshPromise as Promise<
              string | null
            > | null;
            const token = inflight ? await inflight : await startRefresh();
            if (!token) throw e; // 실패 → 상위에서 처리(모달 닫기 등)

            data = await getSummaryStatus(targetId, summaryTaskId, {
              __skipGlobalAuthGuard: true,
              headers: { Authorization: `Bearer ${token}` },
            });
          } else {
            throw e;
          }
        }

        if (stopped) return;

        const p = Math.max(0, Math.min(100, data?.progress ?? 0));
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

  // 나중에 하기(요약 건너뛰고 미리보기/프로젝트로 이동)
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
    if (!validateBasic()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 1000);
      return;
    }
    // 프로젝트 정보가 없다면 저장 모달로 유도
    setIsTemplateSelectModalOpen(false);
    setIsPostSaveModalOpen(true);
    setStatusMessage("프로젝트를 먼저 선택해주세요.");
  };

  // 로딩 모달 닫기(요약 취소)
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
      setTimeout(() => setShowCancelAlert(false), 1000);
    } finally {
      closingRef.current = false;
    }
  };

  // 저장 가능 여부(버튼 비활성화용)
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

  // ------------ 블록 조작 ------------
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

  // ---------- (추가) 오토사이즈 상태/로직 ----------
  const [editorHeights, setEditorHeights] = useState<Record<number, number>>(
    {}
  );
  const editorWrapRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const autosizeFor = useCallback((blockId: number) => {
    const root = editorWrapRefs.current.get(blockId);
    if (!root) return;

    const ta = root.querySelector("textarea") as HTMLTextAreaElement | null;
    if (!ta) return;

    // textarea 실제 내용 높이 측정
    const prev = ta.style.height;
    ta.style.height = "auto";
    const taScrollH = ta.scrollHeight;

    // 크롬(툴바/바텀바/패딩/보더) 높이 합산
    const editorRoot = ta.closest(".w-md-editor") as HTMLElement | null;
    const toolbar = editorRoot?.querySelector(
      ".w-md-editor-toolbar"
    ) as HTMLElement | null;
    const bottombar = editorRoot?.querySelector(
      ".w-md-editor-bar"
    ) as HTMLElement | null;

    const toolbarH = toolbar?.offsetHeight ?? 0;
    const bottombarH = bottombar?.offsetHeight ?? 0;

    const taCS = getComputedStyle(ta);
    const taVPad =
      (parseFloat(taCS.paddingTop || "0") || 0) +
      (parseFloat(taCS.paddingBottom || "0") || 0);

    const taWrap = ta.parentElement as HTMLElement | null;
    const wrapCS = taWrap ? getComputedStyle(taWrap) : null;
    const wrapVPad = wrapCS
      ? (parseFloat(wrapCS.paddingTop || "0") || 0) +
        (parseFloat(wrapCS.paddingBottom || "0") || 0)
      : 0;

    const rootCS = editorRoot ? getComputedStyle(editorRoot) : null;
    const rootVPad =
      (rootCS ? parseFloat(rootCS.paddingTop || "0") : 0) +
      (rootCS ? parseFloat(rootCS.paddingBottom || "0") : 0);
    const rootVBorder =
      (rootCS ? parseFloat(rootCS.borderTopWidth || "0") : 0) +
      (rootCS ? parseFloat(rootCS.borderBottomWidth || "0") : 0);

    const chrome =
      toolbarH + bottombarH + taVPad + wrapVPad + rootVPad + rootVBorder + 16;

    const next = Math.max(300, Math.min(30000, taScrollH + chrome));
    setEditorHeights((prevHeights) =>
      prevHeights[blockId] === next
        ? prevHeights
        : { ...prevHeights, [blockId]: next }
    );

    ta.style.height = prev;
  }, []);

  useEffect(() => {
    const recalcAll = () => {
      for (const b of blocks) requestAnimationFrame(() => autosizeFor(b.id));
    };
    window.addEventListener("resize", recalcAll);
    return () => window.removeEventListener("resize", recalcAll);
  }, [blocks, autosizeFor]);

  useEffect(() => {
    // 블록 개수 변경 시 1프레임 뒤 초기 계산
    for (const b of blocks) requestAnimationFrame(() => autosizeFor(b.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks.length]);

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
      } finally {
        requestAnimationFrame(() => autosizeFor(blockId));
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
      } finally {
        requestAnimationFrame(() => autosizeFor(blockId));
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
        }
      };

      input.accept = "image/*";
      input.addEventListener("change", onPick, { once: true });
      input.click();
    },
  };

  // (기존 함수들 아래에 추가)

  const buildEditFormFromMeta = async (
    meta: PostSavePayload,
    opts?: { mode?: "temp" | "final" | "summary" } // temp: 임시 저장, final: 최종 저장, summary: 요약 시작 직전 저장
  ) => {
    const tags = await canonicalizeTags(selectedTags);
    const mode = opts?.mode ?? "temp";
    const nextStatus: "WRITING" | "COMPLETED" | "SUMMARIZED" = (() => {
      // 최종 저장이거나 요약 시작 직전에는 COMPLETED로 고정(단, 기존이 SUMMARIZED면 유지)
      if (mode === "final" || mode === "summary") {
        return initialPostStatus === "SUMMARIZED" ? "SUMMARIZED" : "COMPLETED";
      }
      // 임시 저장은 기존 정책 유지
      return wasEverCompleted ? initialPostStatus ?? "COMPLETED" : "WRITING";
    })();
    return buildForm(nextStatus, meta, tags);
  };

  // 템플릿 모달에서 '다음에/닫기' 등으로 요약을 시작하지 않을 때만 호출
  const persistEditsIfEditMode = async () => {
    if (!isResume || !resumePostId || !previewMeta) return;
    try {
      const form = await buildEditFormFromMeta(previewMeta, { mode: "final" });
      await editPost(resumePostId, toEditPostRequest(form) as any);
      setDraftPostId(resumePostId);
      setCreatedPostId(resumePostId); // 이후 미리보기/네비에 활용
      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 1000);
    } catch (e) {
      console.error("edit(save without summary) failed:", e);
      setStatusMessage(
        "수정 내용을 저장하지 못했어요. 잠시 후 다시 시도해주세요."
      );
    }
  };

  // ------------ UI ------------
  return (
    <div>
      <HeaderWoSearch />
      <div className="pt-12 sm:pt-16">
        <div className="container mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex-1 flex w-full max-w-[1200px] mx-auto flex-col gap-3">
            {/* Alerts */}
            {showAlert && (
              <div className="fixed top-[120px] left-1/2 -translate-x-1/2 z-50 bg-purple-100 border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow">
                제목, 프로젝트, 에러 종류, 첫 블록 내용을 모두 입력해주세요.
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
              <div
                contentEditable
                spellCheck={false}
                suppressContentEditableWarning
                onInput={(e) => setTitle(e.currentTarget.textContent || "")}
                data-placeholder="제목을 입력하세요."
                className="
    title-editable
    w-[1100px] md:w-[1030px]
    text-2xl sm:text-3xl md:text-4xl lg:text-5xl
    font-bold text-black outline-none leading-tight
    whitespace-pre-wrap break-words
    relative
  "
              ></div>
              <div className="flex w-full max-w-[1200px] justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-end justify-between">
                    <div className="flex gap-3 items-center flex-wrap max-w-[1100px] md:max-w-[900px] lg:w-auto">
                      {/* 프로젝트 선택 */}
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

                      {/* 에러 종류 */}
                      <DropDownButton
                        options={errorOptions}
                        placeholder={
                          selectedErrorType ?? "에러 종류를 선택하세요"
                        }
                        width="w-full sm:w-[180px] lg:w-[220px]"
                        onSelect={(selectedError) =>
                          setSelectedErrorType(selectedError)
                        }
                      />

                      {/* 태그 */}
                      <div className="w-full sm:w-auto min-w-[200px]">
                        <CategoryTag
                          value={selectedTags}
                          onChange={setSelectedTags}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 w-full lg:w-auto">
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <button
                          onClick={async () => {
                            if (!canSave) {
                              setShowAlert(true);
                              setTimeout(() => setShowAlert(false), 1000);
                              return;
                            }
                            await handleGlobalSave();
                          }}
                          disabled={isSaving || (isResume && !detailLoaded)}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100 disabled:opacity-50 w-full sm:w-auto"
                        >
                          Save
                        </button>

                        <button
                          onClick={handleEnd}
                          disabled={isResume && !detailLoaded}
                          className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm hover:bg-purple-600 w-full sm:w-auto"
                        >
                          End
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 블록 리스트 */}
            {blocks.map((block) => (
              <div key={block.id} className="w-full">
                <div className="w-full flex items-end h-[50px] mb-2">
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) =>
                      handleChangeBlock(block.id, "title", e.target.value)
                    }
                    placeholder="소제목을 입력하세요."
                    className="flex-1 px-0 py-2 border-none rounded font-bold text-black text-xl sm:text-2xl"
                  />
                </div>

                {/* 🔹 오토사이즈 래퍼 + height 주입 */}
                <div
                  ref={(el) => {
                    if (el) editorWrapRefs.current.set(block.id, el);
                    else editorWrapRefs.current.delete(block.id);
                    requestAnimationFrame(() => autosizeFor(block.id));
                  }}
                  className="mt-2"
                >
                  <div data-color-mode="light">
                    <MDEditor
                      value={block.content}
                      onChange={(val?: string) => {
                        handleChangeBlock(block.id, "content", val ?? "");
                        requestAnimationFrame(() => autosizeFor(block.id));
                      }}
                      preview="edit"
                      height={editorHeights[block.id] ?? 300}
                      textareaProps={{
                        onPaste: (
                          e: React.ClipboardEvent<HTMLTextAreaElement>
                        ) => {
                          handlePasteImage(block.id, e);
                          requestAnimationFrame(() => autosizeFor(block.id));
                        },
                        onDrop: (e: React.DragEvent<HTMLTextAreaElement>) => {
                          handleDropImage(block.id, e);
                          requestAnimationFrame(() => autosizeFor(block.id));
                        },
                        onInput: () =>
                          requestAnimationFrame(() => autosizeFor(block.id)),
                        onDragOver: (
                          e: React.DragEvent<HTMLTextAreaElement>
                        ) => {
                          if (e.dataTransfer?.types?.includes("Files")) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        },
                      }}
                      commandsFilter={(cmd: ICommand): ICommand =>
                        cmd.keyCommand === "image" ? imageUploadCmd : cmd
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddBlock}
              disabled={blocks.length >= 20}
              className="border-2 border-dashed p-4 sm:p-6 rounded-xl w-full h-[80px] sm:h-[100px] mt-4 text-gray-500 text-lg sm:text-xl hover:bg-gray-50 disabled:opacity-50"
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
                onConfirm={(type, label) => handleConfirmTemplate(type, label)}
                onClose={async () => {
                  try {
                    await persistEditsIfEditMode(); // 요약 안 함 → 수정 저장
                  } catch (e) {
                    console.error("Failed to persist edits on close:", e);
                  } finally {
                    setIsTemplateSelectModalOpen(false);
                  }
                }}
                onLater={async () => {
                  try {
                    await persistEditsIfEditMode(); // 요약 안 함 → 수정 저장
                    await handleLater();
                  } catch (e) {
                    console.error("Failed to persist edits or navigate:", e);
                    setStatusMessage("저장 중 오류가 발생했습니다.");
                  }
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

      <input ref={fileRef} type="file" hidden />
    </div>
  );
}
