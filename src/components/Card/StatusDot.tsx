interface StatusDotProps {
  status: "inProgress" | "complete" | "created";
}

export default function StatusDot({ status }: StatusDotProps) {
  const colorClass = {
    inProgress: "bg-status-inProgress",
    created: "bg-status-created",
    complete: "bg-status-complete",
  }[status];

  return (
    <div
      className={`w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] shrink-0 rounded-full ${colorClass}`}
    />
  );
}
