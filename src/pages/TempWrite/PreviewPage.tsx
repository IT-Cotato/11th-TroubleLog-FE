import { useEffect, useMemo, useRef, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import HeaderWoSearch from "@/layouts/Header/HeaderWoSearch";
import TagList from "@/entities/trouble/ui/TagList";
import PostGuideMd from "@/entities/trouble/ui/PostGuideMd";
import PostComment, {
  type PostCommentProps,
} from "@/entities/trouble/ui/PostComment";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import useClickOutside from "@/hooks/useClickOutside";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import { PATH } from "@/shared/config/paths";
import { getCombinedDetail, getPostDetail } from "@/api/post.api";
import type {
  ViewCombinedResponse,
  ViewPostResponse,
  PostContent,
} from "@/models/post.model";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

type PreviewState = {
  editorType?: "FREEFORM" | "TEMPLATE";
  errorType?: string | null;
  title?: string;
  tags?: string[];
  date?: string;
  isMine?: boolean;
  authorProfile?: string;
  authorName?: string;
  authorFollowers?: number;
  authorBio?: string;
  importance?: number;
  questions?: string[];
  contents?: GuideContent[][];
  isLiked?: boolean;
  likeCounts?: number;
  commentCounts?: number;
  comments?: PostCommentProps[];
  savePrefill?: {
    importance?: number;
    description?: string;
    visibility?: "public" | "private";
    projectId?: number | null;
    projectName?: string;
    thumbnail?: string | null;
  };
};

export default function PreviewPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { postId } = useParams<{ postId: string }>();
  const [sp] = useSearchParams(); // ← summaryId 쿼리
  const summaryId = sp.get("summaryId");

  // 서버 로딩은 postId가 있을 때만
  const [loading, setLoading] = useState<boolean>(!!postId);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<PreviewState | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!postId) return;

    (async () => {
      setLoading(true);
      setError(null);

      // 1) summaryId 있으면 합본 조회
      try {
        if (summaryId != null) {
          const combined = await getCombinedDetail(
            Number(postId),
            Number(summaryId)
          );
          if (!ignore && combined) {
            setFetched(mapCombinedToPreviewState(combined));
            setLoading(false);
            return;
          }
        }
      } catch {
        //
      }

      // 2) 합본 실패 or summaryId 없음 → 원본만
      try {
        const post = await getPostDetail(Number(postId));
        if (!ignore && post) setFetched(mapPostToPreviewState(post));
        else if (!ignore) setError("문서를 불러오지 못했습니다.");
      } catch {
        if (!ignore) setError("문서를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [postId, summaryId]);

  // fetched(서버 응답) 우선 → state(보조) → 기본
  const data: PreviewState = useMemo(() => {
    const s = (state as PreviewState) ?? {};
    return fetched ? { ...s, ...fetched } : s;
  }, [state, fetched]);
  const questions: string[] = useMemo(
    () => data.questions ?? [],
    [data.questions]
  );
  const contents: GuideContent[][] = useMemo(
    () => data.contents ?? [],
    [data.contents]
  );
  const hasAnySection = questions.length > 0 && contents.length > 0;
  const safeDate = data.date ? ymd(new Date(data.date)) : ymd(new Date());

  const seedComments = (data.comments ?? []).map((c) => ({
    ...c,
    isReply: !!c.isReply,
  }));
  const [isLiked, setIsLiked] = useState<boolean>(data.isLiked ?? false);
  const [likeCounts, setLikeCounts] = useState<number>(data.likeCounts ?? 0);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>(seedComments);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const base = {
    errorType: data.errorType ?? "에러 유형",
    title: data.title ?? "제목(프리뷰)",
    tags: data.tags ?? [],
    date: safeDate,
    isMine: data.isMine ?? true,
    authorProfile: data.authorProfile,
    authorName: data.authorName ?? "작성자",
    authorFollowers: data.authorFollowers ?? 0,
    authorBio: data.authorBio ?? "",
    importance: data.importance ?? 0,
    questions,
    contents,
  };

  // 목차 스크롤
  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    sectionRefs.current = base.questions.map((_, idx) =>
      document.getElementById(`section-${idx}`)
    );
  }, [base.questions]);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const top = ref.getBoundingClientRect().top + window.scrollY;
        if (y >= top - 250) cur = idx;
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const scrollToSection = (idx: number) => {
    const t = sectionRefs.current[idx];
    if (t) window.scrollTo({ top: t.offsetTop - 180, behavior: "smooth" });
  };

  // 인터랙션
  const handleToggleLike = () => {
    setIsLiked((v) => !v);
    setLikeCounts((c) => (isLiked ? Math.max(0, c - 1) : c + 1));
  };
  const handleEdit = (id: string, newContent: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: newContent } : c))
    );
  };
  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  };
  const handleReply = (parentId: string, replyContent: string) => {
    const r: PostCommentProps = {
      id: `${Date.now()}-r`,
      name: base.authorName,
      date: ymd(new Date()),
      content: replyContent,
      isMine: true,
      isReply: true,
      parentId,
    };
    setComments((prev) => [...prev, r]);
  };
  const handleCreateComment = () => {
    const content = commentInput.trim();
    if (!content) return;
    const c: PostCommentProps = {
      id: String(Date.now()),
      name: base.authorName,
      date: ymd(new Date()),
      content,
      isMine: true,
      isReply: false,
    };
    setComments((prev) => [c, ...prev]);
    setCommentInput("");
  };
  const handleProfileClick = () => navigate(PATH.MYPAGE_BASE ?? "/");

  // 로딩/에러/빈데이터 처리
  if (loading) {
    return (
      <div className="p-6">
        <HeaderWoSearch />
        <div className="max-w-[960px] mx-auto mt-10 text-gray-600">
          불러오는 중…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <HeaderWoSearch />
        <div className="max-w-[960px] mx-auto mt-10">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-xl"
            onClick={() => navigate(PATH.ROOT)}
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }
  if (!hasAnySection) {
    return (
      <div className="p-6">
        <HeaderWoSearch />
        <div className="max-w-[960px] mx-auto mt-10">
          <p className="text-gray-600 mb-4">미리보기 데이터가 없습니다.</p>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-xl"
            onClick={() => navigate(PATH.ROOT)}
          >
            작성하러 가기
          </button>
        </div>
      </div>
    );
  }

  const HEADER_OFFSET = 600; // 헤더랑 높이 사이 거리

  return (
    <div>
      <HeaderWoSearch />
      <div className="w-full px-4 sm:px-6 md:px-8">
        {/* 본문+TOC 가로 정렬: 중앙 정렬된 행 컨테이너 */}
        <div className="mx-auto flex items-start justify-center gap-10  pl-16">
          {/* 본문: 고정 폭 900px, 중앙 정렬 효과는 부모에서 처리 */}
          <main className="flex-1 w-full max-w-[900px] flex flex-col  items-start gap-8 sm:gap-[56px] mb-24 sm:mb-[224px]">
            {/* 상단 영역 */}
            <section className="w-full pt-20 pb-[18px] border-b border-gray1">
              <div className="flex flex-col items-start gap-[44px] w-full">
                <div className="flex flex-col items-start gap-[53px] w-full">
                  <div className="flex flex-col items-start gap-[10px] w-full">
                    {/* 에러 유형 + 케밥 버튼 */}
                    <div className="flex w-full justify-between items-start">
                      <span className="text-head-20-semibold">
                        {base.errorType}
                      </span>

                      {base.isMine && (
                        <div className="relative" ref={menuRef}>
                          <KebabMenuButton
                            onClick={() => setShowMenu(!showMenu)}
                          />
                          {showMenu && (
                            <KebabDropdown
                              options={[
                                {
                                  label: "포스트 수정",
                                  onClick: () => {
                                    setShowMenu(false);
                                    const editorType = (data.editorType ??
                                      "FREEFORM") as "FREEFORM" | "TEMPLATE";
                                    const toMd = (items: GuideContent[]) =>
                                      items
                                        .map((it) =>
                                          typeof it === "string"
                                            ? it
                                            : `![${it.alt ?? ""}](${it.src})`
                                        )
                                        .join("\n\n");

                                    if (editorType === "TEMPLATE") {
                                      navigate(PATH.TEMP_WRITING, {
                                        state: {
                                          editorType,
                                          title: base.title,
                                          tags: base.tags,
                                          errorType: base.errorType,
                                          savePrefill: data.savePrefill,
                                          blocks: base.questions.map(
                                            (q, i) => ({
                                              id: Date.now() + i,
                                              content: toMd(
                                                base.contents[i] ?? []
                                              ),
                                              checklist: [],
                                              checklistItems: [],
                                              checklistTitle: "",
                                              question: q,
                                              isSaved: true,
                                            })
                                          ),
                                        },
                                      });
                                    } else {
                                      navigate(PATH.FREEFORM_WRITING, {
                                        state: {
                                          editorType,
                                          title: base.title,
                                          tags: base.tags,
                                          errorType: base.errorType,
                                          savePrefill: data.savePrefill,
                                          blocks: base.questions.map(
                                            (q, i) => ({
                                              id: Date.now() + i,
                                              title: q,
                                              content: toMd(
                                                base.contents[i] ?? []
                                              ),
                                              isSaved: true,
                                            })
                                          ),
                                        },
                                      });
                                    }
                                  },
                                },
                                {
                                  label: "삭제",
                                  onClick: () => setShowMenu(false),
                                },
                              ]}
                              position={{ top: "0.1rem", left: "1.5rem" }}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 제목 */}
                    <h1 className="text-head-48 break-words">{base.title}</h1>
                  </div>

                  {/* 태그 + 작성일 */}
                  {(base.tags.length || base.date) && (
                    <div className="flex flex-wrap items-center gap-[16px]">
                      {base.tags.length ? (
                        <TagList tags={base.tags} variant="post" />
                      ) : null}
                      {base.tags.length && base.date ? (
                        <div className="text-body-16-regular text-gray3">·</div>
                      ) : null}
                      {base.date && (
                        <time className="text-body-20-regular text-gray3">
                          {base.date}
                        </time>
                      )}
                    </div>
                  )}
                </div>

                {/* 작성자 정보 + 중요도 */}
                <div className="flex w-full items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-[20px] cursor-pointer"
                    onClick={handleProfileClick}
                  >
                    <img
                      src={base.authorProfile || imageIcon}
                      onError={(e) => (e.currentTarget.src = imageIcon)}
                      alt="profile"
                      className="w-[66px] h-[66px] rounded-full object-cover"
                    />
                    <div className="text-head-24-bold">{base.authorName}</div>
                  </button>
                  <div className="flex items-center gap-[8px]">
                    <img
                      src={starIcon}
                      alt="star"
                      className="w-[24px] h-[24px]"
                    />
                    <div className="text-body-20-regular text-gray3">
                      {base.importance}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 본문 섹션들 */}
            <section className="flex w-full flex-col items-start gap-2">
              <div className="flex flex-col items-start gap-[36px] self-stretch">
                <div className="flex flex-col items-start self-stretch">
                  <div className="flex flex-col items-start gap-[48px] self-stretch">
                    {base.questions.map((q, idx) => (
                      <div
                        id={`section-${idx}`}
                        key={idx}
                        className="scroll-mt-[200px]"
                      >
                        <PostGuideMd
                          question={q}
                          content={base.contents[idx]}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 좋아요/공유 */}
                <div className="flex pt-[52px] pb-[20px] items-center self-stretch border-b border-gray1">
                  <div className="flex items-center gap-[20px]">
                    <button
                      className="flex items-center gap-[8px]"
                      onClick={handleToggleLike}
                      aria-pressed={isLiked}
                    >
                      <img
                        src={isLiked ? heartIcon : likeEmptyIcon}
                        alt="like"
                        className="w-10 h-10"
                      />
                      <span className="text-body-20-regular text-gray3">
                        {likeCounts}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.share?.()}
                      aria-label="공유"
                    >
                      <img src={shareIcon} alt="share" className="w-10 h-10" />
                    </button>
                  </div>
                </div>

                {/* 댓글 입력 */}
                <div className="flex flex-col items-end gap-[12px] self-stretch">
                  <div className="flex flex-col items-start gap-[36px] self-stretch">
                    <h2 className="text-head-32-semibold">
                      {comments.filter((c) => !c.isReply).length}개의 댓글
                    </h2>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="댓글을 작성해주세요."
                      className="flex pt-[28px] pl-[32px] pb-[130px] w-full resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateComment}
                    disabled={!commentInput.trim()}
                    className={`flex pt-[8px] pl-[32px] pb-[12px] pr-[31px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
                      commentInput.trim() ? "bg-primary" : "bg-subColor1"
                    }`}
                  >
                    작성하기
                  </button>
                </div>

                {/* 댓글 목록 */}
                <div className="flex flex-col items-end self-stretch">
                  {comments
                    .filter((c) => !c.isReply)
                    .map((parent) => (
                      <div key={parent.id} className="w-full">
                        <PostComment
                          {...parent}
                          onEdit={(newContent) =>
                            handleEdit(parent.id, newContent)
                          }
                          onDelete={() => handleDelete(parent.id)}
                          onReply={(replyContent) =>
                            handleReply(parent.id, replyContent)
                          }
                        />
                        {comments
                          .filter((c) => c.parentId === parent.id)
                          .map((reply) => (
                            <PostComment
                              key={reply.id}
                              {...reply}
                              onEdit={(newContent) =>
                                handleEdit(reply.id, newContent)
                              }
                              onDelete={() => handleDelete(reply.id)}
                              onReply={(replyContent) =>
                                handleReply(reply.id, replyContent)
                              }
                            />
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            </section>
          </main>

          {/* 오른쪽 여백 sticky TOC: 본문 옆 컬럼, 높이 기준 상단 오프셋 적용 */}
          <aside
            className="hidden xl:block h-fit w-[260px] 2xl:w-[200px] sticky"
            style={{ top: HEADER_OFFSET, marginTop: 20 }}
          >
            <div className="flex flex-col items-start gap-[16px] border-l border-gray3 pl-[12px] pr-[8px] text-body-20-regular text-gray3 w-full">
              {base.questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSection(idx)}
                  className={` text-left hover:text-black ${
                    currentSection === idx ? "text-black" : ""
                  }`}
                >
                  {idx + 1}. {q}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function ymd(d: Date) {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}
const toInt = (s?: string) => (s == null ? 0 : Number.parseInt(s, 10) || 0);

function mapContents(contents?: PostContent[]) {
  const questions: string[] = [];
  const blocks: (string | { type: "image"; src: string; alt?: string })[][] =
    [];
  (contents ?? []).forEach((c) => {
    questions.push(c.subTitle || "섹션");
    blocks.push([c.body ?? ""]);
  });
  return { questions, contents: blocks };
}

// 타입이 안 맞아도 안전하게 any로 읽어오도록 방어
function mapCombinedToPreviewState(
  d: ViewCombinedResponse | any
): PreviewState {
  const u = d.userInfoResDto ?? {};
  const { questions, contents } = mapContents(d.contents);
  return {
    editorType: "FREEFORM",
    title: d.title ?? "",
    tags: d.postTags ?? [],
    errorType: d.errorTag ?? "에러 유형",
    date: d.completedAt ?? d.createdAt,
    importance: toInt(d.starRating),
    authorName: u.nickname ?? "작성자",
    authorProfile: u.profileUrl ?? "",
    authorFollowers: toInt(u.followerNum),
    authorBio: u.bio ?? "",
    isMine: true,
    isLiked: !!d.liked,
    likeCounts: d.likeCount ?? 0,
    commentCounts: d.commentCount ?? 0,
    questions: questions.length ? questions : [d.title ?? "내용"],
    contents: questions.length ? contents : [[d.introduction ?? ""]],
    comments: [],
  };
}
function mapPostToPreviewState(d: ViewPostResponse | any): PreviewState {
  const u = d.userInfoResDto ?? {};
  const { questions, contents } = mapContents(d.contents);
  return {
    editorType: "FREEFORM",
    title: d.title ?? "",
    tags: d.postTags ?? [],
    errorType: d.errorTag ?? "에러 유형",
    date: d.createdAt,
    importance: toInt(d.starRating),
    authorName: u.nickname ?? "작성자",
    authorProfile: u.profileUrl ?? "",
    authorFollowers: toInt(u.followerNum),
    authorBio: u.bio ?? "",
    isMine: true,
    isLiked: !!d.liked,
    likeCounts: d.likeCount ?? 0,
    commentCounts: d.commentCount ?? 0,

    questions: questions.length ? questions : [d.title ?? "내용"],
    contents: questions.length ? contents : [[d.introduction ?? ""]],
    comments: [],
  };
}
