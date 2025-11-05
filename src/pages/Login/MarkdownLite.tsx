import React from "react";

type Props = {
  markdown?: string | null;
  className?: string; // 높이/스크롤 등 스타일 덮어쓰기용
  ariaLabel?: string;
};

function safeUrl(raw: string): string | null {
  try {
    // mailto, http, https만 허용
    if (raw.startsWith("mailto:")) return raw;
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

// **bold** 와 [text](url)을 동시에 처리하기 위한 인라인 파서
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  // 두 패턴 중 앞에 나타나는 것을 순서대로 소비
  const boldRe = /\*\*(.+?)\*\*/g; // non-greedy
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;

  while (rest.length) {
    // 다음 bold 혹은 link의 시작 인덱스 구하기
    boldRe.lastIndex = 0;
    linkRe.lastIndex = 0;
    const b = boldRe.exec(rest);
    const l = linkRe.exec(rest);

    const bIdx = b ? b.index : Infinity;
    const lIdx = l ? l.index : Infinity;

    if (bIdx === Infinity && lIdx === Infinity) {
      nodes.push(rest);
      break;
    }

    // 더 앞에 있는 토큰부터 처리
    if (bIdx < lIdx) {
      // bold 앞의 일반 텍스트
      if (bIdx > 0) nodes.push(rest.slice(0, bIdx));
      const full = b![0];
      const inner = b![1];
      nodes.push(<strong key={nodes.length}>{inner}</strong>);
      rest = rest.slice(bIdx + full.length);
    } else {
      if (lIdx > 0) nodes.push(rest.slice(0, lIdx));
      const full = l![0];
      const textInside = l![1];
      const urlInside = l![2].trim();
      const href = safeUrl(urlInside);
      if (href) {
        const isHttp = href.startsWith("http");
        nodes.push(
          <a
            key={nodes.length}
            href={href}
            {...(isHttp
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="underline text-blue-600 hover:text-blue-700"
          >
            {textInside}
          </a>
        );
      } else {
        // 허용되지 않는 프로토콜은 평문으로 표시
        nodes.push(textInside);
      }
      rest = rest.slice(lIdx + full.length);
    }
  }
  return nodes;
}

// 블록 라인 파서: "# ", "## " 헤딩만 처리. 나머지는 문단으로 렌더
function renderLine(line: string, key: number): React.ReactNode {
  if (line.startsWith("## ")) {
    return (
      <h3 key={key} className="text-xl font-bold font-pretendard my-1">
        {parseInline(line.slice(3))}
      </h3>
    );
  }
  if (line.startsWith("# ")) {
    return (
      <h2 key={key} className="text-2xl font-bold font-pretendard my-2">
        {parseInline(line.slice(2))}
      </h2>
    );
  }
  if (line.startsWith("#")) {
    return (
      <h2 key={key} className="text-2xl font-bold font-pretendard my-2">
        {parseInline(line.slice(1))}
      </h2>
    );
  }

  // 일반 문단: 공백 줄은 줄바꿈 유지
  if (line.trim().length === 0) {
    return <div key={key} className="h-3" aria-hidden="true" />;
  }
  return (
    <p key={key} className="text-sm leading-6 text-gray-800">
      {parseInline(line)}
    </p>
  );
}

export default function MarkdownLite({
  markdown,
  className,
  ariaLabel,
}: Props) {
  const content = (markdown ?? "").replace(/\r\n/g, "\n");
  const lines = content.split("\n");

  // 비어있으면 안내 문구
  if (!content.trim()) {
    return (
      <div
        className={`w-full max-w-[560px] rounded-lg border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-500 ${
          className || ""
        }`}
      >
        내용을 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-[560px] rounded-lg border border-gray-300 bg-white p-4 overflow-y-auto ${
        className || ""
      }`}
      aria-label={ariaLabel}
    >
      {lines.map((ln, i) => renderLine(ln, i))}
    </div>
  );
}
