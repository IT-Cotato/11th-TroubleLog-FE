import ErrorCategoryPieChart from "@/components/MyPage/ErrorCategoryPieChart";
import SummaryTypeBarChart from "@/components/MyPage/SummaryTypeBarChart";
import TagBubbleChart from "@/components/MyPage/TagBubbleChart";
import TroublogActivityChart from "@/components/MyPage/TroublogActivityChart";

const StatisticsPage = () => {
  return (
    <div className="flex w-[948px] flex-col items-start gap-[56px] pb-[349px]">
      {/* 트러블로그 활동 */}
      <TroublogActivityChart />

      {/* 에러 종류 분석 */}
      <ErrorCategoryPieChart />

      <div className="flex items-center gap-[24px] self-stretch">
        {/* 내 태그 분석 */}
        <TagBubbleChart />

        {/* 내 요약본 종류 */}
        <SummaryTypeBarChart />
      </div>
    </div>
  );
};

export default StatisticsPage;
