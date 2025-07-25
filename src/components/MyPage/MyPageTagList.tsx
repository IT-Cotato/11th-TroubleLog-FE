interface MyPageTagListProps {
  tags: string[];
}

export default function MyPageTagList({ tags }: MyPageTagListProps) {
  return (
    <div className="flex gap-[6px] flex-wrap">
      {tags.map((tag) => (
        <div
          key={tag}
          className="flex py-[6px] px-[10px] justify-center items-center gap-[2px] rounded-[20px] bg-gray1 text-primary text-body-14-regular truncate"
          title={tag}
        >
          #{tag}
        </div>
      ))}
    </div>
  );
}
