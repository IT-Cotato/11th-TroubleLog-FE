import BaseModal from "./BaseModal";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/shared/config/paths";
import exitIcon from "@/assets/icons/exiticon.svg";
import postSuccessIcon from "@/assets/icons/postsuccess.svg";

export default function PostSuccessModal({
  onClose,
  summaryId,
  postId,
}: {
  onClose: () => void;
  summaryId?: number;
  postId?: number;
}) {
  const navigate = useNavigate();

  const canGo = summaryId != null && postId != null;

  const goCombined = () => {
    if (!canGo) {
      alert("요약 상세로 이동할 수 없어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    navigate(PATH.COMBINED_DETAIL(postId!, summaryId!));
  };

  return (
    <BaseModal
      onClose={onClose}
      /* 작은 화면에서는 가득, 데스크톱은 기존 최대폭 유지 */
      width="w-full max-w-[580px]"
      className="bg-white rounded-[12px] px-4 sm:px-6 py-6 sm:py-8"
    >
      {/* 닫기 버튼: 우측 상단 고정 정렬 */}
      <div className="flex w-full justify-end">
        <button onClick={onClose} className="w-6 h-6">
          <img src={exitIcon} alt="닫기" className="w-full h-full" />
        </button>
      </div>

      {/* 본문 */}
      <div className="mx-auto max-w-[420px] flex flex-col items-center text-center gap-6 sm:gap-10">
        <img
          src={postSuccessIcon}
          alt=""
          aria-hidden
          className="w-16 h-16 sm:w-[88px] sm:h-[86px]"
        />
        <h2 className="text-head-32-bold">양식 요약이 완료되었습니다!</h2>

        <button
          onClick={goCombined}
          disabled={!canGo}
          className={`rounded-[50px] h-11 sm:h-[46px] px-6 sm:px-[25px] 
            bg-purple-500 text-white font-semibold
            w-full sm:w-[184px]
            ${!canGo ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          완성 페이지로 이동
        </button>
      </div>
    </BaseModal>
  );
}
