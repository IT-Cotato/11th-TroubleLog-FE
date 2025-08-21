import BaseModal from "../../components/Modal/BaseModal";
import exitIcon from "@/assets/icons/exiticon.svg";

type Props = {
  onClose: () => void;
  summaryId?: number;
  postId?: number;
};

export default function PostSuccessModal({ onClose }: Props) {
  return (
    <BaseModal
      onClose={onClose}
      width="w-full max-w-[520px]"
      className="bg-white rounded-[12px] px-4 sm:px-6 py-6 sm:py-8"
    >
      <div className="flex w-full justify-end">
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>

      <div className="mx-auto max-w-[460px] text-center space-y-3">
        <h2 className="text-head-24-bold">요약 준비가 완료됐어요!</h2>
        <p className="text-body-18-regular text-gray-500">
          저장 또는 공유 메뉴에서 다음 작업을 진행해 주세요.
        </p>
      </div>
    </BaseModal>
  );
}
