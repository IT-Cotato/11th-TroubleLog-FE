import BaseModal from "./BaseModal";
import CancelButton from "../Button/CancelButton";

interface WithdrawCompleteModalProps {
  onClose: () => void;
}

export default function WithdrawCompleteModal({
  onClose,
}: WithdrawCompleteModalProps) {
  return (
    <BaseModal
      onClose={onClose}
      width="w-full max-w-[480px]"
      className="px-6 sm:px-10 pt-8 sm:pt-12 pb-8 sm:pb-12"
    >
      <div className="flex flex-col items-center gap-6 sm:gap-10 self-stretch text-center">
        <span className="text-head-32-semibold">회원 탈퇴</span>
        <p className="text-body-20-regular text-gray3 whitespace-pre-line">
          탈퇴가 완료되었습니다
        </p>
      </div>

      <div className="mt-6 sm:mt-8 flex items-center justify-center">
        <CancelButton onClick={onClose} label="닫기" />
      </div>
    </BaseModal>
  );
}
