import { useEffect, useState } from "react";
import arrowForwardIcon from "@/assets/icons/arrow-forward.svg";
import { useViewerId } from "@/store/auth";

interface ProjectAccordionProps {
  title: React.ReactNode;
  headerExtra?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  persistKey?: string;
  collapsible?: boolean;
  hideHeader?: boolean;
}

export default function ProjectAccordion({
  title,
  headerExtra,
  defaultOpen = true,
  children,
  persistKey,
  collapsible = true,
  hideHeader = false,
}: ProjectAccordionProps) {
  const viewerId = useViewerId();
  // 게스트/사용자별 네임스페이스 (로그아웃 전까지 유지)
  const userScope = viewerId != null ? `u${viewerId}` : "guest";
  const storageKey =
    persistKey != null ? `accordion:${userScope}:${persistKey}` : null;

  const [isOpen, setIsOpen] = useState(collapsible ? defaultOpen : true);

  // 저장된 상태를 초기화에 반영
  useEffect(() => {
    if (!storageKey) return;
    if (!collapsible) {
      // 토글 비활성 모드에서는 항상 펼침 상태 유지
      setIsOpen(true);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw === "1") setIsOpen(true);
      else if (raw === "0") setIsOpen(false);
      else localStorage.setItem(storageKey, defaultOpen ? "1" : "0");
    } catch {
      /* no-op */
    }
    // storageKey 변경 시 해당 키의 상태를 로드
  }, [storageKey, defaultOpen]);

  const toggle = () => {
    if (!collapsible) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          /* no-op */
        }
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* 헤더 (옵션) */}
      {!hideHeader && (
        <div className="flex items-stretch gap-[8px] sm:gap-[12px] mb-[24px] sm:mb-[36px] h-9 sm:h-[36px]">
          <button
            type="button"
            onClick={toggle}
            className={`flex items-center gap-[8px] sm:gap-[12px] ${
              collapsible ? "" : "cursor-default"
            }`}
            aria-expanded={isOpen}
          >
            {collapsible && (
              <img
                src={arrowForwardIcon}
                alt=""
                aria-hidden
                className={`w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] transition-transform duration-200 ${
                  isOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            )}
            {typeof title === "string" ? (
              <span className="text-head-32-regular">{title}</span>
            ) : (
              title
            )}
          </button>
          {headerExtra ? <div>{headerExtra}</div> : null}
        </div>
      )}

      {/* 펼쳐진 내용 */}
      <div
        className={`${
          collapsible ? (isOpen ? "flex" : "hidden") : "flex"
        } flex-col gap-[36px] sm:gap-[60px]`}
      >
        {children}
      </div>
    </div>
  );
}
