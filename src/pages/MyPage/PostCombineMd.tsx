import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

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
    <section className="w-[600px]">
      <div className="text-head-24-bold mb-6">{question}</div>

      {/* 마크다운 + 이미지 렌더 */}
      <div
        className="prose max-w-none w-[750px] flex p-[32px] flex-col justify-center  gap-[10px] self-stretch rounded-[20px] bg-white shadow-card "
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
                style={{ width: "700px" }}
              />
            );
          }

          // 이미지
          return (
            <img
              key={i}
              src={item.src}
              alt={item.alt ?? ""}
              className="rounded-lg my-4"
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
