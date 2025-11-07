import kakaoLogoIcon from "@/assets/icons/kakaologo.svg";
import BaseModal from "./BaseModal";

type Props = {
  open: boolean;
  email?: string;
  onClose: () => void;
  onLink: () => void; // "카카오 연동하기"
};

export default function KakaoLinkConfirmModal({
  open,
  email = "user@example.com",
  onClose,
  onLink,
}: Props) {
  if (!open) return null;

  return (
    <BaseModal onClose={onClose} width="w-[min(526px)]" className="py-12 px-24">
      <div className="w-full text-center space-y-4">
        <h3 className="text-head-32-bold">이미 가입된 이메일입니다.</h3>

        <p className="text-body-16-regular">
          <span className="font-semibold">{email}</span> 이메일로 이미 계정이
          존재합니다.
          <br />
          “기존 계정과 카카오 계정을 연결하시겠습니까?”
        </p>

        <button
          type="button"
          onClick={onLink}
          className="mx-auto mt-4 flex w-44 h-12 py-4 items-center justify-center gap-[0.63rem] rounded-[999px] bg-[#FEE500] hover:brightness-95 active:scale-[0.99] transition"
        >
          <img src={kakaoLogoIcon} alt="kakao" className="w-5 h-5" />
          <span className="text-head-20-semibold">카카오 연동하기</span>
        </button>
      </div>
    </BaseModal>
  );
}
