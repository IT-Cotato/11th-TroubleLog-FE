interface TagListProps {
  tags: string[];
}

export default function TagList({ tags }: TagListProps) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="py-[1px] px-[4px] sm:py-[2px] sm:px-[6px] bg-subColor2 rounded-2xl text-body-14-regular max-w-[120px] truncate"
          title={tag}
        >
          #{tag}
        </div>
      ))}
    </div>
  );
}
