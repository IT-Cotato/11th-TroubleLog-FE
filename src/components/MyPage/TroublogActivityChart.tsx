import {
  eachDayOfInterval,
  endOfYear,
  format,
  startOfYear,
  differenceInCalendarWeeks,
  getDay,
} from "date-fns";

const generateMockActivityData = () => {
  const today = new Date();
  const start = startOfYear(today);
  const end = endOfYear(today);
  const allDays = eachDayOfInterval({ start, end });

  const activityMap: Record<string, number> = {};

  allDays.forEach((date) => {
    const key = format(date, "yyyy-MM-dd");
    activityMap[key] = Math.random() < 0.7 ? Math.floor(Math.random() * 4) : 0;
  });

  return activityMap;
};

const activityData = generateMockActivityData();

const getColorClass = (count: number) => {
  if (count === 0) return "bg-[#E0E0E0]";
  if (count === 1) return "bg-subColor1";
  if (count === 2) return "bg-[#C187FF]";
  return "bg-primary";
};

// 각 날짜를 week 단위 컬럼별로 정렬 (세로: 요일, 가로: 주차)
const groupByWeek = (days: Date[]) => {
  const columns: Date[][] = [];

  days.forEach((date) => {
    const weekIndex = differenceInCalendarWeeks(date, startOfYear(date));
    if (!columns[weekIndex]) {
      columns[weekIndex] = new Array(7).fill(null);
    }
    columns[weekIndex][getDay(date)] = date;
  });

  return columns;
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TroublogActivityChart = () => {
  const today = new Date();
  const start = startOfYear(today);
  const end = endOfYear(today);
  const allDays = eachDayOfInterval({ start, end });

  const columns = groupByWeek(allDays);

  const totalActivities = Object.values(activityData).reduce(
    (sum, val) => sum + val,
    0
  );

  return (
    <div className="flex flex-col p-[36px] w-full h-[328px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">트러블로그 활동</span>
      <span className="text-body-18-regular">
        트러블슈팅을 해결하고 잔디를 심어보세요!
      </span>

      {/* 잔디 */}
      <div className="flex mt-[36px] ml-[26px] w-[823px] flex-col items-start gap-[6px]">
        <div className="flex flex-col items-center self-stretch">
          {/* 월(month) */}
          <div className="flex items-center gap-[42px]">
            {months.map((month) => (
              <span key={month} className="text-body-16-regular">
                {month}
              </span>
            ))}
          </div>

          {/* 날짜별 잔디 표시 */}
          <div className="grid grid-rows-7 grid-flow-col gap-[3px] h-[108px]">
            {columns.map((week, colIdx) =>
              week.map((date, rowIdx) => {
                const isValid = date instanceof Date && !isNaN(date.getTime());
                const key = isValid ? format(date, "yyyy-MM-dd") : "";
                const count = isValid ? activityData[key] ?? 0 : 0;
                const color = isValid ? getColorClass(count) : "bg-transparent";

                return (
                  <div
                    key={`${colIdx}-${rowIdx}`}
                    className={`w-[12px] h-[12px] rounded-[2px] ${color}`}
                    title={isValid ? `${key}: ${count} activities` : ""}
                  />
                );
              })
            )}
          </div>

          {/* 활동 통계 */}
          <div className="flex justify-between items-center self-stretch mt-[8px]">
            <span className="text-body-16-regular">
              {totalActivities} activities in {format(today, "yyyy")}
            </span>

            {/* 색상 기준 */}
            <div className="flex items-center gap-[12px]">
              <span className="text-body-14-regular text-gray-600">Less</span>
              <div className="flex gap-[2px]">
                <div className="w-[12px] h-[12px] bg-[#E0E0E0] rounded-[2px]" />
                <div className="w-[12px] h-[12px] bg-subColor1 rounded-[2px]" />
                <div className="w-[12px] h-[12px] bg-[#C187FF] rounded-[2px]" />
                <div className="w-[12px] h-[12px] bg-primary rounded-[2px]" />
              </div>
              <span className="text-body-14-regular text-gray-600">More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroublogActivityChart;
