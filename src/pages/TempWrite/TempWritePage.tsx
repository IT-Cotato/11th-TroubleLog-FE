import { useEffect, useState, useRef, useMemo } from "react";
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
import PostSuccessModal from "./PostSuccessModal";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH } from "@/constants/paths";

import {
  toCreatePostRequest,
  toEditPostRequest,
  type PostForm,
} from "@/mappers/postMapper";

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

// ---------- 상태 타입 ----------
type IncomingTemplateState = {
  editorType?: "TEMPLATE";
  title?: string;
  tags?: string[];
  errorType?: string | null; // 서버 코드 or 라벨
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

  initialChecklistErrorIds?: number[];
  initialChecklistReasonIds?: number[];
};

// ---------- 에러 라벨/코드 매핑 ----------
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

// ---------- 체크리스트 보강(질문 템플릿 결합) ----------
const enrichBlocksWithChecklist = (blocks: BlockData[]): BlockData[] => {
  return blocks.map((b, i) => {
    const matched =
      questionData.find(
        (q) =>
          q.question === (b as any).question ||
          q.question === (b as any).checklistTitle
      ) ?? questionData[i];

    return {
      ...b,
      question: (b as any).question ?? matched?.question ?? `질문 ${i + 1}`,
      checklistItems:
        (b as any).checklistItems && (b as any).checklistItems.length > 0
          ? (b as any).checklistItems
          : matched?.checklistItems ?? [],
      checklistTitle: (b as any).checklistTitle ?? matched?.title ?? "",
      checklist: Array.isArray((b as any).checklist)
        ? (b as any).checklist
        : [],
      isSaved: (b as any).isSaved ?? false,
    } as BlockData;
  });
};

