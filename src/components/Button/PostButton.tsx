export default function PostButton() {
  return (
    <button
      type="button"
      className="flex w-[184px] h-[56px] pt-[10px] pr-[52px] pb-[10px] pl-[24px] items-center gap-5 rounded-[50px] bg-primary"
    >
      <img
        src="/icons/create.svg"
        className="w-[36px] h-[36px] shrink-0"
        alt="create"
      />
      <span className="text-white text-head-20-semibold">글쓰기</span>
    </button>
  );
}
