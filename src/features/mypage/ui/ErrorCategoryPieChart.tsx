import {
  Chart as ChartJS,
  ArcElement,
  Legend,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export interface ErrorCategoryPieChartProps {
  labels: string[];
  data: number[];
}

const options: ChartOptions<"doughnut"> = {
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.label}: ${ctx.raw}개`,
      },
    },
  },
  responsive: true,
  maintainAspectRatio: false,
};

const palette = ["#FFDC69", "#E4CBFE", "#9737FD", "#80E1D9", "#FFA2A2"];

const ErrorCategoryPieChart = ({
  labels,
  data,
}: ErrorCategoryPieChartProps) => {
  const n = Math.max(0, Math.min(labels.length, data.length));
  const safeLabels = labels.slice(0, n);
  const safeData = data.slice(0, n);
  const bg = palette.slice(0, n);

  const total = safeData.reduce((sum, val) => sum + val, 0);

  // 빈 상태 UI
  if (n === 0 || total === 0) {
    return (
      <div className="flex flex-col w-full p-[36px] h-[412px] rounded-[16px] bg-white shadow-card">
        <span className="text-head-24-bold">에러 종류 분석</span>
        <span className="text-body-18-regular mt-1">
          아직 통계로 볼 에러가 없어요.
        </span>
      </div>
    );
  }

  const chartData = {
    labels: safeLabels,
    datasets: [
      {
        label: "에러 빈도수",
        data: safeData,
        backgroundColor: bg,
        borderWidth: 0,
        cutout: "55%",
      },
    ],
  };

  return (
    <div className="flex flex-col w-full p-[36px] h-[412px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">에러 종류 분석</span>
      <span className="text-body-18-regular">
        가장 많이 해결한 트러블을 분석했어요.
      </span>

      <div className="flex px-[123px] py-[39px] justify-between w-full items-center">
        {/* 파이 차트 */}
        <div className="relative w-[233px] h-[233px]">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-head-24-bold text-primary">{total}개</span>
          </div>
        </div>

        {/* 에러 종류 목록 */}
        <div className="flex flex-col w-[239px] items-start gap-[30px]">
          {safeLabels.map((label, i) => (
            <div
              key={`${label}-${i}`}
              className="flex items-center gap-[16px] self-stretch"
            >
              <div
                className="w-[24px] h-[24px] rounded-full"
                style={{ backgroundColor: bg[i] }}
                aria-hidden
              />
              <span className="text-body-18-regular">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ErrorCategoryPieChart;
