import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import TagList from "@/components/Card/TagList";
import PostGuideMd from "@/components/Community/PostGuideMd";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";

import KebabDropdown from "@/components/Menu/KebabDropdown";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import useClickOutside from "@/hooks/useClickOutside";

import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import { PATH } from "@/constants/paths";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

interface PreviewState {
  guide?: { question: string; content: GuideContent[] };
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
}

export interface CommunityPostDetailProps {
  errorType: string;
  title: string;
  tags: string[];
  date: string;
  isMine: boolean;
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

export default function PreviewPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = (state ?? {}) as PreviewState;

  const questions: string[] = useMemo(
    () => data.questions ?? (data.guide ? [data.guide.question] : []),
    [data.questions, data.guide]
  );

  const contents: GuideContent[][] = useMemo(
    () => data.contents ?? (data.guide ? [data.guide.content] : []),
    [data.contents, data.guide]
  );

  const hasAnySection = questions.length > 0 && contents.length > 0;

  const safeDate = data.date ?? formatDate(new Date());

  const seedComments = (data.comments ?? []).map((c) => ({
    ...c,
    isReply: !!c.isReply,
  }));

  const basePost: CommunityPostDetailProps = {
    errorType: data.errorType ?? "에러 유형",
    title: data.title ?? "제목(프리뷰)",
    tags: data.tags ?? [],
    date: safeDate,
    isMine: !!data.isMine,
    authorProfile: data.authorProfile,
    authorName: data.authorName ?? "작성자",
    authorFollowers: data.authorFollowers ?? 0,
    authorBio: data.authorBio ?? "",
    importance: data.importance ?? 0,
    questions,
    contents: contents as CommunityPostDetailProps["contents"],
    isLiked: !!data.isLiked,
    likeCounts: data.likeCounts ?? 0,
    commentCounts:
      typeof data.commentCounts === "number"
        ? data.commentCounts
        : seedComments.filter((c) => !c.isReply).length,
    comments: seedComments,
  };

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const [isLiked, setIsLiked] = useState<boolean>(basePost.isLiked);
  const [likeCounts, setLikeCounts] = useState<number>(basePost.likeCounts);

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCounts((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCounts((prev) => prev + 1);
    }
  };

  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>(
    basePost.comments
  );

