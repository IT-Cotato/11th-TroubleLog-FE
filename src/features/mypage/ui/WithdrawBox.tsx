interface WithdrawBoxProps {
  onWithdraw: () => void;
}

const WithdrawBox = ({ onWithdraw }: WithdrawBoxProps) => {
  return (
    <div className="flex flex-col w-[700px] h-[173px] ml-20 px-7 py-6 items-start gap-2.5 shrink-0 rounded-lg border border-red1 bg-red1/10">
      <p className="text-head-20-semibold">회원탈퇴</p>
      <p className="text-body-20-regular text-gray4">
        탈퇴 시 작성하신 포스트 및 댓글이 모두 삭제되며 복구되지 않습니다.
      </p>
      <button
        onClick={onWithdraw}
        className="flex px-6 py-3.5 justify-center items-center rounded-xl bg-red1 text-white text-body-16-semibold"
      >
        탈퇴하기
      </button>
    </div>
  );
};

export default WithdrawBox;
