export default function PostButton() {
  return (
    <button
      type="button"
      className="flex min-w-[140px] sm:w-[184px] h-[48px] sm:h-[56px] px-4 sm:pl-[24px] sm:pr-[52px] items-center gap-3 sm:gap-5 rounded-[50px] bg-primary"
    >
      <img
        src="/icons/create.svg"
        className="w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] shrink-0"
        alt="create"
      />
      <span className="text-white text-head-20-semibold">글쓰기</span>
    </button>
  );
}
