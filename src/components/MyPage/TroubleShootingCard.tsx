import { useState, useCallback } from "react";
import type { StatusType, VisibilityType } from "@/types/project";
import KebabMenuButton from "@/components/Menu/KebabMenuButton";
import KebabDropdown from "@/components/Menu/KebabDropdown";
import useClickOutside from "@/hooks/useClickOutside";
import TagList from "@/components/Card/TagList";
import imageIcon from "@/assets/icons/image.svg";
import publicIcon from "@/assets/icons/public.svg";
import privateIcon from "@/assets/icons/private.svg";
import starIcon from "@/assets/icons/star.svg";
import heartIcon from "@/assets/icons/heart.svg";
import commentIcon from "@/assets/icons/comment.svg";
import { deletePost } from "@/api/post.api";

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
}: TroubleShootingCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const handleCloseMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside(handleCloseMenu);

  const shouldShowVisibilityIcon = status === "complete" && visibility;
  const shouldShowSummaryType = status === "created";

  // 문서 삭제
  const handleDelete = async () => {
    if (!window.confirm("이 문서를 휴지통으로 이동할까요?")) return;

    try {
      setDeleting(true);
      const postId = Number(id);

      await deletePost(postId);

      onDeleted?.(postId);
      console.log("임시 삭제되었습니다. (관리자 복구 가능)");
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
    <div className="w-full py-[30px] flex flex-col items-start gap-[10px] border-b border-gray3 bg-white">
      <div className="w-full flex flex-col">
        {/* 작성자 */}
        {isSearchResult && (
          <div className="mb-[25px] flex items-center gap-[12px]">
            <img src={imageIcon} alt="profile" className="w-[52px] h-[52px]" />
            <span className="text-head-24-bold">{authorName}</span>
          </div>
        )}

        {/* 에러 종류 + 케밥 메뉴 */}
        <div className="flex justify-between items-start mb-[24px]">
          <div className="text-body-16-regular">{errorCategory}</div>
          {!isSearchResult && isMine && (
            <div ref={menuRef} className="relative">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center self-stretch gap-[20px]">
          {/* 트러블로그 내용 영역 */}
          <div className="w-full md:w-[680px] flex flex-col items-start gap-[34px]">
            <div className="flex flex-col items-start gap-[24px] self-stretch">
              {/* 제목 */}
              <div className="flex flex-col items-start gap-[16px]">
                <div className="flex items-center gap-[8px] self-stretch">
                  <div className="text-head-24-bold break-words">{title}</div>
                  {shouldShowSummaryType && summaryType && (
                    <div className="text-gray3 text-body-16-regular">
                      · {summaryType}
                    </div>
                  )}
                  {shouldShowVisibilityIcon && visibility && (
                    <img
                      src={visibility === "public" ? publicIcon : privateIcon}
                      alt={visibility}
                      className="w-[24px] h-[24px]"
                    />
                  )}
                </div>
              </div>
              {/* 내용 프리뷰 */}
              <div className="w-full text-gray3 text-ellipsis text-body-20-regular break-words">
                {content}
              </div>
            </div>
            {/* 태그 + 중요도 + 날짜 */}
            <div className="flex flex-wrap items-center gap-[12px]">
              <TagList tags={tags} variant="mypage" />
              <div className="flex items-center gap-[12px]">
                {importance !== undefined && (
                  <>
                    <div className="flex items-center gap-[4px]">
                      <img
                        src={starIcon}
                        alt="star"
                        className="w-[20px] h-[20px]"
                      />
                      <span className="text-gray3 text-body-16-regular">
                        {importance}
                      </span>
                    </div>
                  </>
                )}

                {/* 좋아요 + 댓글 수 */}
                {(likeCount !== undefined || commentCount !== undefined) && (
                  <div className="flex items-center gap-[12px]">
                    {likeCount !== undefined && (
                      <div className="flex items-center gap-[4px]">
                        <img
                          src={heartIcon}
                          alt="likes"
                          className="w-[20px] h-[20px]"
                        />
                        <span className="text-gray3 text-body-16-regular">
                          {likeCount}
                        </span>
                      </div>
                    )}
                    {commentCount !== undefined && (
                      <div className="flex items-center gap-[4px]">
                        <img
                          src={commentIcon}
                          alt="comments"
                          className="w-[20px] h-[20px]"
                        />
                        <span className="text-gray3 text-body-16-regular">
                          {commentCount}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-gray3 text-body-16-regular">·</div>
                <div className="text-gray3 text-body-16-regular">
                  {createdAt}
                </div>
              </div>
            </div>
          </div>
          {/* 트러블로그 썸네일 */}
          <div className="w-full md:w-[240px] h-[144px] rounded-[16px] bg-[#ECECEC] overflow-hidden">
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="thumbnail"
                className="w-full h-full object-cover rounded-[16px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleShootingCard;