  const handleEdit = (id: string, newContent: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content: newContent } : c))
    );
  };

  const handleDelete = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  };

  const handleReply = (parentId: string, replyContent: string) => {
    const newReply: PostCommentProps = {
      id: `${Date.now()}-r`,
      name: "현재 유저",
      date: formatDate(new Date()),
      content: replyContent,
      isMine: true,
      isReply: true,
      parentId,
    };
    setComments((prev) => [...prev, newReply]);
  };

  const handleCreateComment = () => {
    const content = commentInput.trim();
    if (!content) return;
    const newComment: PostCommentProps = {
      id: Date.now().toString(),
      name: basePost.authorName ?? "익명",
      date: formatDate(new Date()),
      content,
      isMine: true,
      isReply: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setCommentInput("");
  };

  const handleProfileClick = () => {
    navigate(PATH.MYPAGE("1"));
  };

  const [currentSection, setCurrentSection] = useState<number>(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    sectionRefs.current = basePost.questions.map((_, idx) =>
      document.getElementById(`section-${idx}`)
    );
  }, [basePost.questions]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      let current = 0;
      sectionRefs.current.forEach((ref, idx) => {
        if (ref) {
          const top = ref.getBoundingClientRect().top + window.scrollY;
          if (scrollY >= top - 250) {
            current = idx;
          }
        }
      });
      setCurrentSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (idx: number) => {
    const target = sectionRefs.current[idx];
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 180,
        behavior: "smooth",
      });
    }
  };

  if (!hasAnySection) {
    return (
      <div className="p-6">
        <HeaderWoSearch />
        <div className="max-w-[960px] mx-auto mt-10">
          <p className="text-gray-600 mb-4">
            미리보기 데이터가 없습니다. 작성 화면으로 돌아갑니다.
          </p>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded-xl"
            onClick={() => navigate("/")}
          >
            작성하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <HeaderWoSearch />
      <div className="flex flex-col w-full">
        <div className="fixed right-[89px] top-[520px] z-30 hidden xl:block">
          <nav className="flex flex-col items-start gap-[16px] border-l border-gray3 pl-[12px] pr-[8px] py-[8px] rounded-lg bg-white/70 backdrop-blur-sm text-body-20-regular text-gray3 pointer-events-auto">
            {basePost.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => scrollToSection(idx)}
                className={`text-left hover:text-black ${
                  currentSection === idx ? "text-black" : ""
                }`}
              >
                {idx + 1}. {q}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex flex-col">
          {/* 포스트 영역 */}
          <div className="flex flex-col items-start max-w-[1200px] ml-[360px] mr-[36px] gap-[56px] mb={[224]}">
            {/* 상단 영역 */}
            <div className="flex w-full pt-[180px] pb-[18px] items-center border-b border-gray1">
              <div className="flex flex-col items-start gap-[44px]">
                <div className="flex flex-col items-start gap-[53px]">
                  <div className="flex flex-col items-start gap-[10px]">
                    {/* 에러 종류 & 케밥 */}
                    <div className="flex w-[1200px] justify-between items-start">
                      <span className="text-head-20-semibold">
                        {basePost.errorType}
                      </span>
                      {basePost.isMine && (
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
                                    console.log("포스트 수정 동작 실행");
                                  },
                                },
                                {
                                  label: "삭제",
                                  onClick: () => {
                                    setShowMenu(false);
                                    console.log("삭제 동작 실행");
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
                    <div className="text-head-48">{basePost.title}</div>
                  </div>

                  {/* 태그 & 작성일 */}
                  {(basePost.tags.length || basePost.date) && (
                    <div className="flex items-center gap-[16px]">
                      {basePost.tags.length ? (
                        <TagList tags={basePost.tags} variant="post" />
                      ) : null}
                      {basePost.tags.length && basePost.date ? (
                        <div className="text-body-16-regular text-gray3">·</div>
                      ) : null}
                      {basePost.date && (
                        <div className="text-body-20-regular text-gray3">
                          {basePost.date}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 작성자 정보 & 중요도 */}
                <div className="flex w-full items-center justify-between">
                  {/* 작성자 정보 */}
                  <div
                    className="flex items-center gap-[20px] cursor-pointer"
                    onClick={handleProfileClick}
                  >
                    <img
                      src={basePost.authorProfile || imageIcon}
                      onError={(e) => {
                        e.currentTarget.src = imageIcon;
                      }}
                      alt="profile"
                      className="w-[66px] h-[66px] rounded-full object-cover"
                    />
                    <div className="text-head-24-bold">
                      {basePost.authorName}
                    </div>
                  </div>

                  {/* 중요도 */}
                  <div className="flex items-center gap-[8px]">
                    <img
                      src={starIcon}
                      alt="importance"
                      className="w-[24px] h-[24px]"
                    />
                    <div className="text-body-20-regular text-gray3">
                      {basePost.importance}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 영역 */}
            <div className="flex w-full flex-col items-start gap-[8px]">
              {/* 메인 */}
              <div className="flex flex-col items-start gap-[36px] self-stretch">
                {/* 포스트 내용 & 작성자 카드 */}
                <div className="flex flex-col items-start self-stretch">
                  <div className="flex flex-col items-start gap-[48px] self-stretch">
                    {/* 포스트 내용 */}
                    <div className="flex flex-col items-start gap-[48px] self-stretch">
                      {basePost.questions.map((q, idx) => (
                        <div
                          id={`section-${idx}`}
                          key={idx}
                          className="scroll-mt-[200px]"
                        >
                          <PostGuideMd
                            question={q}
                            content={basePost.contents[idx]}
                          />
                        </div>
                      ))}
                    </div>

                    {/* 작성자 정보 카드 */}
                    {(basePost.authorName ||
                      basePost.authorProfile ||
                      basePost.authorBio) && (
                      <div className="flex py-[32px] px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[36px] bg-[#F2F2F2]">
                        <div className="flex justify-between items-center self-stretch">
                          <div className="flex items-center gap-[28px]">
                            <img
                              src={basePost.authorProfile || imageIcon}
                              onError={(e) => {
                                e.currentTarget.src = imageIcon;
                              }}
                              alt="profile"
                              className="w-[131px] h-[131px] rounded-full object-cover"
                            />
                            <div className="flex flex-col items-start gap-[13px]">
                              <div className="flex flex-col items-start gap-[2px]">
                                <div className="text-head-24-bold">
                                  {basePost.authorName}
                                </div>
                                <div className="text-body-16-regular">
                                  {basePost.authorFollowers}팔로워
                                </div>
                              </div>
                              {basePost.authorBio && (
                                <div className="text-body-18-regular">
                                  {basePost.authorBio}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 팔로우 버튼 (프리뷰용 더미) */}
                          <button className="flex py-[18px] pl-[41px] pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white cursor-pointer">
                            팔로우
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 좋아요, 공유 */}
                <div className="flex pt+[52px] pb-[20px] items-center self-stretch border-b border-gray1">
                  <div className="flex items-center gap-[20px]">
                    {/* 좋아요 */}
                    <div
                      className="flex items-center gap-[8px] cursor-pointer"
                      onClick={handleToggleLike}
                    >
                      <img
                        src={isLiked ? heartIcon : likeEmptyIcon}
                        alt="like"
                        className="w-[40px] h-[40px]"
                      />
                      <div className="text-body-20-regular text-gray3">
                        {likeCounts}
                      </div>
                    </div>

                    {/* 공유 버튼 (프리뷰용 더미) */}
                    <img
                      src={shareIcon}
                      alt="share"
                      className="w-[40px] h-[40px]"
                    />
                  </div>
                </div>

                {/* 댓글 작성 */}
                <div className="flex flex-col items-end gap-[12px] self-stretch">
                  <div className="flex flex-col items-start gap-[36px] self-stretch">
                    <div className="text-head-32-semibold">
                      {comments.filter((c) => !c.isReply).length}개의 댓글
                    </div>
                    <textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="댓글을 작성해주세요."
                      className="flex pt-[28px] pl-[32px] pb-[130px] w-full items-start self-stretch resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------- utils
function formatDate(date: Date) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}
