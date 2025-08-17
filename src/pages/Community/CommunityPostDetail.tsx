import TagList from "@/components/Card/TagList";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";
import PostGuideMd from "@/components/Community/PostGuideMd";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import { PATH } from "@/constants/paths";
import useClickOutside from "@/hooks/useClickOutside";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import {
  createCommunityComment,
  getCommunityComments,
  getCommunityPostDetail,
  likeCommunityPost,
  replyCommunityComment,
  softDeleteCommunityComment,
  updateCommunityComment,
} from "@/api/community.api";
import { toCommunityPostVM } from "@/mappers/communityPostDetail.mapper";
import {
  makeOptimisticComment,
  toPostComment,
  toPostComments,
} from "@/mappers/communityComment.mapper";
import { useViewerId } from "@/store/auth";
import { getPostDetail } from "@/api/post.api";
import { toPostDetailVM } from "@/mappers/myPostDetail.mapper";

export interface CommunityPostDetailProps {
  errorType: string;
  title: string;
  tags: string[];
  date: string;
  isMine: boolean;
  authorId: number;
  authorProfile?: string;
  authorName: string;
  authorFollowers: number;
  authorBio: string;
  importance: number;
  questions: string[];
  contents: (string | { type: "image"; src: string; alt?: string })[][];
  isLiked: boolean;
  likeCounts: number;
  commentCounts: number;
  comments: PostCommentProps[];
}

