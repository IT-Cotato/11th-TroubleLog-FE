import {
  Chart as ChartJS,
  ArcElement,
  Legend,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// 임시 데이터
const data = {
  labels: ["Build/Compile", "Dependency", "Syntax"],
  datasets: [
    {
      label: "에러 빈도수",
      data: [3, 2, 3],
      backgroundColor: ["#FFDC69", "#E4CBFE", "#9737FD"],
      borderWidth: 0,
      cutout: "55%",
    },
  ],
};

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

const ErrorCategoryPieChart = () => {
  const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);

  return (
    <div className="flex flex-col w-full p-[36px] h-[412px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">에러 종류 분석</span>
      <span className="text-body-18-regular">
        가장 많이 해결한 트러블을 분석했어요.
      </span>

      <div className="flex px-[123px] py-[39px] justify-between w-full items-center">
        {/* 파이 차트 */}
        <div className="relative w-[233px] h-[233px]">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-head-24-bold text-primary">{total}개</span>
          </div>
        </div>

        {/* 에러 종류 목록 */}
        <div className="flex flex-col w-[239px] items-start gap-[30px]">
          {data.labels.map((label, i) => (
            <div
              key={label}
              className="flex items-center gap-[16px] self-stretch"
            >
              <div
                className="w-[24px] h-[24px] rounded-full"
                style={{ backgroundColor: data.datasets[0].backgroundColor[i] }}
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
