interface TagListProps {
  tags: string[];
  variant?: "default" | "post" | "mypage";
  onTagClick?: (tag: string) => void;
}

export default function TagList({
  tags,
  variant = "default",
  onTagClick,
}: TagListProps) {
  const wrapperClass = variant === "post" ? "gap-[16px]" : "gap-[6px]";

  const getTagClass = () => {
    switch (variant) {
      case "post":
        return [
          "py-[6px] px-[10px] rounded-[20px] text-body-16-regular text-primary whitespace-nowrap shrink-0",
          "bg-subColor2",
          onTagClick &&
            "cursor-pointer transition-colors hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        ]
          .filter(Boolean)
          .join(" ");
      case "mypage":
        return "flex py-[6px] px-[10px] justify-center items-center gap-[2px] rounded-[20px] bg-gray1 text-primary text-body-14-regular whitespace-nowrap shrink-0";
      case "default":
      default:
        return "py-[2px] px-[6px] bg-subColor2 rounded-2xl text-body-14-regular whitespace-nowrap shrink-0";
    }
  };

  return (
    <div
      className={`flex flex-nowrap items-center overflow-hidden ${wrapperClass}`}
    >
      {tags.map((tag, index) =>
        onTagClick ? (
          <button
            key={`${tag}-${index}`}
            type="button"
            className={getTagClass()}
            title={tag}
            onClick={() => onTagClick(tag)}
          >
            #{tag}
          </button>
        ) : (
          <div key={`${tag}-${index}`} className={getTagClass()} title={tag}>
            #{tag}
          </div>
        ),
      )}
    </div>
  );
}
