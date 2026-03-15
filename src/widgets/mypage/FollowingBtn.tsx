import { useNavigate } from "react-router-dom";
import userIcon from "@/assets/icons/user.svg";

interface FollowingProps {
  userId: number;
  nickname: string;
  email: string;
  profileUrl: string;
  isFollowed: boolean;
  onFollowClick: () => void;
  /** 팔로우 요청 진행 중일 때 버튼 비활성화 (중복 요청 방지) */
  followButtonDisabled?: boolean;
}

const FollowingBtn = ({
  userId,
  nickname,
  email,
  profileUrl,
  isFollowed,
  onFollowClick,
  followButtonDisabled = false,
}: FollowingProps) => {
  const nav = useNavigate();
  const goProfile = () => nav(`/user/mypage/${userId}`);

  return (
    <div className="flex justify-between items-center self-stretch w-full py-4 sm:py-6 border-b border-gray1">
      {/* 왼쪽: 프로필(클릭 시 이동) */}
      <button
        type="button"
        onClick={goProfile}
        className="flex items-center gap-3 sm:gap-4 min-w-0 focus:outline-none"
      >
        <img
          src={profileUrl || userIcon}
          alt="user"
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-[52px] md:h-[52px] rounded-full object-cover"
        />
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <p className="font-sans font-bold leading-normal text-xl sm:text-2xl truncate max-w-[44vw] sm:max-w-[360px]">
            {nickname}
          </p>
          <p className="text-body-14-regular sm:text-body-16-regular text-gray-600 truncate max-w-[44vw] sm:max-w-[360px]">
            {email}
          </p>
        </div>
      </button>

      {/* 오른쪽: 팔로우 버튼 */}
      <button
        type="button"
        onClick={onFollowClick}
        disabled={followButtonDisabled}
        className={`h-9 sm:h-10 px-3 sm:px-4 rounded-[10px] text-white text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed ${
          isFollowed ? "bg-subColor1" : "bg-primary"
        }`}
      >
        {isFollowed ? "팔로잉" : "팔로우"}
      </button>
    </div>
  );
};

export default FollowingBtn;
