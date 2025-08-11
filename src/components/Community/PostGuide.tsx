interface PostGuideProps {
  question: string;
  content: (string | { type: "image"; src: string; alt?: string })[];
}

export default function PostGuide({ question, content }: PostGuideProps) {
  return (
    <div className="flex flex-col justify-center items-start gap-[16px] self-stretch">
      {/* 질문 */}
      <div className="text-head-24-bold">{question}</div>

      {/* 내용 */}
      <div className="flex p-[32px] flex-col justify-center items-start gap-[10px] self-stretch rounded-[20px] bg-white shadow-card text-body-20-regular">
        {content.map((item, idx) =>
          typeof item === "string" ? (
            <p key={idx}>{item}</p>
          ) : (
            <img
              key={idx}
              src={item.src}
              alt={item.alt || "이미지"}
              className="w-auto max-w-full h-auto"
            />
          )
        )}
      </div>
    </div>
  );
}
