interface UserMenuDropdownProps {
  onNavigateToMyPage: () => void;
  onClose: () => void;
}

export default function UserMenuDropdown({
  onNavigateToMyPage,
  onClose,
}: UserMenuDropdownProps) {
  return (
    <div className="min-w-[160px] py-2 bg-white border border-gray2 rounded-md shadow-md">
      <div
        className="px-4 py-2 cursor-pointer hover:bg-gray1"
        onClick={onNavigateToMyPage}
      >
        마이페이지
      </div>
      <div
        className="px-4 py-2 cursor-pointer hover:bg-gray1"
        onClick={() => {
          console.log("로그아웃 처리");
          onClose();
        }}
      >
        로그아웃
      </div>
    </div>
  );
}
