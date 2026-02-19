import type { MutableRefObject } from "react";
import PostGuideMd from "@/entities/trouble/ui/PostGuideMd";
import imageIcon from "@/assets/icons/image.svg";
import heartIcon from "@/assets/icons/heart.svg";
import likeEmptyIcon from "@/assets/icons/like_empty.svg";
import shareIcon from "@/assets/icons/share.svg";
import type { CommunityPostDetailProps } from "@/pages/Community/types";

export interface PostDetailContentProps {
  post: CommunityPostDetailProps;
  contentWidthClass: string;
  headerOffset: number;
  sectionRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  onProfileClick: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
  isCommunitySource: boolean;
  isLiked: boolean;
  isLiking: boolean;
  likeCounts: number;
  onToggleLike: () => void;
  onCopyLink: () => void;
  commentInput: string;
  setCommentInput: (value: string) => void;
  onSubmitComment: () => void;
  isCommentPosting: boolean;
}

/**
 * 커뮤니티 포스트 상세 하단: 본문, 작성자 카드, 좋아요/공유, 댓글 입력
 */
export function PostDetailContent({
  post,
  contentWidthClass,
  headerOffset,
  sectionRefs,
  onProfileClick,
  onFollow,
  onUnfollow,
  isCommunitySource,
  isLiked,
  isLiking,
  likeCounts,
  onToggleLike,
  onCopyLink,
  commentInput,
  setCommentInput,
  onSubmitComment,
  isCommentPosting,
}: PostDetailContentProps) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px]">
      <div className="flex flex-col items-start gap-[36px] self-stretch">
        {/* 포스트 내용 */}
        <div className="flex flex-col items-start gap-[48px] self-stretch">
          {post.questions.map((q, idx) => (
            <div
              id={`section-${idx}`}
              key={idx}
              ref={(el) => {
                sectionRefs.current[idx] = el;
              }}
              style={{ scrollMarginTop: headerOffset + 1 }}
            >
              <PostGuideMd
                question={q}
                content={post.contents[idx]}
                widthClass={contentWidthClass}
              />
            </div>
          ))}

          {/* 작성자 정보 카드 */}
          <div className="flex py-[24px] sm:py-[32px] px-5 sm:px-[40px] flex-col items-start gap-[10px] self-stretch rounded-[24px] sm:rounded-[36px] bg-[#F2F2F2]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center self-stretch gap-4">
              <div
                className="flex items-center gap-4 sm:gap-[28px] cursor-pointer"
                onClick={onProfileClick}
              >
                <img
                  src={post.authorProfile || imageIcon}
                  onError={(e) => (e.currentTarget.src = imageIcon)}
                  alt="profile"
                  className="w-20 h-20 sm:w-[131px] sm:h-[131px] rounded-full object-cover"
                />
                <div className="flex flex-col items-start gap-[10px] sm:gap-[13px]">
                  <div className="flex flex-col items-start gap-[2px]">
                    <div className="text-head-24-bold">{post.authorName}</div>
                    <div className="text-body-16-regular">
                      {post.authorFollowers} 팔로워
                    </div>
                  </div>
                  <div className="text-body-20-regular">{post.authorBio}</div>
                </div>
              </div>

              {!post.isMine &&
                (post.isFollowed ? (
                  <button
                    onClick={() => onUnfollow()}
                    className="flex py-3 sm:py-[18px] px-6 sm:pl-[41px] sm:pr-[40px] justify-center items-center rounded-[100px] bg-subColor1 text-head-20-semibold text-white"
                  >
                    팔로잉
                  </button>
                ) : (
                  <button
                    onClick={() => onFollow()}
                    className="flex py-3 sm:py-[18px] px-6 sm:pl-[41px] sm:pr-[40px] justify-center items-center rounded-[100px] bg-primary text-head-20-semibold text-white"
                  >
                    팔로우
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* 좋아요/공유 */}
        {isCommunitySource && (
          <div className="flex pt-8 sm:pt-[52px] pb-5 sm:pb-[20px] items-center self-stretch border-b border-gray1">
            <div className="flex items-center gap-4 sm:gap-[20px]">
              <button
                type="button"
                aria-pressed={isLiked}
                aria-busy={isLiking}
                disabled={isLiking}
                onClick={onToggleLike}
                className={`flex items-center gap-2 sm:gap-[8px] ${
                  isLiking
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <img
                  src={isLiked ? heartIcon : likeEmptyIcon}
                  alt="like"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div className="text-body-20-regular text-gray3">
                  {likeCounts}
                </div>
              </button>

              <button
                type="button"
                onClick={onCopyLink}
                className="cursor-pointer"
                aria-label="현재 페이지 링크 복사"
              >
                <img
                  src={shareIcon}
                  alt="share"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
              </button>
            </div>
          </div>
        )}

        {/* 댓글 작성 */}
        {isCommunitySource && (
          <div className="flex flex-col items-end gap-[12px] self-stretch">
            <div className="flex flex-col items-start gap-6 sm:gap-[36px] self-stretch">
              <div className="text-head-32-semibold">
                {post.commentCounts}개의 댓글
              </div>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="댓글을 작성해주세요."
                className="flex p-4 sm:pt-[28px] sm:pl-[32px] pb-24 sm:pb-[130px] w-full resize-none rounded-[24px] bg-white shadow-card text-body-20-regular text-[#757575] focus:outline-none"
              />
            </div>

            <button
              disabled={!commentInput.trim() || isCommentPosting}
              onClick={onSubmitComment}
              className={`inline-flex items-center justify-center rounded-[100px] px-6 sm:px-8
              py-2 sm:py-3 text-white transition-colors
              ${
                commentInput.trim() && !isCommentPosting
                  ? "bg-primary"
                  : "bg-subColor1"
              }`}
            >
              <span className="text-head-20-semibold leading-none">
                {isCommentPosting ? "작성 중…" : "작성하기"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
