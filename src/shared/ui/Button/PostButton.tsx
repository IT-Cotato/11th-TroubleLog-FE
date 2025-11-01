import create from "@/assets/icons/create.svg";

interface PostButtonProps {
  onClick?: () => void;
}

export default function PostButton({ onClick }: PostButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[120px] h-[40px] sm:h-[48px]
                 px-3 sm:pl-[18px] sm:pr-[36px]
                 items-center gap-2 sm:gap-4
                 rounded-[40px] bg-primary"
    >
      <img src={create} className="w-[22px] h-[22px] shrink-0" alt="create" />
      <span className="text-white text-head-20-semibold sm:text-body-20-regular">
        글쓰기
      </span>
    </button>
  );
}
