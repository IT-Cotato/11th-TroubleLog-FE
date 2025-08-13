import ErrorCategoryPieChart from "@/components/MyPage/ErrorCategoryPieChart";
import SummaryTypeBarChart from "@/components/MyPage/SummaryTypeBarChart";
import TagBubbleChart from "@/components/MyPage/TagBubbleChart";
import TroublogActivityChart from "@/components/MyPage/TroublogActivityChart";
import { useDailyActivityMap } from "@/hooks/useDailyActivityMap";
import { useErrorTagsTop3 } from "@/hooks/useErrorTagsTop3";
import { useSummaryTypes } from "@/hooks/useSummaryTypes";
import { useTechTagsTop5 } from "@/hooks/useTechTagsTop5";

const StatisticsPage = () => {
  const year = new Date().getFullYear();
  const { loading, error, activityMap } = useDailyActivityMap(year);
  const {
    loading: errLoading,
    error: errError,
    labels: errLabels,
    data: errData,
  } = useErrorTagsTop3();
  const {
    loading: sumLoading,
    error: sumError,
    summaryData,
  } = useSummaryTypes();
  const {
    loading: tagLoading,
    error: tagError,
    bubbleData,
  } = useTechTagsTop5();

  return (
    <div className="flex w-[948px] flex-col items-start gap-[56px] pb-[349px]">
      {/* 디버그 토글 (dev 전용) */}
      {import.meta.env.DEV && (
        <div className="ml-auto flex items-center gap-3">
          <button
            className="text-xs text-gray-500 underline"
            onClick={() => {
              const cur = localStorage.getItem("debug.dailyActivity");
              const next =
                cur === "replace" ? "merge" : cur === "merge" ? "" : "replace";
              if (next) localStorage.setItem("debug.dailyActivity", next);
              else localStorage.removeItem("debug.dailyActivity");
              location.reload();
            }}
            title="activity: replace → merge → off"
          >
            [dev] activity debug
          </button>

          <button
            className="text-xs text-gray-500 underline"
            onClick={() => {
              const cur = localStorage.getItem("debug.errorTags");
              const next =
                cur === "replace" ? "merge" : cur === "merge" ? "" : "replace";
              if (next) localStorage.setItem("debug.errorTags", next);
              else localStorage.removeItem("debug.errorTags");
              location.reload();
            }}
            title="errorTags: replace → merge → off"
          >
            [dev] error tags debug
          </button>

          <button
            className="text-xs text-gray-500 underline"
            onClick={() => {
              const cur = localStorage.getItem("debug.summaryTypes");
              const next =
                cur === "replace" ? "merge" : cur === "merge" ? "" : "replace";
              if (next) localStorage.setItem("debug.summaryTypes", next);
              else localStorage.removeItem("debug.summaryTypes");
              location.reload();
            }}
            title="summaryTypes: replace → merge → off"
          >
            [dev] summary types debug
          </button>

          <button
            className="text-xs text-gray-500 underline"
            onClick={() => {
              const cur = localStorage.getItem("debug.techTags");
              const next =
                cur === "replace" ? "merge" : cur === "merge" ? "" : "replace";
              if (next) localStorage.setItem("debug.techTags", next);
              else localStorage.removeItem("debug.techTags");
              location.reload();
            }}
            title="techTags: replace → merge → off"
          >
            [dev] tech tags debug
          </button>
        </div>
      )}

      {/* 트러블로그 활동 */}
      {loading ? (
        <div className="flex flex-col p-[36px] w-full h-[328px] rounded-[16px] bg-white shadow-card">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded mb-4" />
          <div className="h-[180px] w-full bg-gray-100 rounded" />
        </div>
      ) : error ? (
        <div className="flex flex-col p-[36px] w-full h-[328px] rounded-[16px] bg-white shadow-card">
          <span className="text-red-600">
            일일 활동 통계를 불러오지 못했습니다.
          </span>
          <span className="text-gray-500 text-sm mt-1">{error}</span>
        </div>
      ) : (
        <TroublogActivityChart activityData={activityMap} />
      )}

      {/* 에러 종류 분석 */}
      {errLoading ? (
        <div className="flex flex-col w-full p-[36px] h-[412px] rounded-[16px] bg-white shadow-card">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-80 bg-gray-100 rounded mb-6" />
          <div className="h-[260px] w-full bg-gray-100 rounded" />
        </div>
      ) : errError ? (
        <div className="flex flex-col w-full p-[36px] h-[412px] rounded-[16px] bg-white shadow-card">
          <span className="text-red-600">
            에러 태그 통계를 불러오지 못했습니다.
          </span>
          <span className="text-gray-500 text-sm mt-1">{errError}</span>
        </div>
      ) : (
        <ErrorCategoryPieChart labels={errLabels} data={errData} />
      )}

      <div className="flex items-center gap-[24px] self-stretch">
        {/* 내 태그 분석 */}
        {tagLoading ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-80 bg-gray-100 rounded mb-6" />
            <div className="h-[260px] w-full bg-gray-100 rounded" />
          </div>
        ) : tagError ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <span className="text-red-600">
              기술 태그 통계를 불러오지 못했습니다.
            </span>
            <span className="text-gray-500 text-sm mt-1">{tagError}</span>
          </div>
        ) : bubbleData.length === 0 ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <span className="text-head-24-bold">내 태그 분석</span>
            <span className="text-body-18-regular mt-1">
              아직 기술 태그가 없어요.
            </span>
          </div>
        ) : (
          <TagBubbleChart bubbleData={bubbleData} />
        )}

        {/* 내 요약본 종류 */}
        {sumLoading ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-80 bg-gray-100 rounded mb-6" />
            <div className="h-[260px] w-full bg-gray-100 rounded" />
          </div>
        ) : sumError ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <span className="text-red-600">
              요약본 통계를 불러오지 못했습니다.
            </span>
            <span className="text-gray-500 text-sm mt-1">{sumError}</span>
          </div>
        ) : summaryData.length === 0 ? (
          <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
            <span className="text-head-24-bold">내 요약본 종류</span>
            <span className="text-body-18-regular mt-1">
              아직 생성한 요약본이 없어요.
            </span>
          </div>
        ) : (
          <SummaryTypeBarChart summaryData={summaryData} />
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;
