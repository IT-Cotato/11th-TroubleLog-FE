import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import HeaderWoSearch from "@/layouts/Header/HeaderWoSearch";
import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import type EditorInstance from "@toast-ui/editor";
import PostSaveModal, {
  type PostSavePayload,
} from "@/shared/ui/Modal/PostSaveModal";
import TemplateSelectModal from "@/shared/ui/Modal/TemplateSelectModal";
import PostSuccessModal from "@/shared/ui/Modal/PostSuccessModal";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import { useProjectSelection } from "@/shared/hooks/useProjectSelection";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import {
  toCreatePostRequest,
  toEditPostRequest,
  type PostForm,
} from "@/entities/trouble/mappers/postMapper";
import { createPost, editPost, getPostDetail } from "@/api/post.api";
import { uploadImage } from "@/api/image.api";
import ConfirmDeleteModal from "@/shared/ui/Modal/ConfirmDeleteModal";
import { canonicalizeTags } from "@/shared/utils/canonicalizeTags";
import { ERROR_OPTIONS, toErrorLabel } from "@/shared/utils/errorCodeLabel";
import { useSummaryJobStore } from "@/store/useSummaryJobStore";
import { useWriteModals } from "@/shared/hooks/useWriteModals";
import { useWriteSummaryFlow } from "@/shared/hooks/useWriteSummaryFlow";
import { WriteToast } from "@/shared/ui/WriteToast";
import { WritePageMetaSection } from "@/shared/components/WritePageMetaSection";
import type { SummaryStatus } from "@/shared/ui/Modal/PostLoadingModal";

