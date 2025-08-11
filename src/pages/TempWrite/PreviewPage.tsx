import { useLocation, useNavigate } from "react-router-dom";
import HeaderWoSearch from "@/components/Header/HeaderWoSearch";
import PostGuideMd from "@/components/Community/PostGuideMd";
import TagList from "@/components/Card/TagList";
import PostComment, {
  type PostCommentProps,
} from "@/components/Community/PostComment";
import { useState } from "react";
import KebabDropdown from "@/components/Menu/KebabDropdown.tsx";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import useClickOutside from "@/hooks/useClickOutside";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

interface PreviewState {
  guide?: {
    question: string;
    content: GuideContent[];
  };

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
}

export default function PreviewPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const data = (state ?? {}) as PreviewState;

  const questions: string[] =
    data.questions ?? (data.guide ? [data.guide.question] : []);

  const contents: GuideContent[][] =
    data.contents ?? (data.guide ? [data.guide.content] : []);

  const hasAnySection = questions.length > 0 && contents.length > 0;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  // 작성자 부분 아래 상수들
  // 좋아요 상태 (로컬만)
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCounts, setLikeCounts] = useState<number>(0);

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCounts((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCounts((prev) => prev + 1);
    }
  };

  // 댓글 입력/목록 상태
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<PostCommentProps[]>([]);

  // 날짜 포맷
  const formatDate = (date: Date) => {
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  // 댓글 작성
  const handleCreateComment = () => {
    const content = commentInput.trim();
    if (!content) return;

    const newComment: PostCommentProps = {
      id: Date.now().toString(),
      name: data.authorName ?? "익명",
      date: formatDate(new Date()),
      content,
      isMine: true,
      isReply: false,
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentInput("");
  };

  // 댓글 수정/삭제/답글
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
    <div>
      <HeaderWoSearch />
      <div className="flex flex-col justify-center px-[225px] pt-[100px] pb-[160px] items-center">
        <div className="w-[1200px] flex flex-col gap-[56px]">
          {(data.title ||
            data.errorType ||
            (data.tags && data.tags.length) ||
            data.authorName ||
            data.importance) && (
            <div className="bg-white flex flex-col gap-[53px]">
              <div className="flex flex-col w-full items-start gap-[40px]">
                <div className="flex flex-col gap-[20px]">
                  {data.errorType && (
                    <div className="w-[1200px] flex flex-row items-center justify-between self-stretch">
                      <span className=" text-[20px] font-semibold">
                        {data.errorType}
                      </span>
                      <div
                        className="relative flex items-center gap-1 sm:gap-2"
                        ref={menuRef}
                      >
                        {/*포스트 수정 삭제 드롭다운 */}
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
                                  console.log("삭제 동작 실행");
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
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {data.title && (
                    <h1 className="text-[48px] font-bold leading-tight">
                      {data.title}
                    </h1>
                  )}

                  {/* 태그 & 날짜 */}
                  {(data.tags?.length || data.date) && (
                    <div className="flex items-center gap-[16px]">
                      {data.tags?.length ? (
                        <TagList tags={data.tags} variant="post" />
                      ) : null}
                      {data.tags?.length && data.date ? (
                        <div className="text-body-16-regular text-gray3">·</div>
                      ) : null}
                      {data.date && (
                        <div className="text-body-20-regular text-gray3">
                          {data.date}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center self-stretch">
                  {/* 작성자 정보 */}
                  {(data.authorName ||
                    data.authorProfile ||
                    data.authorBio) && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-[16px]">
                        <img
                          src={data.authorProfile || "/icons/image.svg"}
                          onError={(e) => {
                            e.currentTarget.src = "/icons/image.svg";
                          }}
                          alt="profile"
                          className="w-[56px] h-[56px] rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <div className="text-head-24-bold">
                            {data.authorName ?? "작성자"}
                          </div>
                          {(data.authorFollowers || data.authorBio) && (
                            <div className="text-body-16-regular text-gray3">
                              {typeof data.authorFollowers === "number"
                                ? `${data.authorFollowers}팔로워`
                                : ""}
                              {typeof data.authorFollowers === "number" &&
                              data.authorBio
                                ? " · "
                                : ""}
                              {data.authorBio ?? ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 중요도 */}
                  {typeof data.importance === "number" && (
                    <div className="flex items-center gap-[8px]">
                      <img
                        src="/icons/star.svg"
                        alt="importance"
                        className="w-[24px] h-[24px]"
                      />
                      <div className="text-body-20-regular text-gray3">
                        {data.importance}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 블록들 */}
          <div className="flex flex-col items-start gap-[48px] self-stretch">
            {questions.map((q, idx) => (
              <div
                id={`section-${idx}`}
                key={idx}
                className="w-[1200px] scroll-mt-[200px]"
              >
                <PostGuideMd question={q} content={contents[idx] ?? []} />
              </div>
            ))}
          </div>
        </div>

        <div className="w-[1200px] flex flex-col items-center mt-[48px]">
          {/* 작성자 정보 카드 */}
          {(data.authorName || data.authorProfile || data.authorBio) && (
            <div className="flex w-full py-[32px] px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[36px] bg-[#F2F2F2]">
              <div className="flex justify-between items-center self-stretch">
                <div className="flex items-center gap-[28px]">
                  {/* 프로필 이미지 */}
                  <img
                    src={data.authorProfile || "/icons/image.svg"}
                    onError={(e) => {
                      e.currentTarget.src = "/icons/image.svg";
                    }}
                    alt="profile"
                    className="w-[131px] h-[131px] rounded-full object-cover"
                  />
                  <div className="flex flex-col items-start gap-[13px]">
                    {/* 작성자명 & 팔로워 수 */}
                    <div className="flex flex-col items-start gap-[2px]">
                      <div className="text-head-24-bold">
                        {data.authorName ?? "작성자"}
                      </div>
                      {typeof data.authorFollowers === "number" && (
                        <div className="text-body-16-regular">
                          {data.authorFollowers}팔로워
                        </div>
                      )}
                    </div>

                    {/* 한줄 소개 */}
                    {data.authorBio && (
                      <div className="text-body-18-regular">
                        {data.authorBio}
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

          {/* 좋아요 / 공유 */}
          <div className="flex pt-[52px] pb-[20px] items-center self-stretch border-b border-gray1">
            <div className="flex items-center gap-[20px]">
              {/* 좋아요 */}
              <div
                className="flex items-center gap-[8px] cursor-pointer"
                onClick={handleToggleLike}
              >
                <img
                  src={isLiked ? "/icons/heart.svg" : "/icons/like_empty.svg"}
                  alt="like"
                  className="w-[40px] h-[40px]"
                />
                <div className="text-body-20-regular text-gray3">
                  {likeCounts}
                </div>
              </div>

              {/* 공유 버튼 (프리뷰용 더미) */}
              <img
                src="/icons/share.svg"
                alt="share"
                className="w-[40px] h-[40px]"
              />
            </div>
          </div>

          {/* 댓글 작성 */}
          <div className="flex w-[1200px] flex-col items-end gap-[12px] self-stretch">
            <div className="flex flex-col items-start gap-[36px] self-stretch">
              <div className="mt-[36px] text-head-32-semibold">
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

          {/* 댓글 목록 */}
          <div className="flex flex-col items-end self-stretch">
            {comments
              .filter((c) => !c.isReply)
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
          </div>
        </div>
      </div>
    </div>
  );
}
