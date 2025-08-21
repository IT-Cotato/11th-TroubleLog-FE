import { useNavigate } from "react-router-dom";
import logo from "@/assets/icons/logo.svg";
import { PATH } from "@/constants/paths";
import { useViewerId } from "@/store/auth";

type HeaderLogoOnlyProps = {
  /** 그림자 유무 (랜딩에서 투명 헤더가 필요하면 false로) */
  withShadow?: boolean;
  /** 클릭 시 이동 경로를 강제로 지정하고 싶을 때 (기본: 로그인 전 ROOT, 로그인 후 HOME) */
  to?: string;
};

export default function HeaderLogoOnly({
  withShadow = true,
  to,
}: HeaderLogoOnlyProps) {
  const navigate = useNavigate();
  const viewerId = useViewerId();

  // 기본 네비게이션: 로그인된 경우 홈, 아니면 루트(로그인)
  const defaultTo = to ?? (viewerId != null ? PATH.HOME : PATH.ROOT);

  return (
    <div
      className={[
        "flex w-full justify-between items-center",
        // 기존 Header와 동일한 여백/반응형 패딩
        "py-4 sm:py-5 lg:py-[25px] px-4 sm:px-6 lg:px-[88px]",
        withShadow ? "shadow-[0_0_6px_0_rgba(0,0,0,0.12)]" : "",
        "bg-white",
      ].join(" ")}
    >
      <img
        src={logo}
        alt="Troublog 로고"
        className="w-[56px] h-[40px] sm:w-[70px] sm:h-[51px] cursor-pointer select-none"
        onClick={() => navigate(defaultTo)}
      />
      {/* 로고만 표시 (오른쪽 액션 비움) */}
      <div aria-hidden className="w-0 h-0" />
    </div>
  );
}
