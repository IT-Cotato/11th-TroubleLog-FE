import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type ImageItem = { type: "image"; src: string; alt?: string };
type GuideContent = string | ImageItem;

export default function PostGuideMd({
  question,
  content,
}: {
  question: string;
  content: GuideContent[];
}) {
  return (
    <section className="w-full max-w-[1200px] mx-auto">
      <div className="text-head-24-bold mb-6">{question}</div>

      <div
        className="prose max-w-none w-full flex p-6 sm:p-8 flex-col justify-center gap-3 rounded-[20px] bg-white shadow-card"
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
                className="w-full"
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
