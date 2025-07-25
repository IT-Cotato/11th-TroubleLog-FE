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
      className="px-[64px] pt-[67px] pb-[66px] gap-[40px]"
    >
      <div className="flex flex-col items-center gap-[40px] self-stretch">
        <span className="text-head-32-semibold">회원 탈퇴</span>
        <p className="text-center text-body-20-regular text-gray3 whitespace-pre-line">
          탈퇴가 완료되었습니다
        </p>
      </div>

      <div className="flex items-center gap-[17px]">
        <CancelButton onClick={onClose} label="닫기" />
      </div>
    </BaseModal>
  );
}
