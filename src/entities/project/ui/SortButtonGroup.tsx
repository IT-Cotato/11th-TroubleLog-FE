interface SortButtonGroupProps {
  selected: "latest" | "important";
  onSelect: (value: "latest" | "important") => void;
}

export default function SortButtonGroup({
  selected,
  onSelect,
}: SortButtonGroupProps) {
  return (
    <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
      <button onClick={() => onSelect("latest")}>
        <span
          className={
            selected === "latest"
              ? "text-head-20-semibold underline"
              : "text-body-20-regular text-gray3"
          }
        >
          최신순
        </span>
      </button>
      <button onClick={() => onSelect("important")}>
        <span
          className={
            selected === "important"
              ? "text-head-20-semibold underline"
              : "text-body-20-regular text-gray3"
          }
        >
          중요도순
        </span>
      </button>
    </div>
  );
}
