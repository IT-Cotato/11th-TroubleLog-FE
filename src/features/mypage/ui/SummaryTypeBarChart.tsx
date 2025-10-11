interface SummaryTypeBarChartProps {
  summaryData: Array<{ label: string; value: number }>;
}

const SummaryTypeBarChart = ({ summaryData }: SummaryTypeBarChartProps) => {
  const hasAny = Array.isArray(summaryData) && summaryData.length > 0;
  const maxValue = hasAny ? Math.max(...summaryData.map((d) => d.value)) : 0;
  const mostUsed = hasAny
    ? summaryData.reduce((a, b) => (a.value > b.value ? a : b))
    : null;

  // 빈 상태 UI
  if (!hasAny) {
    return (
      <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
        <span className="text-head-24-bold">내 요약본 종류</span>
        <span className="text-body-18-regular mt-1">
          아직 생성한 요약본이 없어요.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">내 요약본 종류</span>
      <span className="text-body-18-regular">
        <span className="text-primary">{mostUsed?.label}</span>을(를) 가장 많이
        사용했어요.
      </span>

      {/* 막대 그래프 */}
      <div className="flex justify-center items-end gap-[28px] mt-[36px] h-[245px]">
        {summaryData.map((item, idx) => {
          const isMax = item.value === maxValue && maxValue > 0;
          const barHeight = maxValue > 0 ? (item.value / maxValue) * 200 : 0;

          return (
            <div
              key={`${item.label}-${idx}`}
              className="flex flex-col items-center"
            >
              <div
                className={`w-[62px] ${
                  isMax ? "bg-primary" : "bg-subColor1"
                } rounded-t-[16px]`}
                style={{ height: `${barHeight}px` }}
                aria-label={`${item.label}: ${item.value}`}
              />
              <span className="text-body-16-regular mt-[9px]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummaryTypeBarChart;
