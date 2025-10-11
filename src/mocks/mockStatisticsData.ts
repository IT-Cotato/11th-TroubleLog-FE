import type { ErrorCategoryPieChartProps } from "@/features/mypage/ui/ErrorCategoryPieChart";

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

export const mockTagBubbleData = [
  { label: "JAVA", count: 25, color: "#9C4FFF" },
  { label: "Spring", count: 18, color: "#FFDC69" },
  { label: "Spring Boot", count: 12, color: "#D5A7FF" },
  { label: "JPA", count: 6, color: "#FFEFB0" },
  { label: "MySQL", count: 4, color: "#E8C6FF" },
];