export default function CommunityPostDetail() {
  const { postId } = useParams<{ postId: string }>(); // postId 불러오기
  const navigate = useNavigate();
  // 중앙 상태의 로그인 사용자 ID
  const viewerId = useViewerId();

  const [post, setPost] = useState<CommunityPostDetailProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 좋아요/댓글 로컬 상태
  const [isLiked, setIsLiked] = useState(false);
  const [likeCounts, setLikeCounts] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const likeLockRef = useRef(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>([]);

  // 댓글 작성 상태
  const [isCommentPosting, setIsCommentPosting] = useState(false);

  // 댓글 페이징 상태
  const [cPage, setCPage] = useState(1);
  const [cHasNext, setCHasNext] = useState(false);
  const [cLoading, setCLoading] = useState(false);

  // 케밥 메뉴
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 섹션 추적
  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // 진행 중 요청 캐시(StrictMode 중복호출 디듀프)
  const inflightPostRef = useRef(
    new Map<number, ReturnType<typeof getCommunityPostDetail>>()
  );

  // 공유 기능 (URL 복사 후 안내 메시지 띄우기)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async (text: string) => {
    // https(또는 localhost)에서 우선 시도
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // 폴백 (일부 iOS/구형 브라우저)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand("copy");
      return ok;
    } finally {
      document.body.removeChild(ta);
    }
  };

  const showToast = (message: string) => {
    setToast({ open: true, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast({ open: false, message: "" });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      const ok = await copyToClipboard(url);
      showToast(
        ok
          ? "링크가 복사되었어요!"
          : "복사에 실패했어요. 주소창에서 복사해주세요."
      );
    } catch {
      showToast("복사에 실패했어요. 주소창에서 복사해주세요.");
    }
  };

  const fetchPostOnce = (id: number) => {
    const map = inflightPostRef.current;
    if (!map.has(id)) {
      const p = getCommunityPostDetail(id).finally(() => {
        // 같은 tick 끝나고 캐시 비우기 (메모리 누수 방지 & 후속 요청 허용)
        setTimeout(() => map.delete(id), 0);
      });
      map.set(id, p);
    }
    return map.get(id)!;
  };

  // 댓글 로더
  const loadComments = async (id: number, page1: number) => {
    setCLoading(true);
    try {
      const resp = await getCommunityComments(id, page1, 10);
      const mapped = toPostComments(resp.content, viewerId);

      setComments((prev) => (page1 === 1 ? mapped : [...prev, ...mapped]));

      const nextPage1 = typeof resp.page === "number" ? resp.page + 1 : page1;
      setCPage(nextPage1);
      setCHasNext(!!resp.hasNext);

      setPost((prev) =>
        prev
          ? { ...prev, commentCounts: resp.totalElements ?? prev.commentCounts }
          : prev
      );
    } finally {
      setCLoading(false);
    }
  };

  // 포스트 + 댓글 1페이지 로드 (StrictMode 안전)
  useEffect(() => {
    let cancelled = false;

    // 새 포스트 들어올 때 댓글 상태 초기화
    setComments([]);
    setCPage(1);
    setCHasNext(false);

    (async () => {
      const idStr = postId ?? "";
      const numId = Number(idStr);
      if (!Number.isFinite(numId)) {
        setLoadError("잘못된 포스트 ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // community 상세로 작성자 ID 확인
        const communityData = await fetchPostOnce(numId);
        if (cancelled) return;

        if (!communityData) {
          setLoadError("빈 응답입니다.");
          return;
        }

        const authorIdFromCommunity =
          communityData?.userInfoResDto?.userId ?? null;
        const isMineNow =
          authorIdFromCommunity != null &&
          viewerId != null &&
          String(authorIdFromCommunity) === String(viewerId);

        if (isMineNow) {
          try {
            const resp = await getPostDetail(numId);
            const vm = toPostDetailVM(resp as any, viewerId);
            setPost(vm);
            setIsLiked(vm.isLiked);
            setLikeCounts(vm.likeCounts);
            void loadComments(numId, 1);
          } catch {
            // post.api 실패 시 기존 커뮤니티 응답으로 폴백
            const vm = toCommunityPostVM(communityData, viewerId);
            setPost(vm);
            setIsLiked(vm.isLiked);
            setLikeCounts(vm.likeCounts);
            void loadComments(numId, 1);
          }
        } else {
          const vm = toCommunityPostVM(communityData, viewerId);
          setPost(vm);
          setIsLiked(vm.isLiked);
          setLikeCounts(vm.likeCounts);
          void loadComments(numId, 1);
        }
      } catch (err: any) {
        if (!cancelled) setLoadError(err?.message ?? "포스트 불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false); // 반드시 한 번은 내려가도록
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, viewerId]);

  // 스크롤 감시
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      let cur = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (ref) {
          const top = ref.getBoundingClientRect().top + window.scrollY;
          if (y >= top - 250) cur = idx;
        }
      });
      setCurrentSection(cur);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (target) {
      window.scrollTo({ top: target.offsetTop - 180, behavior: "smooth" });
    }
  };

  // 작성자 프로필 클릭 핸들러
  const handleProfileClick = () => {
    // 작성자 마이페이지로
    if (!post) return;
    // post 객체에 작성자 userId가 있다면 사용, 없으면 API 응답 구조 확인 필요
    navigate(PATH.MYPAGE(String(post.authorId) || ""));
  };

  // 포스트 좋아요 토글
  const handleToggleLike = async () => {
    if (!postId) return;
    if (likeLockRef.current) return;
    likeLockRef.current = true;
    setIsLiking(true);

    const pid = Number(postId);
    const wasLiked = isLiked;
    const prevCount = likeCounts;

    if (wasLiked) {
      // 낙관적 감소
      setIsLiked(false);
      setLikeCounts(Math.max(0, prevCount - 1));

      try {
        await likeCommunityPost(pid);
        // 성공 시 그대로 둔다
      } catch {
        // 실패 시 롤백
        setIsLiked(true);
        setLikeCounts(prevCount);
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    } else {
      // 낙관적 증가
      setIsLiked(true);
      setLikeCounts(prevCount + 1);

      try {
        const res = await likeCommunityPost(pid);
        // 서버 카운트로 보정(응답에 likeCount 포함)
        setLikeCounts(res?.likeCount ?? prevCount + 1);
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        if (status === 409) {
          // 이미 좋아요 상태인 경우 -> isLiked는 true 유지, 카운트는 원래 값으로 되돌림
          setIsLiked(true);
          setLikeCounts(prevCount);
        } else {
          // 기타 에러 → 완전 롤백
          setIsLiked(false);
          setLikeCounts(prevCount);
        }
      } finally {
        likeLockRef.current = false;
        setIsLiking(false);
      }
    }
  };

  // 댓글 제출
  const handleSubmitComment = async () => {
    if (!postId) return;
    const contents = commentInput.trim();
    if (!contents || isCommentPosting) return;

    setIsCommentPosting(true);

    // 낙관적 추가
    const optimistic = makeOptimisticComment({ contents });
    setComments((prev) => [optimistic, ...prev]);
    setPost((p) =>
      p ? { ...p, commentCounts: (p.commentCounts ?? 0) + 1 } : p
    );
    setCommentInput("");

    try {
      const created = await createCommunityComment(Number(postId), {
        contents,
      });
      const mapped = toPostComment(created, viewerId, { isReply: false });
      setComments((prev) => {
        const i = prev.findIndex((c) => c.id === optimistic.id);
        if (i === -1) return [mapped, ...prev];
        const next = [...prev];
        next[i] = mapped;
        return next;
      });
    } catch {
      // 실패 → 롤백
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setPost((p) =>
        p ? { ...p, commentCounts: Math.max(0, (p.commentCounts ?? 1) - 1) } : p
      );
      setCommentInput(contents);
    } finally {
      setIsCommentPosting(false);
    }
  };

  // 대댓글 제출 (부모 id, 내용)
  const handleReply = async (parentId: string, replyContent: string) => {
    if (!postId) return;
    const contents = replyContent.trim();
    if (!contents) return;

    // 낙관적 추가
    const optimistic = makeOptimisticComment({ contents, parentId });
    setComments((prev) => [...prev, optimistic]);

    try {
      const created = await replyCommunityComment(
        Number(postId),
        Number(parentId),
        { contents }
      );

      // 백엔드에서 parentCommentId가 null로 올 수 있으므로 강제 보정
      const mapped = toPostComment(created, viewerId, {
        isReply: true,
        parentId,
      });
      setComments((prev) => {
        const i = prev.findIndex((c) => c.id === optimistic.id);
        if (i === -1) return [...prev, mapped];
        const next = [...prev];
        next[i] = mapped;
        return next;
      });
    } catch {
      // 실패 → 롤백
      setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      // 에러 메시지를 표시하거나 로깅
      console.error("대댓글 작성 실패");
    }
  };

  // 댓글 내용 수정
  const handleEdit = async (id: string, newContent: string) => {
    if (!postId) return;
    const pid = Number(postId);
    const cid = Number(id);
    try {
      // 서버 수정
      const updated = await updateCommunityComment({
        postId: pid,
        commentId: cid,
        contents: newContent,
      });

      const vm = toPostComment(updated, viewerId);

      // 목록 반영 (id 일치하는 아이템 교체)
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                content: vm.content,
                date: vm.date,
              }
            : c
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  // 댓글 삭제 (soft)
  const handleDelete = async (id: string) => {
    try {
      await softDeleteCommunityComment(Number(id));
      // 목록에서 제거 (부모/대댓글 동일)
      setComments((prev) => prev.filter((c) => c.id !== id));
      // 카운트 갱신
      setPost((prev) =>
        prev
          ? { ...prev, commentCounts: Math.max(0, prev.commentCounts - 1) }
          : prev
      );
    } catch (e) {
      console.error(e);
    }
  };

  // 로딩/에러 처리
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[24px] w-full pt-[180px]">
          <div className="w-full h-[120px] bg-gray-100 rounded" />
          <div className="w-full h-[400px] bg-gray-100 rounded" />
        </div>
      </div>
    );
  }
  if (loadError || !post) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[1200px] w-full pt-[180px] text-red-600">
          {loadError ?? "포스트를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      {/* 포스트 영역 */}
      <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb-[224px]">
        {/* 상단 영역 */}
        <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
          <div className="flex flex-col items-start gap-[44px]">
            <div className="flex flex-col items-start gap-[53px]">
              <div className="flex flex-col items-start gap-[10px]">
                {/* 에러 종류 & (케밥 버튼) */}
                <div className="flex w-[1200px] justify-between items-start">
                  <span className="text-head-20-semibold">
                    {post.errorType}
                  </span>
                  {post.isMine && (
                    <div className="relative" ref={menuRef}>
                      <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                      {showMenu && (
                        <KebabDropdown
                          options={[
                            {
                              label: "포스트 수정",
                              onClick: () => {
                                setShowMenu(false);
                              },
                            },
                            {
                              label: "삭제",
                              onClick: () => {
                                setShowMenu(false);
                              },
                            },
                          ]}
                          position={{ top: "0.1rem", left: "1.5rem" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* 포스트 제목 */}
                <div className="text-head-48">{post.title}</div>
              </div>

              {/* 태그 & 작성일 */}
              <div className="flex items-center gap-[16px]">
                {/* 태그 */}
                <TagList tags={post.tags} variant="post" />

                {/* 구분점 */}
                <div className="text-body-16-regular text-gray3">·</div>

                {/* 작성일 */}
                <div className="text-body-20-regular text-gray3">
                  {post.date}
                </div>
              </div>
            </div>

            {/* 작성자 정보 & 중요도 */}
            <div className="flex w-full items-center justify-between">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-[20px]">
                {/* 프로필 이미지 */}
                <img
                  src={post.authorProfile || imageIcon}
                  onError={(e) => {
                    e.currentTarget.src = imageIcon;
                  }}
                  alt="profile"
                  className="w-[66px] h-[66px]"
                />

                {/* 작성자명 */}
                <div className="text-head-24-bold">{post.authorName}</div>
              </div>

              {/* 중요도 */}
              {post.isMine && post.importance !== 0 && (
                <div className="flex items-center gap-[8px]">
                  <img
                    src={starIcon}
                    alt="importance"
                    className="w-[24px] h-[24px]"
                  />
                  <div className="text-body-20-regular text-gray3">
                    {post.importance}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="flex w-full flex-col items-start gap-[8px]">
          {/* 메인 */}
          <div className="flex flex-col items-start gap-[36px] self-stretch">
            {/* 포스트 내용 & 작성자 정보 */}
            <div className="flex flex-col items-start self-stretch">
              <div className="flex flex-col items-start gap-[48px] self-stretch">
                {/* 포스트 내용 */}
                <div className="flex flex-col items-start gap-[48px] self-stretch">
                  {post.questions.map((q, idx) => (
                    <div
                      id={`section-${idx}`}
                      key={idx}
                      ref={(el) => {
                        sectionRefs.current[idx] = el;
                      }}
                      className="scroll-mt-[200px]"
                    >
                      <PostGuideMd question={q} content={post.contents[idx]} />
                    </div>
                  ))}
                </div>

                {/* 작성자 정보 */}
                <div className="flex py-[32px] px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[36px] bg-[#F2F2F2]">
                  <div className="flex justify-between items-center self-stretch">
                    <div
                      className="flex items-center gap-[28px] cursor-pointer"
                      onClick={handleProfileClick}
                    >
                      {/* 프로필 이미지 */}
                      <img
                        src={post.authorProfile || imageIcon}
                        onError={(e) => {
                          e.currentTarget.src = imageIcon;
                        }}
                        alt="profile"
                        className="w-[131px] h-[131px]"
                      />
                      <div className="flex flex-col items-start gap-[13px]">
                        {/* 작성자명 & 팔로워 수 */}
                        <div className="flex flex-col items-start gap-[2px]">
                          <div className="text-head-24-bold">
                            {post.authorName}
                          </div>
                          <div className="text-body-16-regular">
                            {post.authorFollowers} 팔로워
                          </div>
                        </div>

                        {/* 한줄 소개 */}
                        <div className="text-body-18-regular">
                          {post.authorBio}
                        </div>
                      </div>
                    </div>

                    {/* 팔로우 버튼 */}
                    {!post.isMine && (
                      <button className="flex py-[18px] pl-[41px] pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white cursor-pointer">
                        팔로우
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 좋아요, 공유 */}
            <div className="flex pt-[52px] pb-[20px] items-center self-stretch border-b border-gray1">
              <div className="flex items-center gap-[20px]">
                {/* 좋아요 */}
                <button
                  type="button"
                  aria-pressed={isLiked}
                  aria-busy={isLiking}
                  disabled={isLiking}
                  onClick={handleToggleLike}
                  className={`flex items-center gap-[8px] ${
                    isLiking
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <img
                    src={isLiked ? heartIcon : likeEmptyIcon}
                    alt="like"
                    className="w-[40px] h-[40px]"
                  />
                  <div className="text-body-20-regular text-gray3">
                    {likeCounts}
                  </div>
                </button>

                {/* 공유 버튼 */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="cursor-pointer"
                  aria-label="현재 페이지 링크 복사"
                >
                  <img
                    src={shareIcon}
                    alt="share"
                    className="w-[40px] h-[40px]"
                  />
                </button>
              </div>
            </div>

            {/* 댓글 작성 창 */}
            <div className="flex flex-col items-end gap-[12px] self-stretch">
              <div className="flex flex-col items-start gap-[36px] self-stretch">
                <div className="text-head-32-semibold">
                  {post.commentCounts}개의 댓글
                </div>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글을 작성해주세요."
                  className="flex pt-[28px] pl-[32px] pb-[130px] w-full items-start self-stretch resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
                ></textarea>
              </div>

              {/* 작성하기 버튼 */}
              <button
                disabled={!commentInput.trim() || isCommentPosting}
                onClick={handleSubmitComment}
                className={`flex pt-[8px] pl-[32px] pb-[12px] pr-[31px] justify-center items-center rounded-[100px] text-head-20-semibold text-white transition-colors ${
                  commentInput.trim() && !isCommentPosting
                    ? "bg-primary"
                    : "bg-subColor1"
                }`}
              >
                {isCommentPosting ? "작성 중…" : "작성하기"}
              </button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col items-end self-stretch">
            {comments
              .filter((c) => !c.isReply) // 부모 댓글만
              .map((parent) => (
                <div key={parent.id} className="w-full">
                  <PostComment
                    {...parent}
                    onEdit={(newContent) => handleEdit(parent.id, newContent)}
                    onDelete={() => handleDelete(parent.id)}
                    onReply={(replyContent) =>
                      handleReply(parent.id, replyContent)
                    }
                  />
                  {/* 답글 목록 */}
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

            {/* 댓글 더 보기 */}
            {cHasNext && postId && (
              <button
                disabled={cLoading}
                onClick={() => loadComments(Number(postId), cPage)}
                className={`mt-4 px-6 py-2 rounded-full text-white ${
                  cLoading ? "bg-gray-300" : "bg-primary"
                }`}
              >
                {cLoading ? "불러오는 중…" : "댓글 더 보기"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 목차 */}
      <div
        className="inline-flex items-start mt-[588px] mr-[89px]
    sticky top-[588px] h-fit
    w-[220px] sm:w-[240px] md:w-[280px] lg:w-[320px]
    flex-shrink-0"
      >
        {/* 목차 리스트 */}
        <div
          className=" flex flex-col items-start gap-[16px]
      border-l border-gray3
      pl-[12px] pr-[8px]  
      text-body-20-regular text-gray3
      w-full"
        >
          {post.questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => scrollToSection(idx)}
              className={`text-left ${
                currentSection === idx ? "text-black" : ""
              }`}
            >
              {idx + 1}. {q}
            </button>
          ))}
        </div>
      </div>

      {/* 토스트 UI (공유 관련) */}
      {toast.open && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black text-white text-body-16-regular shadow-card z-50"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
