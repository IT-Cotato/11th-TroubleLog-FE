interface PostTagListProps {
  tags: string[];
}

export default function PostTagList({ tags }: PostTagListProps) {
  return (
    <div className="flex gap-[16px] flex-wrap">
      {tags.map((tag) => (
        <div
          key={tag}
          className="py-[6px] px-[10px] bg-subColor2 rounded-[20px] text-body-16-regular text-primary truncate"
          title={tag}
        >
          #{tag}
        </div>
      ))}
    </div>
  );
}
