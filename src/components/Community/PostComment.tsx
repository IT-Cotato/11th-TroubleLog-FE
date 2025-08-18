import { useState } from "react";
import ConfirmDeleteModal from "../Modal/ConfirmDeleteModal";
import replyIcon from "@/assets/icons/reply_icon.svg";
import image from "@/assets/icons/image.svg";

export interface PostCommentProps {
  id: string;
  profile?: string;
  name: string;
  date: string;
  content: string;
  isMine: boolean;
  isReply: boolean;
  parentId?: string; // 대댓글일 경우
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  onReply?: (replyContent: string) => Promise<void> | void;
}

export default function PostComment({
  profile,
  name,
  date,
  content,
  isMine,
  isReply,
  onEdit,
  onDelete,
  onReply,
}: PostCommentProps) {
  // 댓글 수정 상태 관리
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editPosting, setEditPosting] = useState(false);

  // 답글 달기 상태 관리
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyPosting, setReplyPosting] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  // 삭제 확인 모달
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletePosting, setDeletePosting] = useState(false);

  return (
    <div className="flex w-[1200px]">
      {isReply && (
        <div className="mt-[31px] ml-[38px] mr-[16px]">
          <img
            src={replyIcon}
            alt=""
            aria-hidden="true"
            className="w-[20px] h-[21px]"
          />
        </div>
      )}
      <div className="flex w-full py-[24px] items-center border-b border-gray1 bg-white">
        <div className="flex w-full flex-col items-start gap-[36px]">
          {/* 댓글 정보 */}
          <div className="flex flex-col items-start gap-[36px] self-stretch">
            {/* 작성자 정보 & 작성일 & (수정, 삭제 버튼) */}
            <div className="flex w-full justify-between">
              <div className="flex items-center gap-[11px]">
                {/* 프로필 이미지 */}
                <img
                  src={profile || image}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = image;
                  }}
                  alt="profile"
                  className="w-[52px] h-[52px]"
                />

                <div className="flex flex-col items-start gap-[2px]">
                  {/* 작성자명 */}
                  <div className="text-head-20-semibold">{name}</div>
                  {/* 작성일 */}
                  <div className="text-body-16-regular text-gray3">{date}</div>
                </div>
              </div>

              {/* 수정, 삭제 버튼 (작성자 본인일 경우) */}
              {isMine && (
                <div className="flex items-center gap-[8px] text-body-16-regular text-gray3">
                  {/* 수정 */}
                  <div
                    className="cursor-pointer"
                    onClick={() => setEditMode(true)}
                  >
                    수정
                  </div>
                  {/* 구분점 */}
                  <div>·</div>
                  {/* 삭제 */}
                  <div
                    className="cursor-pointer"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    삭제
                  </div>
                </div>
              )}
            </div>

            {/* 댓글 내용 (수정 옵션 포함 - 임시 디자인) */}
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
                      } catch {
                        // 실패 시 유지
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
              <div className="text-body-20-regular">{content}</div>
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

          {/* 답글 입력창 (임시 디자인) */}
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
                  } catch {
                    // 실패 시 유지하거나 토스트 노출 등
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
