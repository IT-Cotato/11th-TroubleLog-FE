import BaseModal from "./BaseModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onGoLogin: () => void; // "로그인하기"
};

export default function KakaoLinkDoneModal({
  open,
  onClose,
  onGoLogin,
}: Props) {
  if (!open) return null;

  return (
    <BaseModal onClose={onClose} width="w-[min(526px)]" className="py-12 px-24">
      <div className="w-full text-center space-y-6">
        <h3 className="text-head-32-bold">연동이 완료되었습니다.</h3>

        <button
          type="button"
          onClick={onGoLogin}
          className="mx-auto flex bg-primary text-white w-44 h-12 py-4 items-center justify-center rounded-[999px] hover:brightness-110 active:scale-[0.99] transition"
        >
          로그인하기
        </button>
      </div>
    </BaseModal>
  );
}
