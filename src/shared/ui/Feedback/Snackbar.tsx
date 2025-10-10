interface SnackbarProps {
  message: string;
}

export default function Snackbar({ message }: SnackbarProps) {
  return (
    <div className="z-10 flex px-[16px] pt-[14px] pb-[15px] justify-center items-center rounded-[8px] bg-white shadow-card">
      <span className="text-[#DC4745] text-head-20-semibold whitespace-nowrap">
        {message}
      </span>
    </div>
  );
}
