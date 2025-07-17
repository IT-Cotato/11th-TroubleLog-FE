import useClickOutside from "@/hooks/useClickOutside";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const modalRef = useClickOutside(onClose);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      {/* 배경 블러 */}
      <div className="absolute inset-0 backdrop-blur-sm" />

      {/* 모달 본문 */}
      <div
        ref={modalRef}
        className="relative z-10 w-[580px] rounded-[20px] bg-white shadow-card flex flex-col px-[64px] pt-[67px] pb-[66px] items-center gap-[40px]"
      >
        {/* 제목 + 내용 */}
        <div className="flex flex-col items-center gap-[40px] self-stretch">
          {/* 제목 */}
          <span className="text-head-32-semibold">프로젝트 삭제</span>
          {/* 내용 */}
          <p className="text-center text-body-20-regular text-gray3">
            정말 삭제하시겠습니까?
            <br />
            삭제 후 복구되지 않습니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex items-center gap-[17px]">
          {/* 취소 */}
          <CancelButton onClick={onClose} />
          {/* 삭제 */}
          <SaveButton onClick={onConfirm} label="삭제" />
        </div>
      </div>
    </div>
  );
}
