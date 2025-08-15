import { useMemo } from "react";

interface TagBubbleChartProps {
  bubbleData: Array<{ label: string; count: number; color: string }>;
}

const sizeToText = (size: number) =>
  size >= 150
    ? "text-head-32-regular"
    : size >= 110
    ? "text-body-20-regular"
    : "text-body-16-regular";

// 순위별(1~5) 고정 레이아웃: 위치 + 크기
const RANK_PRESETS: Record<
  number,
  Array<{ top: string; left: string; size: number }>
> = {
  1: [{ top: "50%", left: "50%", size: 150 }],
  2: [
    { top: "50%", left: "33%", size: 150 },
    { top: "56%", left: "68%", size: 120 },
  ],
  3: [
    { top: "30%", left: "50%", size: 150 },
    { top: "78%", left: "39%", size: 110 },
    { top: "72%", left: "65%", size: 90 },
  ],
  4: [
    { top: "30%", left: "33%", size: 150 },
    { top: "35%", left: "68%", size: 115 },
    { top: "78%", left: "40%", size: 100 },
    { top: "73%", left: "63%", size: 80 },
  ],
  5: [
    { top: "30%", left: "30%", size: 150 },
    { top: "34%", left: "65%", size: 120 },
    { top: "71%", left: "50%", size: 100 },
    { top: "75%", left: "26%", size: 80 },
    { top: "70%", left: "72%", size: 70 },
  ],
};

const TagBubbleChart = ({ bubbleData }: TagBubbleChartProps) => {
  // count 기준 내림차순 → 상위 5개만 사용(순위 결정)
  const top = useMemo(() => {
    return [...bubbleData]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 5);
  }, [bubbleData]);

  // 현재 아이템 개수에 맞는 고정 레이아웃 가져오기
  const layout = RANK_PRESETS[top.length] ?? RANK_PRESETS[5];

  // 0개면 빈 상태 UI로 대체
  if (top.length === 0) {
    return (
      <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
        <span className="text-head-24-bold">내 태그 분석</span>
        <span className="text-body-18-regular mt-1">
          아직 기술 태그가 없어요.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">내 태그 분석</span>
      <span className="text-body-18-regular">
        가장 많이 사용한 태그를 분석했어요.
      </span>

      {/* 버블 영역 (순위별 고정 위치/크기 적용) */}
      <div className="relative w-full h-full mt-[24px] flex justify-center items-center">
        {top.map((item, idx) => {
          const { top: t, left: l, size } = layout[idx];
          const textClass = sizeToText(size);

          return (
            <div
              key={item.label}
              className={`absolute grid place-items-center rounded-full text-white ${textClass} text-center leading-tight px-2`}
              style={{
                width: size,
                height: size,
                backgroundColor: item.color,
                top: t,
                left: l,
                transform: "translate(-50%, -50%)",
              }}
              title={`${item.label}: ${item.count}`}
            >
              <span className="break-words">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagBubbleChart;