// ---------- 페이지 ----------
const TempWritePage = () => {
  const [wasCompleted, setWasCompleted] = useState(false);

  // 기본 상태
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedErrorType, setSelectedErrorType] = useState<string | null>(
    null
  );

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
    | "COMPLETED";
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string>("");

  // 더블클릭 가드
  const [isCreating, setIsCreating] = useState(false);
  const [isStartingSummary, setIsStartingSummary] = useState(false);
  const closingRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation() as { state?: IncomingTemplateState };
  const initialProjectId =
    location.state?.projectId ?? location.state?.savePrefill?.projectId ?? null;

  const { data: projectList = [], loading: projectsLoading } = useProjectList();

  // 이어쓰기(수정) 판단
  const resumePostId = useMemo(() => {
    const pid = location.state?.postId;
    return typeof pid === "number" && Number.isFinite(pid) ? pid : null;
  }, [location.state]);

  useEffect(() => {
    (async () => {
      if (!resumePostId) return;
      try {
        const detail: any = await getPostDetail(resumePostId);
        const completedAt = detail?.completedAt ?? null;
        setWasCompleted(Boolean(completedAt));
      } catch {
        // 실패해도 기본값(false)
      }
    })();
  }, [resumePostId]);

  // 임시저장/수정 공통으로 쓸 현재 작업중인 포스트 ID
  const [draftPostId, setDraftPostId] = useState<number | null>(resumePostId);
  useEffect(() => {
    // 라우팅으로 이어쓰기가 들어오면 동기화
    if (resumePostId) setDraftPostId(resumePostId);
  }, [resumePostId]);

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
        setBlocks(enrichBlocksWithChecklist(location.state.blocks));
      }
    }
  }, [location.state]);

  // 서버에서 넘어온 체크리스트 ID를 라벨로 변환하여 블록에 반영 (1회)
  const appliedChecklistPrefillRef = useRef(false);
  useEffect(() => {
    if (appliedChecklistPrefillRef.current) return;
    if (!blocks.length) return;

    const errIds = location.state?.initialChecklistErrorIds ?? [];
    const reasonIds = location.state?.initialChecklistReasonIds ?? [];
    if (!errIds.length && !reasonIds.length) return;

    const errLabels = errIds
      .map((id) => ERROR_ID_TO_LABEL[id])
      .filter(Boolean) as string[];
    const reasonLabels = reasonIds
      .map((id) => REASON_ID_TO_LABEL[id])
      .filter(Boolean) as string[];

    setBlocks((prev) =>
      prev.map((b) => {
        const items = ((b as any).checklistItems ?? []) as string[];
        if (!items.length) return b;
        // 이 블록이 가진 항목 중 서버에서 체크된 라벨만 선택
        const picked = [
          ...errLabels.filter((l) => items.includes(l)),
          ...reasonLabels.filter((l) => items.includes(l)),
        ];
        if (!picked.length) return b;
        return { ...b, checklist: Array.from(new Set(picked)) };
      })
    );

    appliedChecklistPrefillRef.current = true;
  }, [
    blocks.length,
    location.state?.initialChecklistErrorIds,
    location.state?.initialChecklistReasonIds,
  ]);

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

  // ---------- 체크리스트 → ID 맵 ----------
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

  // 역매핑 (ID -> 라벨)
  const ERROR_ID_TO_LABEL: Record<number, string> = Object.fromEntries(
    Object.entries(CHECKLIST_ERROR_ID_MAP).map(([label, id]) => [id, label])
  );
  const REASON_ID_TO_LABEL: Record<number, string> = Object.fromEntries(
    Object.entries(CHECKLIST_REASON_ID_MAP).map(([label, id]) => [id, label])
  );

  const buildChecklistIdsFromBlocks = (bs: BlockData[]) => {
    const errorIds = new Set<number>();
    const reasonIds = new Set<number>();
    for (const b of bs) {
      const items: string[] = Array.isArray((b as any).checklist)
        ? ((b as any).checklist as string[])
        : [];
      for (const label of items) {
        const eId = CHECKLIST_ERROR_ID_MAP[label];
        const rId = CHECKLIST_REASON_ID_MAP[label];
        if (typeof eId === "number") errorIds.add(eId);
        if (typeof rId === "number") reasonIds.add(rId);
      }
    }
    return {
      checklistErrorIds: [...errorIds],
      checklistReasonIds: [...reasonIds],
    };
  };

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

  const buildFormDevelop = (
    postStatus: UiPostStatus,
    meta: PostSavePayload,
    postTags: string[]
  ): PostForm => {
    const { checklistErrorIds, checklistReasonIds } =
      buildChecklistIdsFromBlocks(blocks);

    return {
      title,
      introduction: meta?.description ?? "",
      postTags,
      isVisible: (meta?.visibility ?? "public") === "public",
      isSummaryCreated: false,
      postStatus,
      starRating: meta?.importance ?? 0,
      templateType: "GUIDELINE",
      thumbnailImageUrl: meta?.thumbnail ?? undefined,
      projectId: Number(meta?.projectId ?? 0),
      errorTag: selectedErrorType ?? "",
      contents: toContentDtoList(blocks),
      checklistError: checklistErrorIds,
      checklistReason: checklistReasonIds,
    };
  };

  type UiPostStatus = "WRITING" | "COMPLETED" | "SUMMARIZED";
  type ServerPostStatus = "WRITING" | "COMPLETED" | "SUMMARIZED";
  const toServerPostStatus = (s: UiPostStatus): ServerPostStatus =>
    s === "COMPLETED"
      ? "COMPLETED"
      : s === "SUMMARIZED"
      ? "SUMMARIZED"
      : "WRITING";

  const toServerContentDtoList = (bs: BlockData[]) =>
    bs
      .filter((b) => (b.content ?? "").trim().length > 0)
      .map((b, i) => ({
        subTitle: (b as any).question,
        body: b.content,
        sequence: i + 1,
      }));

  const buildFormServer = (
    postStatus: UiPostStatus,
    meta: PostSavePayload,
    postTags: string[]
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
      contentDtoList: toServerContentDtoList(blocks),
      postTags,

      checklistError: checklistErrorIds,
      checklistReason: checklistReasonIds,
    };
  };

  // 임시저장용 메타 생성
  const resolveQuickMeta = (): PostSavePayload | null => {
    const pid =
      previewMeta?.projectId ?? initialProjectId ?? projectList[0]?.id ?? null;
    if (pid == null) return null;

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

  // ---------- create/edit 호환 저장 ----------
  const saveDraftCompat = async (
    postStatus: UiPostStatus,
    meta: PostSavePayload,
    postTags: string[]
  ): Promise<number> => {
    const targetId = draftPostId ?? resumePostId ?? null;
    try {
      const req = buildFormServer(postStatus, meta, postTags);
      if (targetId) {
        const res: any = await editPost(targetId, req as any);
        return Number(res?.id ?? res?.data?.id ?? res?.content?.id ?? targetId);
      } else {
        const res: any = await createPost(req as any);
        const newId = Number(res?.id ?? res?.data?.id ?? res?.content?.id);
        setDraftPostId(newId);
        return newId;
      }
    } catch (e) {
      console.warn(
        "[saveDraftCompat] server 스키마 실패 → develop 스키마 폴백",
        e
      );
    }

    // 2) 폴백: develop 스키마(여기도 ID 반영되도록 수정 1 적용되어야 함)
    const form = buildFormDevelop(postStatus, meta, postTags);
    if (targetId) {
      const res: any = await editPost(targetId, toEditPostRequest(form) as any);
      return Number(res?.id ?? res?.data?.id ?? res?.content?.id ?? targetId);
    } else {
      const res: any = await createPost(toCreatePostRequest(form) as any);
      const newId = Number(res?.id ?? res?.data?.id ?? res?.content?.id);
      setDraftPostId(newId);
      return newId;
    }
  };

  // ---------- startSummary 호환 ----------
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

  // ---------- 변경 핸들러 ----------
  const handleChangeBlockContent = (
    index: number,
    updated: Partial<BlockData>
  ) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      return next;
    });
  };
  const handleToggleChecklist = (
    index: number,
    item: string,
    checked: boolean
  ) => {
    setBlocks((prev) => {
      const next = [...prev];
      const checklist = new Set<string>((next[index] as any).checklist ?? []);
      if (checked) checklist.add(item);
      else checklist.delete(item);
      (next[index] as any).checklist = Array.from(checklist);
      return next;
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
      } as any;
      const next = [...prev, newBlock];
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const handleEnd = () => {
    if (!title.trim() || !selectedErrorType || !blocks[0]?.content?.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }
    setIsPostSaveModalOpen(true);
  };
  const handleShowSaveAlert = async () => {
    // 기본 검증 (제목/에러/첫 블록)
    if (!title.trim() || !selectedErrorType || !blocks[0]?.content?.trim()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const meta = resolveQuickMeta();
    if (!meta) {
      alert("프로젝트를 먼저 선택해주세요.");
      return;
    }

    try {
      const canonicalTags = await canonicalizeTags(selectedTags);
      // 이미 완료된 포스트면 COMPLETED 상태로 수정 저장
      const nextStatus: UiPostStatus = wasCompleted ? "COMPLETED" : "WRITING";
      const id = await saveDraftCompat(nextStatus, meta, canonicalTags);
      setCreatedPostId((prev) => prev ?? id);
      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 3000);
    } catch (e) {
      console.error(e);
      setStatusMessage("임시 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  // ---------- 저장 모달 Next ----------
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
      const canonicalTags = await canonicalizeTags(selectedTags);
      const postId = await saveDraftCompat("COMPLETED", payload, canonicalTags);
      setCreatedPostId(postId);
      setIsTemplateSelectModalOpen(true);
    } catch (e) {
      console.error(e);
      setStatusMessage("문서 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  // ---------- 템플릿 확정 → 요약 ----------
  const handleConfirmTemplate = async (
    type: SummaryTypeParam,
    label: string
  ) => {
    if (isStartingSummary) return;
    setIsStartingSummary(true);
    try {
      if (!createdPostId && !resumePostId)
        throw new Error("Post가 아직 생성되지 않았어요.");

      setIsTemplateSelectModalOpen(false);
      setIsLoadingModalOpen(true);
      setSummaryProgress(0);
      setSummaryStatus(null);
      setStatusMessage("");
      setTemplateLabel(label);

      const taskId = await startSummaryCompat(
        createdPostId ?? (resumePostId as number),
        type
      );
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
      try {
        const targetId = (createdPostId ?? resumePostId) as number;
        const data: any = await getSummaryStatus(targetId, summaryTaskId);
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

          // 요약 성공 → postStatus = SUMMARIZED 로 반영
          const targetId = (createdPostId ?? resumePostId) as number;
          try {
            // 1) 부분 업데이트 시도
            await editPost(targetId, { postStatus: "SUMMARIZED" } as any);
          } catch {
            // 2) 전체 폼 폴백
            try {
              const meta = resolveQuickMeta?.() ?? previewMeta; // 페이지에 있는 메타 사용
              if (meta) {
                const canonicalTags = await canonicalizeTags(selectedTags);
                const req = buildFormServer
                  ? buildFormServer("SUMMARIZED", meta, canonicalTags)
                  : toEditPostRequest(
                      buildFormDevelop("SUMMARIZED", meta as any, canonicalTags)
                    );
                await editPost(targetId, req as any);
              }
            } catch (e) {
              console.error("포스트 SUMMARIZED 반영 실패:", e);
            }
          }

          // feat: postSummaryId 있으면 성공 모달
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
    setTimeout(() => setShowAlert(false), 3000);
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

  // ---------- UI ----------
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

          {/* 제목/태그 */}
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
                width="w-[340px] h-[36px]"
                onSelect={(selectedError) =>
                  setSelectedErrorType(selectedError)
                }
              />
              <CategoryTag value={selectedTags} onChange={setSelectedTags} />
            </div>
          </div>

          {/* 블록들(최신이 위) */}
          <div>
            {[...blocks].reverse().map((block, index) => {
              const originalIndex = blocks.length - 1 - index;
              return (
                <EditorBlock
                  key={(block as any).id}
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
};

export default TempWritePage;