import { FiChevronUp } from "react-icons/fi";

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
      location.state?.projectId ??
      location.state?.savePrefill?.projectId ??
      null,
  });

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
  const {
    isPostSaveModalOpen,
    setIsPostSaveModalOpen,
    isTemplateSelectModalOpen,
    setIsTemplateSelectModalOpen,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    showAlert,
    setShowAlert,
    showSaveAlert,
    setShowSaveAlert,
    showCancelAlert,
    setShowCancelAlert,
  } = useWriteModals();
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [showSubtitleAlert, setShowSubtitleAlert] = useState(false);

  // ------------ 요약/상태 ------------
  const [previewMeta, setPreviewMeta] = useState<PostSavePayload | null>(null);
  const [summaryTaskId, setSummaryTaskId] = useState<string | null>(null);
  const [summaryProgress, setSummaryProgress] = useState(0);
  const [, setSummaryStatus] = useState<SummaryStatus | null>(null);
  const [, setStatusMessage] = useState<string>("");
  const [completedSummaryId, setCompletedSummaryId] = useState<number | null>(
    null
  );

  const [nextAction, setNextAction] = useState<"SUMMARY" | "SAVE" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);
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

  // 블록 삭제용 상태
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 상단 이동 플로팅 버튼 표시 여부
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 블록 삭제 요청 → 모달 오픈
  const handleRequestDeleteBlock = (id: number) => {
    if (blocks.length <= 1) {
      // 마지막 블록은 삭제하지 못하게 막기 (원하면 토스트 문구만 바꿔도 됨)
      setShowBlockAlert(true);
      setTimeout(() => setShowBlockAlert(false), 1000);
      return;
    }
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  // 실제 블록 삭제
  const handleConfirmDeleteBlock = () => {
    if (deleteTargetId == null) return;
    setBlocks((prev) => prev.filter((b) => b.id !== deleteTargetId));
    setDeleteTargetId(null);
    setIsDeleteModalOpen(false);
  };

  const handleCloseDeleteModal = () => {
    setDeleteTargetId(null);
    setIsDeleteModalOpen(false);
  };

  // 상단으로 스크롤
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 스크롤 위치에 따라 플로팅 버튼 노출
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 수정 모드 초기 진입 시 상세 조회에서 가져오기
  const [detailLoaded, setDetailLoaded] = useState(!isResume);
  useEffect(() => {
    (async () => {
      if (!isResume || !resumePostId) return;
      try {
        const d: any = await getPostDetail(resumePostId);
        setTitle(d?.title ?? "");
        const contents = Array.isArray(d?.contents) ? d.contents : [];
        setBlocks(
          contents.length > 0
            ? contents.map((c: any, idx: number) => ({
                id: c.id ?? idx,
                title: c.subTitle ?? "",
                content: c.body ?? "",
                isSaved: true,
              }))
            : [{ id: Date.now(), title: "", content: "", isSaved: false }]
        );
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

  const { runConfirmTemplate } = useWriteSummaryFlow({
    postId: createdPostId ?? resumePostId,
    summaryTaskId,
    summaryProgress,
    setSummaryTaskId,
    setSummaryProgress,
    setSummaryStatus,
    setStatusMessage,
    setIsTemplateSelectModalOpen,
    setCreatedPostId,
    setShowCancelAlert,
    cancelAlertDuration: 1000,
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
        thumbnail:
          previewMeta?.thumbnail ??
          detailPrefill?.thumbnail ??
          currentThumbnail ??
          null,
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
      useSummaryJobStore.getState().reset();
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

  const summaryPostId = createdPostId ?? resumePostId;
  const jobPhase = useSummaryJobStore((s) => s.phase);

  useEffect(() => {
    if (jobPhase !== "completed") return;
    const st = useSummaryJobStore.getState();
    if (st.postId !== summaryPostId) return;
    if (!summaryTaskId || st.taskId !== summaryTaskId) return;

    if (typeof st.postSummaryId === "number") {
      setCompletedSummaryId(st.postSummaryId);
      setSummaryTaskId(null);
      setIsSuccessModalOpen(true);
      useSummaryJobStore.getState().reset();
    } else {
      setSummaryTaskId(null);
      useSummaryJobStore.getState().reset();
    }
  }, [jobPhase, summaryPostId, summaryTaskId]);

  useEffect(() => {
    if (jobPhase !== "failed") return;
    const st = useSummaryJobStore.getState();
    if (st.postId !== summaryPostId) return;
    if (!summaryTaskId || st.taskId !== summaryTaskId) return;
    setSummaryTaskId(null);
    useSummaryJobStore.getState().reset();
  }, [jobPhase, summaryPostId, summaryTaskId]);

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

  // ---------- Toast UI Editor refs ----------
  const editorRefs = useRef<Map<number, EditorInstance>>(new Map());
  const hookedEditors = useRef<WeakSet<object>>(new WeakSet());

  // 이미지 업로드 - Toast UI Editor hook 설정
  const setupImageUploadHook = useCallback((editor: EditorInstance) => {
    // 인스턴스당 1회만 hook 등록
    if (hookedEditors.current.has(editor as unknown as object)) return;
    hookedEditors.current.add(editor as unknown as object);

    editor.addHook(
      "addImageBlobHook",
      async (blob: Blob, callback: (url: string, altText?: string) => void) => {
        try {
          const file = blob as File;
          const url = await uploadImage(file);
          callback(url, "image");
        } catch {
          setStatusMessage("이미지 업로드에 실패했어요.");
        }
      }
    );
  }, []);

  // 각 블록별로 기본 텍스트 제거 처리 여부 추적
  const processedBlocks = useRef<Set<number>>(new Set());

  // 기본 텍스트 제거 함수 (에디터 인스턴스가 처음 생성될 때만 실행)
  const removeDefaultTextForBlock = useCallback(
    (blockId: number) => {
      // 이미 처리한 블록은 건너뛰기
      if (processedBlocks.current.has(blockId)) return;

      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      const editor = editorRefs.current.get(blockId);
      if (!editor) return;

      // 이미 초기값이 있으면 절대 지우지 않기 (데이터 손실 방지)
      if ((block.content ?? "").trim().length > 0) {
        processedBlocks.current.add(blockId); // 처리 완료로 표시
        return;
      }

      try {
        const currentMarkdown = editor.getMarkdown();
        const defaultTexts = ["Write", "Preview", "Markdown", "WYSIWYG"];
        const trimmedMarkdown = currentMarkdown.trim();

        // 기본 텍스트만 있거나, 기본 텍스트로 시작하는 경우 제거
        const isDefaultText =
          defaultTexts.some((defaultText) => trimmedMarkdown === defaultText) ||
          (defaultTexts.some((defaultText) =>
            trimmedMarkdown.startsWith(defaultText)
          ) &&
            trimmedMarkdown.split("\n").length > 0 &&
            defaultTexts.includes(trimmedMarkdown.split("\n")[0].trim()));

        if (isDefaultText) {
          editor.setMarkdown("");
        }
        processedBlocks.current.add(blockId); // 처리 완료로 표시
      } catch {
        // 에러 발생 시 무시
      }
    },
    [blocks]
  );

  // 각 블록별 ref 콜백을 useCallback으로 고정하여 불필요한 detach/attach 방지
  const createEditorRefCallback = useCallback(
    (blockId: number) => (editor: any | null) => {
      if (!editor) {
        editorRefs.current.delete(blockId);
        return;
      }
      const instance = editor.getInstance();
      editorRefs.current.set(blockId, instance);
      setupImageUploadHook(instance);

      // 최초 세팅 시에만(또는 block.content가 비어있을 때만) 기본 텍스트 제거
      const block = blocks.find((b) => b.id === blockId);
      if (
        block &&
        !processedBlocks.current.has(blockId) &&
        (block.content ?? "").trim().length === 0
      ) {
        setTimeout(() => removeDefaultTextForBlock(blockId), 0);
      } else if (block && !processedBlocks.current.has(blockId)) {
        // 초기값이 있으면 처리 완료로 표시
        processedBlocks.current.add(blockId);
      }
    },
    [blocks, setupImageUploadHook, removeDefaultTextForBlock]
  );

  // 각 블록별 ref 콜백을 메모이제이션
  const editorRefCallbacks = useMemo(() => {
    const callbacks = new Map<number, (editor: any | null) => void>();
    blocks.forEach((block) => {
      callbacks.set(block.id, createEditorRefCallback(block.id));
    });
    return callbacks;
  }, [blocks, createEditorRefCallback]);

  // Editor content 동기화
  useEffect(() => {
    blocks.forEach((block) => {
      const editor = editorRefs.current.get(block.id);
      if (editor) {
        const currentMarkdown = editor.getMarkdown();
        if (currentMarkdown !== block.content) {
          editor.setMarkdown(block.content);
        }
      }
    });
  }, [blocks]);

  // (기존 함수들 아래에 추가)

  const buildEditFormFromMeta = async (
    meta: PostSavePayload,
    opts?: { mode?: "temp" | "final" | "summary" }
  ) => {
    const tags = await canonicalizeTags(selectedTags);
    const mode = opts?.mode ?? "temp";
    const nextStatus: "WRITING" | "COMPLETED" | "SUMMARIZED" = (() => {
      if (mode === "final" || mode === "summary") {
        return initialPostStatus === "SUMMARIZED" ? "SUMMARIZED" : "COMPLETED";
      }
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
      setCreatedPostId(resumePostId);
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
            <WriteToast
              show={showAlert}
              message="제목, 프로젝트, 에러 종류, 첫 블록 내용을 모두 입력해주세요."
            />
            <WriteToast
              show={showBlockAlert}
              message="첫 번째 블록의 내용이 비어있습니다."
            />
            <WriteToast show={showSaveAlert} message="저장되었습니다." variant="success" />
            <WriteToast show={showCancelAlert} message="요약 작업이 중단되었어요." />
            <WriteToast show={showSubtitleAlert} message="소제목을 입력해주세요." />

            <WritePageMetaSection
              title={title}
              onTitleChange={setTitle}
              titleRef={titleInputRef}
              projectNames={projectNames}
              projectsLoading={projectsLoading}
              selectedProjectId={selectedProjectIdPage}
              onProjectSelect={setSelectedProjectIdPage}
              projectNameById={projectNameById}
              nameToId={nameToId}
              errorOptions={ERROR_OPTIONS}
              selectedErrorType={selectedErrorType}
              onErrorTypeSelect={setSelectedErrorType}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              actions={
                <button
                  onClick={handleEnd}
                  disabled={isResume && !detailLoaded}
                  className="pt-2 pr-6 pb-2 pl-6 bg-primary text-white rounded-full text-head-16-semibold hover:bg-purple-600 w-full sm:w-auto"
                >
                  작성 완료
                </button>
              }
            />

            {/* 블록 리스트 */}
            {blocks.map((block) => (
              <div key={block.id} className="w-full">
                {/* 제목 + 삭제 버튼 라인 */}
                <div className="w-full flex items-center justify-between h-[50px] mb-2">
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) =>
                      handleChangeBlock(block.id, "title", e.target.value)
                    }
                    placeholder="소제목을 입력하세요."
                    className="flex-1 px-0 py-2 border-none rounded font-bold text-black text-xl sm:text-2xl"
                  />
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteBlock(block.id)}
                      className="ml-3 text-sm text-gray-400 hover:text-red-500"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <Editor
                    ref={editorRefCallbacks.get(block.id)}
                    initialValue={block.content || ""}
                    onChange={() => {
                      const editor = editorRefs.current.get(block.id);
                      if (editor) {
                        const markdown = editor.getMarkdown();
                        handleChangeBlock(block.id, "content", markdown);
                      }
                    }}
                    height="300px"
                    initialEditType="markdown"
                    previewStyle="vertical"
                    usageStatistics={false}
                  />
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

            {/* 하단 저장하기 버튼 */}
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
              className="mt-6 w-full h-[56px] rounded-xl bg-purple-100 text-purple-700 text-base sm:text-lg font-semibold hover:bg-purple-200 disabled:opacity-50"
            >
              저장하기
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

            {isSuccessModalOpen && completedSummaryId != null && (
              <PostSuccessModal
                onClose={() => setIsSuccessModalOpen(false)}
                summaryId={completedSummaryId}
                postId={createdPostId ?? resumePostId ?? undefined}
              />
            )}

            {isDeleteModalOpen && (
              <ConfirmDeleteModal
                title="블록 삭제"
                description="정말 삭제하시겠습니까?"
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDeleteBlock}
              />
            )}

            {/* 우측 하단 상단 이동 플로팅 버튼 */}
            {showScrollTop && (
              <button
                type="button"
                onClick={handleScrollTop}
                className="fixed bottom-10 right-20 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50"
              >
                <FiChevronUp className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
