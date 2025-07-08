import { useNavigate } from "react-router-dom";

const MyPageSideBar = () => {
  const navigate = useNavigate();
  return (
    <div className="flex w-[296px] flex-col items-start gap-[140px]">
      <div className="flex flex-col items-center gap-3 self-stretch">
        <img src="/icons/user.svg" alt="user" className="w-[288px] h-[288px]" />
        <div className="flex flex-col items-start gap-3 ">
          <div className="flex flex-col items-start gap-2">
            <p className="text-head-32-semibold">이름</p>
            <div className="flex gap-1 text-body-20-regular text-gray4">
              <button onClick={() => navigate("following")}>팔로잉 8 </button> ·
              <button onClick={() => navigate("follower")}>팔로워 6</button>
            </div>

            <p className="text-body-20-regular pt-4 pb-1">한줄 소개</p>
            <button className="w-[296px] h-[42px] py-[9px] justify-center items-center rounded-[10px] text-head-20-semibold bg-primary text-white">
              팔로우
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-9 self-stretch text-gray3 text-head-20-semibold">
        <div className="w-full">
          <div className="border-b border-gray3 w-full pb-2">
            내 트러블 슈팅
          </div>
          <div className="flex flex-col items-start gap-[13px] pt-2 text-body-16-regular text-gray3">
            전체보기(4)
            <div className="flex items-center gap-2">
              <img
                src="/icons/circle_y.svg"
                alt="user"
                className="w-3.5 h-3.5"
              />
              작성 중(1)
            </div>
            <div className="flex items-center gap-2">
              <img
                src="/icons/circle_g.svg"
                alt="user"
                className="w-3.5 h-3.5"
              />
              작성 완료(2)
            </div>
            <div className="flex items-center gap-2">
              <img
                src="/icons/circle_b.svg"
                alt="user"
                className="w-3.5 h-3.5"
              />
              작성+요약 완료 (1)
            </div>
          </div>
        </div>

        <button>통계 시각화</button>
        <button>좋아요한 포스트</button>
      </div>
    </div>
  );
};

export default MyPageSideBar;
