import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

export default function PostGuideMd({
  question,
  content,
  widthClass = "w-full sm:w-[600px] md:w-[720px] lg:w-[920px] xl:w-[1200px]",
  proseSize = "lg", // 기본은 살짝 키운 크기
}: {
  question: string;
  content: GuideContent[];
  widthClass?: string;
  proseSize?: "base" | "lg" | "xl";
}) {
  const proseScale =
    proseSize === "xl" ? "prose-xl" : proseSize === "lg" ? "prose-lg" : "prose";

  return (
    <section className={`${widthClass}`}>
      <div className="text-head-24-bold mb-6 break-words">{question}</div>

      {/* 마크다운 + 이미지 컨테이너: 내부는 항상 부모 고정 폭을 꽉 채움 */}
      <div
        className={[
          "prose",
          proseScale,
          "max-w-none",
          widthClass,
          "flex flex-col gap-[10px] rounded-[20px] bg-white shadow-card p-[32px]",
          "prose-p:leading-relaxed md:prose-p:leading-loose",
          "prose-li:leading-relaxed md:prose-li:leading-loose",
          "prose-pre:text-sm md:prose-pre:text-base",
        ].join(" ")}
        data-color-mode="light"
      >
        {content.map((item, i) => {
          if (typeof item === "string") {
            return (
              <MDEditor.Markdown
                key={i}
                source={item}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              />
            );
          }

          return (
            <img
              key={i}
              src={item.src}
              alt={item.alt ?? ""}
              className="rounded-lg my-4 max-w-full h-auto"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = "/icons/image.svg";
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
