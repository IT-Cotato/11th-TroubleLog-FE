import type { ErrorCategoryPieChartProps } from "@/components/MyPage/ErrorCategoryPieChart";

export const mockErrorCategoryData: ErrorCategoryPieChartProps = {
  labels: ["Build/Compile", "Dependency", "Syntax"],
  data: [3, 2, 3],
};

export const mockSummaryTypeData = [
  { label: "자소서", value: 30 },
  { label: "면접대비", value: 80 },
  { label: "블로그", value: 60 },
  { label: "이슈관리", value: 20 },
];
