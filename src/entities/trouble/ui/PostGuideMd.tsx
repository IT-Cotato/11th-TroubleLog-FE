import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

export default function PostGuideMd({
  question,
  content,
  widthClass = "w-full sm:w-[600px] md:w-[720px] lg:w-[900px] ",
  proseSize = "lg",
}: {
  question: string;
  content: GuideContent[];
  widthClass?: string;
  proseSize?: "base" | "lg" | "xl";
}) {
  const proseScale =
    proseSize === "xl" ? "prose-xl" : proseSize === "lg" ? "prose-lg" : "prose";

  return (
    <section className={widthClass}>
      <div className="text-head-24-bold mb-6 break-words">{question}</div>

      {/* 마크다운 + 이미지 컨테이너 */}
      <div
        className={[
          "prose",
          proseScale,
          "max-w-none w-full",
          widthClass,
          "flex flex-col gap-2 sm:gap-3 rounded-[20px] bg-white shadow-card p-4 sm:p-6 md:p-8",

          "prose-headings:break-words prose-p:break-words prose-li:break-words",
          "prose-pre:overflow-x-auto prose-pre:text-sm md:prose-pre:text-base",
          "prose-code:whitespace-pre-wrap",
          "prose-img:rounded-lg prose-img:my-4 prose-img:max-w-full prose-img:h-auto",
          "prose-table:overflow-x-auto",

          "prose-p:leading-relaxed md:prose-p:leading-loose",
          "prose-li:leading-relaxed md:prose-li:leading-loose",
        ].join(" ")}
        data-color-mode="light"
      >
        {content.map((item, i) => {
          if (typeof item === "string") {
            return (
              <div key={i} className="w-full">
                <MDEditor.Markdown
                  source={item}
                  data-color-mode="light"
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                />
              </div>
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
