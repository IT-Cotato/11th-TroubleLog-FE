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
import PostSuccessModal from "@/pages/TempWrite/PostSuccessModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "@/constants/paths";
import { useProjectList } from "@/hooks/useProjectList";
import type { PostContentDto, SummaryTypeParam } from "@/models/post.model";
import {
  toCreatePostRequest,
  toEditPostRequest,
  type PostForm,
} from "@/mappers/postMapper";
import {
  createPost,
  startSummary,
  getSummaryStatus,
  cancelSummary,
  editPost,
  getTagsByKeyword,
  getPostDetail,
} from "@/api/post.api";

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
  postId?: number; // 이어쓰기 시 대상 포스트 ID
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
  | "COMPLETED";

export default function FreeFormWritePage() {
  // ------------ 기본 상태 ------------
  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingFreeformState };

  const [wasCompleted, setWasCompleted] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );
  const [blocks, setBlocks] = useState<BlockData[]>([
    { id: Date.now(), title: "", content: "", isSaved: false },
  ]);

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
    const pid = location.state?.postId;
    return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
  }, [location.state]);
  const isResume = resumePostId != null;

  // 초안 ID (새로 작성 시 create 결과, 이어쓰기 시 기존 id)
  const [draftPostId, setDraftPostId] = useState<number | null>(resumePostId);
  useEffect(() => {
    if (resumePostId) setDraftPostId(resumePostId);
  }, [resumePostId]);

  // 최초 1회 완료 여부 (completedAt 존재)
  useEffect(() => {
    (async () => {
      if (!isResume || !resumePostId) return;
      try {
        const detail: any = await getPostDetail(resumePostId);
        const completedAt = detail?.completedAt ?? null;
        setWasCompleted(Boolean(completedAt));
      } catch {
        // ignore
      }
    })();
  }, [isResume, resumePostId]);

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
  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
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
    isVisible: (meta?.visibility ?? "public") === "public",
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
  const upsertPost = async (maybeId: number | null, form: PostForm) => {
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

  // ------------ 임시 저장 (WRITING) ------------
  const handleClickTempSave = async (): Promise<boolean> => {
    if (isSaving) return false;
    setIsSaving(true);
    try {
      if (!validateBasic()) return false;

      const projectId =
        selectedProjectIdPage ??
        previewMeta?.projectId ??
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
        importance: previewMeta?.importance ?? 0,
        description: previewMeta?.description ?? "",
        visibility: previewMeta?.visibility ?? "public",
        projectId: Number(projectId),
        projectName:
          projectNameById(selectedProjectIdPage) ||
          previewMeta?.projectName ||
          location.state?.savePrefill?.projectName ||
          projectNameById(initialProjectId),
        thumbnail: previewMeta?.thumbnail ?? null,
      };

      const form = buildForm("WRITING", meta, canonicalTags);
      const id = await upsertPost(draftPostId, form);

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
    // 이미 완료된 포스트라면 수정 시에도 COMPLETED 유지
    const nextStatus: "WRITING" | "COMPLETED" = wasCompleted
      ? "COMPLETED"
      : "WRITING";
    const form = buildForm(nextStatus, meta, tags);

    try {
      const id = await upsertPost(draftPostId, form);
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
    setBlocks((prev) => prev.map((b) => ({ ...b, isSaved: true })));
    const quickMeta = resolveQuickMeta();
    if (!quickMeta) {
      setStatusMessage("프로젝트를 먼저 선택해주세요.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    await saveOriginal(quickMeta);
    await handleClickTempSave();
  };

  // End → 템플릿 선택 → 요약
  const handleEnd = () => {
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

  // 임시저장용 메타값 자동 구성 (모달 없이)
  const resolveQuickMeta = (): PostSavePayload | null => {
    const pid =
      previewMeta?.projectId ?? initialProjectId ?? projectList[0]?.id ?? null;

    if (pid == null) return null; // 프로젝트 없으면 임시저장 불가

    const pname =
      previewMeta?.projectName ??
      projectList.find((p) => p.id === pid)?.name ??
      "";

    return {
      importance: previewMeta?.importance ?? 0,
      thumbnail: previewMeta?.thumbnail ?? null,
      description: previewMeta?.description ?? "",
      visibility: previewMeta?.visibility ?? "public",
      projectId: pid,
      projectName: pname,
    };
  };

  // 저장 모달 → Next
  const handleNextInPostSaveModal = async (payload: PostSavePayload) => {
    setPreviewMeta(payload);
    setIsPostSaveModalOpen(false);

    if (nextAction === "SAVE") {
      await saveOriginal(payload);
      return;
    }

    // SUMMARY 경로: 우선 원본을 COMPLETED 로 저장 → 템플릿 선택 열기
    try {
      const tags = await canonicalizeTags(selectedTags);
      const form = buildForm("COMPLETED", payload, tags);
      const id = await upsertPost(draftPostId, form);
      setDraftPostId(id);
      setCreatedPostId(id);

      setIsTemplateSelectModalOpen(true);
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
      try {
        const targetId = (createdPostId ?? resumePostId) as number;
        const data: any = await getSummaryStatus(targetId, summaryTaskId);
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

          // 요약 성공 → postStatus = SUMMARIZED 로 반영
          try {
            const targetIdNum = createdPostId ?? resumePostId!;
            await editPost(targetIdNum, { postStatus: "SUMMARIZED" } as any);
          } catch (e) {
            console.error("포스트 SUMMARIZED 반영 실패(FreeForm):", e);
          }

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

  // ------------ UI ------------
  return (
    <div>
      <HeaderWoSearch />
      <div className="flex justify-center px-[360px] pt-[68px] items-start">
        <div className="flex-1 flex w-[1200px] flex-col gap-3">
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
                {/* 프로젝트 선택 */}
                <DropDownButton
                  options={projectNames}
                  placeholder={
                    projectsLoading
                      ? "프로젝트 불러오는 중..."
                      : projectNameById(selectedProjectIdPage) ||
                        "프로젝트를 선택하세요"
                  }
                  width="w-[340px]"
                  onSelect={(name) =>
                    setSelectedProjectIdPage(nameToId.get(name) ?? null)
                  }
                />

                {/* 에러 종류 */}
                <DropDownButton
                  options={errorOptions}
                  placeholder={selectedErrorType ?? "에러 종류를 선택하세요"}
                  width="w-[340px]"
                  onSelect={(selectedError) =>
                    setSelectedErrorType(selectedError)
                  }
                />

                {/* 태그 */}
                <CategoryTag value={selectedTags} onChange={setSelectedTags} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!canSave) {
                      setShowAlert(true);
                      setTimeout(() => setShowAlert(false), 1000);
                      return;
                    }
                    await handleGlobalSave();
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-purple-500 hover:bg-gray-100 disabled:opacity-50"
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
              defaultProjectId={initialProjectId ?? undefined}
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
                selectedProjectIdPage ??
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

          {isSuccessModalOpen && completedSummaryId != null && (
            <PostSuccessModal
              onClose={() => setIsSuccessModalOpen(false)}
              summaryId={completedSummaryId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
