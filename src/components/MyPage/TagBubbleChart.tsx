const TagBubbleChart = () => {
  const bubbleData = [
    { label: "JAVA", count: 25, color: "#9C4FFF" },
    { label: "Spring", count: 18, color: "#FFDC69" },
    { label: "Spring Boot", count: 12, color: "#D5A7FF" },
    { label: "JPA", count: 6, color: "#FFEFB0" },
    { label: "MySQL", count: 4, color: "#E8C6FF" },
  ];

  const getSize = (count: number) => {
    if (count >= 20) return { size: 150, textClass: "text-head-20-semibold" };
    if (count >= 10) return { size: 110, textClass: "text-body-16-semibold" };
    return { size: 80, textClass: "text-body-14-regular" };
  };

  return (
    <div className="flex flex-col p-[36px] w-[462px] h-[412px] rounded-[16px] bg-white shadow-card">
      <span className="text-head-24-bold">내 태그 분석</span>
      <span className="text-body-18-regular">
        가장 많이 사용한 태그를 분석했어요.
      </span>

      {/* 버블 영역 */}
      <div className="relative w-full h-full mt-[24px] flex justify-center items-center">
        {bubbleData.map((item, idx) => {
          const { size, textClass } = getSize(item.count);
          const positions = [
            { top: "30%", left: "30%" },
            { top: "35%", left: "64%" },
            { top: "73%", left: "50%" },
            { top: "75%", left: "25%" },
            { top: "70%", left: "75%" },
          ];

          return (
            <div
              key={idx}
              className={`absolute flex justify-center items-center rounded-full text-white ${textClass}`}
              style={{
                width: size,
                height: size,
                backgroundColor: item.color,
                top: positions[idx].top,
                left: positions[idx].left,
                transform: "translate(-50%, -50%)",
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagBubbleChart;
