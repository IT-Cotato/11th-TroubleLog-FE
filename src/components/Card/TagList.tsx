interface TagListProps {
  tags: string[];
}

export default function TagList({ tags }: TagListProps) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {tags.map((tag, index) => (
        <div
          key={index}
          className="py-[2px] px-[6px] bg-subColor2 rounded-2xl text-body-14-regular"
        >
          #{tag}
        </div>
      ))}
    </div>
  );
}
