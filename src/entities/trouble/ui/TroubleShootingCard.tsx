import { useState, useCallback } from "react";
import type { StatusType, VisibilityType } from "@/types/project";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import useClickOutside from "@/hooks/useClickOutside";
import TagList from "@/entities/trouble/ui/TagList";
import imageIcon from "@/assets/icons/image.svg";
import publicIcon from "@/assets/icons/public.svg";
import privateIcon from "@/assets/icons/private.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import commentIcon from "@/assets/icons/comment.svg";
import { hardDeletePost } from "@/api/post.api";

export interface TroubleShootingCardProps {
  id: string;
  isMine: boolean;
  errorCategory: string;
  title: string;
  content: string;
  tags: string[];
  importance?: number;
  createdAt: string;
  thumbnailUrl?: string;
  visibility?: VisibilityType;
  summaryType?: string;
  status: StatusType;
  likeCount?: number;
  commentCount?: number;
  authorName?: string;
  isSearchResult?: boolean;
  onDeleted?: (postId: number) => void;
  onClick?: (postId: number) => void;
  disabled?: boolean;

  summaryId?: number | null;
  postSummaryId?: number | null;
  summaries?: any[];
}

const TroubleShootingCard = ({
  id,
  isMine,
  errorCategory,
  title,
  content,
  tags,
  importance,
  createdAt,
  thumbnailUrl,
  visibility,
  summaryType,
  status,
  likeCount,
  commentCount,
  authorName,
  isSearchResult,
  onDeleted,
  onClick,
  disabled,
}: TroubleShootingCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleCloseMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside(handleCloseMenu);

  const shouldShowVisibilityIcon = status === "complete" && visibility;
  const shouldShowSummaryType = status === "created";

  const isClickable = typeof onClick === "function" && !disabled;
  const handleRootClick = () => {
    if (isClickable) onClick(Number(id));
  };

  const handleRootKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      if (isClickable) onClick(Number(id));
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "이 문서를 영구적으로 삭제할까요? 삭제 후에는 복구할 수 없습니다."
      )
    )
      return;
    try {
      setDeleting(true);
      const postId = Number(id);
      await hardDeletePost(postId);
      onDeleted?.(postId);
      console.log("문서가 영구 삭제되었습니다.");
    } catch (err: any) {
      console.error(err);
      alert(
        err?.response?.data?.message ??
          "삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  return (
    <div
      className={`w-full py-5 sm:py-7 flex flex-row items-start gap-2.5 border-b border-gray3 bg-white ${
        isClickable
          ? "cursor-pointer"
          : disabled
          ? "cursor-not-allowed opacity-60"
          : ""
      }`}
      onClick={handleRootClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={handleRootKeyDown}
      aria-disabled={disabled || undefined}
    >
      <div className="w-full flex flex-col">
        {/* 작성자 (검색 결과에서만 표시) */}
        {isSearchResult && (
          <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-[12px]">
            <img
              src={imageIcon}
              alt="profile"
              className="w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-full"
            />
            <span
              className="text-head-20-semibold sm:text-head-24-bold truncate"
              title={authorName}
            >
              {authorName}
            </span>
          </div>
        )}

        {/* 에러 종류 + 케밥 메뉴 */}
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div
            className="text-body-14-regular sm:text-body-16-regular text-gray-800 truncate"
            title={errorCategory}
          >
            {errorCategory}
          </div>
          {!isSearchResult && isMine && (
            <div
              ref={menuRef}
              className="relative"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <KebabMenuButton
                onClick={() => !deleting && setShowMenu(!showMenu)}
              />
              {showMenu && (
                <KebabDropdown
                  options={[
                    {
                      label: deleting ? "삭제 중..." : "삭제",
                      onClick: deleting ? () => {} : handleDelete,
                    },
                  ]}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center self-stretch gap-4 md:gap-6">
          {/* 트러블로그 내용 영역 */}
          <div className="w-full md:flex-1 md:min-w-0 flex flex-col items-start gap-6">
            <div className="flex flex-col items-start gap-4 self-stretch min-w-0">
              {/* 제목 */}
              <div className="flex flex-wrap items-center gap-2 self-stretch min-w-0">
                <div className="text-head-24-bold break-words min-w-0">
                  {title}
                </div>
                {shouldShowSummaryType && summaryType && (
                  <div className="text-gray3 text-body-14-regular sm:text-body-16-regular">
                    · {summaryType}
                  </div>
                )}
                {shouldShowVisibilityIcon && visibility && (
                  <img
                    src={visibility === "public" ? publicIcon : privateIcon}
                    alt={visibility}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                )}
              </div>
              {/* 내용 프리뷰 (모바일에서 라인 클램프) */}
              <div className="w-full text-gray3 text-body-14-regular sm:text-body-16-regular md:text-body-20-regular break-words min-w-0 line-clamp-3 sm:line-clamp-2">
                {content}
              </div>
            </div>
            {/* 태그 + 중요도 + 날짜 */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <TagList tags={tags} variant="mypage" />
              <div className="flex items-center gap-3">
                {!isSearchResult && importance !== undefined && (
                  <div className="flex items-center gap-1">
                    <img
                      src={starIcon}
                      alt="star"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums">
                      {importance}
                    </span>
                  </div>
                )}

                {/* 좋아요 + 댓글 수 (내 글이 아닐 때만) */}
                {!isMine &&
                  (likeCount !== undefined || commentCount !== undefined) && (
                    <div className="flex items-center gap-3">
                      {likeCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <img
                            src={heartIcon}
                            alt="likes"
                            className="w-4 h-4 sm:w-5 sm:h-5"
                          />
                          <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums">
                            {likeCount}
                          </span>
                        </div>
                      )}
                      {commentCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <img
                            src={commentIcon}
                            alt="comments"
                            className="w-4 h-4 sm:w-5 sm:h-5"
                          />
                          <span className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums">
                            {commentCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                <div className="text-gray3 text-body-14-regular sm:text-body-16-regular">
                  ·
                </div>
                <div className="text-gray3 text-body-14-regular sm:text-body-16-regular tabular-nums">
                  {createdAt}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 트러블로그 썸네일 */}
      <div className="mt-3 w-full md:w-[450px] h-[200px] rounded-[16px] bg-[#ECECEC] overflow-hidden">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt="thumbnail"
            className="w-full h-full object-cover rounded-[16px]"
          />
        )}
      </div>
    </div>
  );
};

export default TroubleShootingCard;
