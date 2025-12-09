import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { LazyImage } from "@/shared/utils/imageOptimization";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

export default function PostCombineMd({
  question,
  content,
}: {
  question: string;
  content: GuideContent[];
}) {
  return (
    <section className="w-full">
      <div className="text-head-24-bold mb-4 sm:mb-6 break-words">
        {question}
      </div>

      {/* 마크다운 + 이미지 렌더 */}
      <div
        className="prose max-w-none w-full flex flex-col gap-[10px] p-4 sm:p-[32px] rounded-[20px] bg-white shadow-card"
        data-color-mode="light"
      >
        {content.map((item, i) => {
          if (typeof item === "string") {
            return (
              <MDEditor.Markdown
                key={i}
                source={item}
                data-color-mode="light"
                className="!bg-white !text-black wmde-markdown-light"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              />
            );
          }

          return (
            <LazyImage
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
