import BaseModal from "../../components/Modal/BaseModal";
import exitIcon from "../../../public/icons/exiticon.svg";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import PostSuccessModal from "./PostSuccessModal";
import { useEffect, useState } from "react";
export default function PostLoadingModal({
  onClose,
  progress,
}: {
  onClose: () => void;
  progress: number; // 1, 25, 70, 95, 100 중 하나
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (progress) {
      const timeout = setTimeout(() => {
        setShowSuccess(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  if (showSuccess) {
    return <PostSuccessModal onClose={onClose} />;
  }

  return (
    <BaseModal
      onClose={onClose}
      width="w-[580px]"
      className="bg-white rounded-[12px] h-[355px] pr-[36px]"
    >
      {/* 헤더 */}
      <div className="flex flex-col justify-center mt-[39px] ml-[64px] ">
        <div className="flex w-full pl-[452px] ">
          <button onClick={onClose} className="w-6 h-6 pt">
            <img src={exitIcon} alt="닫기" className="" />
          </button>
        </div>
        <div className="flex flex-col w-[452px] gap-[40px] items-center">
          <span className="text-head-32-bold ">
            {/* {$제목}을 {양식}으로 요약중입니다! */}dfdfdfdf
          </span>
          <div className="w-[100px] h-[100px]">
            <CircularProgressbar
              value={progress}
              text={`${progress}%`}
              styles={buildStyles({
                textSize: "16px",
                pathColor: "#9737FD",
                textColor: "#000",
                trailColor: "#eee",
              })}
            />
          </div>

          <span className="text-body-20-regular text-gray-400">
            10초~20초 정도 소요될 수 있습니다
          </span>
        </div>
      </div>
    </BaseModal>
  );
}
