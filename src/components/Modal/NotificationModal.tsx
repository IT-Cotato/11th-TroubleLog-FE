import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { mockNotifications } from "@/mocks/mockNotifications";

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
  const navigate = useNavigate();

  const filtered =
    selectedTab === "전체"
      ? mockNotifications
      : mockNotifications.filter((n) => n.type === selectedTab);

  return (
    <div className="w-[600px] h-[262px] rounded-[20px] bg-white shadow-card p-0 overflow-hidden flex flex-col">
      {/* 카테고리 탭 */}
      <div className="flex gap-[28px] mt-[24px] ml-[36px] mb-[15px]">
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

      {/* 구분선 */}
      <div className="w-full h-[1px] bg-gray1 mb-[28px]" />

      {/* 알림 영역 */}
      <div className="flex-1 overflow-y-auto px-[38px] pb-[46px]">
        {filtered.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-head-20-semibold">
            받은 알림이 없어요.
          </div>
        ) : (
          <div className="flex flex-col gap-[24px]">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-start group"
              >
                <div
                  onClick={() => item.link && navigate(item.link)}
                  className={clsx(
                    "text-body-20-regular cursor-pointer transition-all",
                    item.link &&
                      "group-hover:text-primary group-hover:underline"
                  )}
                >
                  {item.text}
                </div>
                <img
                  src="/icons/escape.svg"
                  alt="delete"
                  className="w-[24px] h-[24px] cursor-pointer shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
