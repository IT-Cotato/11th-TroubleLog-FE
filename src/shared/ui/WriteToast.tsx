interface WriteToastProps {
  show: boolean;
  message: string;
  /** default: 보라 배경, success: 흰 배경(저장 완료 등) */
  variant?: "default" | "success";
}

const BASE_CLASS =
  "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] border border-purple-400 text-purple-700 px-4 py-2 rounded-md shadow-lg transition-all duration-300 ease-in-out";

export function WriteToast({
  show,
  message,
  variant = "default",
}: WriteToastProps) {
  if (!show) return null;

  const bgClass =
    variant === "success"
      ? "bg-white"
      : "bg-purple-100";

  return (
    <div className={`${BASE_CLASS} ${bgClass}`}>
      {message}
    </div>
  );
}
