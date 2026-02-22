import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDeleteModal from "../../../shared/ui/Modal/ConfirmDeleteModal";
import KebabMenuButton from "../../../shared/ui/Menu/KebabMenuButton";
import KebabDropdown from "../../../shared/ui/Menu/KebabDropdown";
import replyIcon from "@/assets/icons/reply_icon.svg";
import image from "@/assets/icons/image.svg";
import { PATH } from "@/shared/config/paths";
import { usePrefetch } from "@/shared/hooks/usePrefetch";
import useClickOutside from "@/hooks/useClickOutside";

export interface PostCommentProps {
  id: string;
  profile?: string;
  name: string;
  date: string;
  content: string;
  isMine: boolean;
  isReply: boolean;
  parentId?: string; // 대댓글일 경우
  userId?: number; // 댓글 작성자 ID
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  onReply?: (replyContent: string) => Promise<void> | void;
  onReport?: (commentId: string) => void;
}

function PostComment({
  id,
  profile,
  name,
  date,
  content,
  isMine,
  isReply,
  userId,
  onEdit,
  onDelete,
  onReply,
  onReport,
}: PostCommentProps) {
  const navigate = useNavigate();
  const prefetch = usePrefetch();
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editPosting, setEditPosting] = useState(false);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyPosting, setReplyPosting] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletePosting, setDeletePosting] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useClickOutside(() => setShowMenu(false));

  const handleProfileClick = () => {
    if (userId) {
      navigate(PATH.MYPAGE_ID(String(userId)));
    }
  };

  return (
    <div className="flex w-full max-w-[1200px]">
      {isReply && (
        <div className="mt-6 sm:mt-[31px] ml-6 sm:ml-[38px] mr-4 sm:mr-[16px]">
          <img
            src={replyIcon}
            alt=""
            aria-hidden="true"
            className="w-4 h-4 sm:w-[20px] sm:h-[21px]"
          />
        </div>
      )}
      <div className="flex w-full py-4 sm:py-[24px] items-center border-b border-gray1 bg-white">
        <div className="flex w-full flex-col items-start gap-6 sm:gap-[36px]">
          {/* 댓글 정보 */}
          <div className="flex flex-col items-start gap-6 sm:gap-[36px] self-stretch">
            {/* 작성자 정보 & 작성일 & (수정, 삭제 버튼) */}
            <div className="flex w-full justify-between">
              <div className="flex items-center gap-3 sm:gap-[11px]">
                {/* 프로필 이미지 */}
                <div
                  onClick={handleProfileClick}
                  onMouseEnter={() =>
                    userId && prefetch(PATH.MYPAGE_ID(String(userId)))
                  }
                  className={userId ? "cursor-pointer" : ""}
                >
                  <img
                    src={profile || image}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = image;
                    }}
                    alt="profile"
                    className={`w-10 h-10 sm:w-[52px] sm:h-[52px] rounded-full object-cover ${
                      userId ? "hover:opacity-80 transition-opacity" : ""
                    }`}
                  />
                </div>

                <div className="flex flex-col items-start gap-[2px]">
                  {/* 작성자명 */}
                  <div
                    onClick={handleProfileClick}
                    className={`text-head-20-semibold ${
                      userId
                        ? "cursor-pointer hover:opacity-80 transition-opacity"
                        : ""
                    }`}
                  >
                    {name}
                  </div>
                  {/* 작성일 */}
                  <div className="text-body-16-regular text-gray3">{date}</div>
                </div>
              </div>

              {/* 수정, 삭제 (본인) / 신고하기 (타인) */}
              {isMine ? (
                <div className="flex items-center gap-[8px] text-body-16-regular text-gray3">
                  <div
                    className="cursor-pointer"
                    onClick={() => setEditMode(true)}
                  >
                    수정
                  </div>
                  <div>·</div>
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    삭제
                  </div>
                </div>
              ) : (
                onReport && (
                  <div className="relative shrink-0" ref={menuRef}>
                    <KebabMenuButton
                      onClick={() => setShowMenu(!showMenu)}
                    />
                    {showMenu && (
                      <KebabDropdown
                        options={[
                          {
                            label: "신고하기",
                            onClick: () => {
                              setShowMenu(false);
                              onReport(id);
                            },
                          },
                        ]}
                      />
                    )}
                  </div>
                )
              )}
            </div>

            {/* 댓글 내용 (수정 옵션 포함) */}
            {editMode ? (
              <div className="w-full">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[80px] p-3 border rounded-md resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded-full"
                    onClick={() => {
                      setEditContent(content);
                      setEditMode(false);
                    }}
                  >
                    취소
                  </button>
                  <button
                    className={`px-4 py-2 rounded-full text-white ${
                      editContent.trim() && !editPosting
                        ? "bg-primary"
                        : "bg-gray-300"
                    }`}
                    disabled={!editContent.trim() || editPosting}
                    onClick={async () => {
                      try {
                        setEditPosting(true);
                        await onEdit?.(editContent);
                        setEditMode(false);
                      } finally {
                        setEditPosting(false);
                      }
                    }}
                  >
                    {editPosting ? "저장 중…" : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-body-20-regular break-words whitespace-pre-wrap w-full">
                {content}
              </div>
            )}
          </div>

          {/* 답글 달기 버튼 */}
          {onReply && (
            <div
              className="text-body-16-regular text-gray3 cursor-pointer"
              onClick={() => setReplyOpen(!replyOpen)}
            >
              {replyOpen ? "답글 취소" : "답글 달기"}
            </div>
          )}

          {/* 답글 입력창 */}
          {replyOpen && (
            <div className="w-full mt-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력하세요"
                className="w-full h-[80px] p-3 border rounded-md resize-none"
              />
              <button
                className={`mt-2 px-4 py-2 rounded-full text-white ${
                  replyContent.trim() && !replyPosting
                    ? "bg-primary"
                    : "bg-gray-300"
                }`}
                disabled={!replyContent.trim() || replyPosting}
                onClick={async () => {
                  try {
                    setReplyPosting(true);
                    await onReply?.(replyContent);
                    setReplyContent("");
                    setReplyOpen(false);
                  } finally {
                    setReplyPosting(false);
                  }
                }}
              >
                {replyPosting ? "작성 중…" : "답글 작성"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          onClose={() => !deletePosting && setShowDeleteModal(false)}
          onConfirm={async () => {
            try {
              setDeletePosting(true);
              await onDelete?.();
              setShowDeleteModal(false);
            } finally {
              setDeletePosting(false);
            }
          }}
          title="댓글 삭제"
          description="정말 삭제하시겠습니까?"
        />
      )}
    </div>
  );
}

// React.memo로 불필요한 리렌더링 방지
export default memo(PostComment);
