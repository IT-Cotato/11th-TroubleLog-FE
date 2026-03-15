import type { RefObject } from "react";
import { useNavigate } from "react-router-dom";
import TagList from "@/entities/trouble/ui/TagList";
import KebabDropdown from "@/shared/ui/Menu/KebabDropdown";
import KebabMenuButton from "@/shared/ui/Menu/KebabMenuButton";
import imageIcon from "@/assets/icons/image.svg";
import starIcon from "@/assets/icons/star.svg";
import type { CommunityPostDetailProps } from "@/pages/Community/types";
import { PATH } from "@/shared/config/paths";

export interface PostDetailHeaderProps {
  post: CommunityPostDetailProps;
  menuRef: RefObject<HTMLDivElement | null>;
  showMenu: boolean;
  setShowMenu: (v: boolean) => void;
  deleting: boolean;
  onEdit: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onReport: () => void;
  onAuthorClick: () => void;
}

/**
 * 커뮤니티 포스트 상세 상단: 에러 타입, 케밥 메뉴, 제목, 태그·날짜, 작성자·중요도
 */
export function PostDetailHeader({
  post,
  menuRef,
  showMenu,
  setShowMenu,
  deleting,
  onEdit,
  onDelete,
  onReport,
  onAuthorClick,
}: PostDetailHeaderProps) {
  const navigate = useNavigate();

  const handleTagClick = (tag: string) => {
    const searchParams = new URLSearchParams({ query: tag });
    navigate(`${PATH.SEARCH}?${searchParams.toString()}`);
  };

  return (
    <div className="flex w-full pt-20 sm:pt-[180px] pb-[18px] items-center border-b border-gray1">
      <div className="flex flex-col items-start gap-8 sm:gap-[44px] w-full">
        <div className="flex flex-col items-start gap-8 sm:gap-[53px] w-full">
          <div className="flex flex-col items-start gap-[10px] w-full">
            <div className="flex w-full justify-between items-start gap-2">
              <span className="text-head-20-semibold">{post.errorType}</span>
              <div className="relative shrink-0" ref={menuRef}>
                <KebabMenuButton onClick={() => setShowMenu(!showMenu)} />
                {showMenu && (
                  <KebabDropdown
                    options={
                      post.isMine
                        ? [
                            { label: "포스트 수정", onClick: () => void onEdit() },
                            {
                              label: deleting ? "삭제 중..." : "삭제",
                              onClick: () => !deleting && void onDelete(),
                            },
                          ]
                        : [
                            {
                              label: "신고하기",
                              onClick: () => {
                                setShowMenu(false);
                                onReport();
                              },
                            },
                          ]
                    }
                  />
                )}
              </div>
            </div>
            <div className="text-head-48 break-words">{post.title}</div>
          </div>
          <div className="flex flex-wrap items-center gap-[12px] sm:gap-[16px]">
            <TagList tags={post.tags} variant="post" onTagClick={handleTagClick} />
            <div className="text-body-16-regular text-gray3">·</div>
            <div className="text-body-20-regular text-gray3">{post.date}</div>
          </div>
        </div>
        <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div
            className="flex items-center gap-[14px] sm:gap-[20px] cursor-pointer"
            onClick={onAuthorClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAuthorClick();
              }
            }}
          >
            <img
              src={post.authorProfile || imageIcon}
              onError={(e) => (e.currentTarget.src = imageIcon)}
              alt="profile"
              className="w-12 h-12 sm:w-[66px] sm:h-[66px] rounded-full object-cover"
            />
            <div className="text-head-24-bold">{post.authorName}</div>
          </div>
          {post.isMine && post.importance !== 0 && (
            <div className="flex items-center gap-[8px]">
              <img
                src={starIcon}
                alt="importance"
                className="w-5 h-5 sm:w-[24px] sm:h-[24px]"
              />
              <div className="text-body-20-regular text-gray3">{post.importance}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
