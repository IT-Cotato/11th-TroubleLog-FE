import { useNavigate } from "react-router-dom";
import userIcon from "@/assets/icons/user.svg";

interface FollowingProps {
  nickname: string;
  email: string;
  profileUrl: string;
  isFollowed: boolean;
  onFollowClick: () => void;
}

const FollowingBtn = ({
  nickname,
  email,
  profileUrl,
  isFollowed,
  onFollowClick,
}: FollowingProps) => {
  const nav = useNavigate();
  return (
    <div className="flex justify-between w-[948px] items-center self-stretch py-[25px] border-b border-gray1">
      <div className="flex items-center gap-3" onClick={() => nav(profileUrl)}>
        <img src={userIcon} alt="user" className="w-[52px] h-[52px]" />

        <div className="flex w-[143px] flex-col items-start gap-0.5">
          <p className="font-sans text-2xl font-bold leading-normal">
            {nickname}
          </p>
          <p className="text-body-16-regular">{email}</p>
        </div>
      </div>
      {isFollowed ? (
        <button
          onClick={onFollowClick}
          className="flex w-[68px] h-10 px-[13px] py-2.5 justify-center items-center rounded-[10px] bg-subColor1 text-white"
        >
          팔로잉
        </button>
      ) : (
        <button
          onClick={onFollowClick}
          className="flex w-[68px] h-10 px-[13px] py-2.5 justify-center items-center rounded-[10px] bg-primary text-white"
        >
          팔로우
        </button>
      )}
    </div>
  );
};

export default FollowingBtn;
