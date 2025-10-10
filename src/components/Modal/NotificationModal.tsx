import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import escapeIcon from "@/assets/icons/escape.svg";
import useNotifications from "@/hooks/useNotifications";
import { toInternalSpaPath } from "@/utils/url";
import { useViewerId } from "@/store/auth";
import { PATH } from "@/shared/config/paths";

const tabs = ["전체", "트러블슈팅", "댓글", "좋아요"] as const;
type TabType = (typeof tabs)[number];

export interface NotificationItem {
  id: number;
  type: TabType;
  text: string;
  link?: string;
}

export default function NotificationModal() {
  const [selectedTab, setSelectedTab] = useState<TabType>("전체");
  const { items, loading, error, removeOne } = useNotifications(selectedTab);
  const navigate = useNavigate();

  const viewerId = useViewerId();

  // 각 알림의 실제 이동 목적지 계산
  const getDestination = (item: NotificationItem): string | null => {
    // 1) 트러블슈팅 알림이면 무조건 내 마이페이지로
    if (item.type === "트러블슈팅") {
      if (viewerId != null) return PATH.MYPAGE(String(viewerId));
      // 로그인 정보가 없다면 적절한 폴백
      return PATH.LOGIN;
    }
    // 2) 그 외엔 서버가 내려준 targetUrl을 내부 경로로만 허용
    return toInternalSpaPath(item.link);
  };

  const handleItemClick = (item: NotificationItem) => {
    const dest = getDestination(item);
    if (!dest) return;
    navigate(dest);
  };

  return (
    <div
      className="
        w-[92vw] sm:w-[520px] md:w-[560px] lg:w-[600px]
        max-w-[92vw]
        h-[262px]
        rounded-[20px] bg-white shadow-card p-0
        overflow-hidden flex flex-col
      "
    >
      {/* 카테고리 탭 (기존 gap/마진 유지, xs에서만 좌여백 살짝 축소) */}
      <div className="flex gap-[28px] mt-[24px] ml-4 sm:ml-[36px] mb-[15px]">
        {tabs.map((tab) => (
          <span
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={clsx(
              "text-head-24-bold cursor-pointer transition-colors",
              selectedTab === tab ? "text-black" : "text-[#AFB1B6]"
            )}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* 구분선 (기존 간격 유지) */}
      <div className="w-full h-[1px] bg-gray1 mb-[28px]" />

      {/* 알림 영역 (기존 여백/간격 유지) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-[38px] pb-[46px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-head-20-semibold">
            불러오는 중…
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-head-20-semibold text-red-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-head-20-semibold">
            받은 알림이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-[24px]">
            {items.map((item) => {
              const clickable = !!getDestination(item); // 링크 유무/트러블슈팅 여부 포함
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-start group"
                >
                  <div
                    onClick={() => clickable && handleItemClick(item)}
                    className={clsx(
                      "text-body-20-regular transition-all",
                      clickable &&
                        "cursor-pointer group-hover:text-primary group-hover:underline"
                    )}
                  >
                    {item.text}
                  </div>
                  <img
                    src={escapeIcon}
                    alt="delete"
                    className="w-[24px] h-[24px] cursor-pointer shrink-0"
                    onClick={() => removeOne(item.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
