import BaseModal from "../../components/Modal/BaseModal";
import { useNavigate } from "react-router-dom";
import { PATH } from "@/constants/paths";
import exitIcon from "@/assets/icons/exiticon.svg";
import postSuccessIcon from "@/assets/icons/postsuccess.svg";

export default function PostSuccessModal({
  onClose,
  summaryId,
}: {
  onClose: () => void;
  summaryId?: number;
}) {
  const navigate = useNavigate();

  return (
    <BaseModal
      onClose={onClose}
      width="w-[580px]"
      className="bg-white rounded-[12px] h-[355px] pr-[36px]"
    >
      {/* 헤더 */}
      <div className="flex flex-col justify-center mt-[39px] ml-[100px] ">
        <div className="flex w-full pl-[420px] ">
          <button onClick={onClose} className="w-6 h-6">
            <img src={exitIcon} alt="닫기" className="" />
          </button>
        </div>
        <div className="flex flex-col w-[381px] gap-[40px] items-center">
          <img src={postSuccessIcon} className="w-[88px] h-[86px]" />
          <span className="text-head-32-bold ">
            {/* {$제목}을 {양식}으로 요약중입니다! */} 양식 요약이
            완료되었습니다!
          </span>
          <button
            className="flex w-[184px] h-[46px] px-[25px] py-[14px] justify-center items-center rounded-[50px] bg-purple-500 border-purple-500 text-white text-semibold"
            onClick={() => navigate(PATH.POST_SUMMARY(summaryId!))}
          >
            완성 페이지로 이동
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
