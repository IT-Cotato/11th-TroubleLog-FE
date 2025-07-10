import { useState } from "react";
import PostButton from "@/components/Button/PostButton";
import Snackbar from "@/components/Feedback/Snackbar";
import TroublogCard from "@/components/Card/TroublogCard";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import ProjectFolderCard from "@/components/Project/ProjectFolderCard";
import NewFolderModal from "@/components/Modal/NewFolderModal";
import { mockCards } from "@/mocks/mockCards";
import { mockFolders } from "@/mocks/mockFolders";
import useClickOutside from "@/hooks/useClickOutside";

export default function HomePage() {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostClick = () => {
    if (mockFolders.length === 0) {
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 1000);
    } else {
      setShowDropdown((prev) => !prev); // 글쓰기 템플릿 드롭다운 토글
    }
  };

  const dropdownRef = useClickOutside(() => setShowDropdown(false));

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="flex px-[156px] pt-[79px] pb-[158px] flex-col items-start gap-[40px]">
      {/* 상단 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <div className="relative">
          {/* 폴더가 없을 경우 */}
          {showSnackbar && (
            <div className="absolute top-[-60px] right-0">
              <Snackbar message="프로젝트 폴더를 먼저 생성해주세요." />
            </div>
          )}
          <PostButton onClick={handlePostClick} />
          {/* 글쓰기 템플릿 선택 (폴더 있는 경우) */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-1/2 translate-x-[-50%] mt-[8px] w-[184px] rounded-[8px] shadow-card bg-subColor2"
            >
              <button className="flex w-full pt-[8px] pb-[9px] justify-center items-center border-0.5px border-b border-gray2 text-body-16-regular">
                가이드 템플릿
              </button>
              <button className="flex w-full pt-[8px] pb-[9px] justify-center items-center border-0.5px border-b border-gray2 text-body-16-regular">
                자유 템플릿
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Folders 영역 */}
      <ProjectAccordion
        title={
          <div className="flex">
            <span className="pr-[10px] text-head-32-regular">
              Project Folders
            </span>
            <button onClick={handleOpenModal}>
              <img
                src="/icons/plus.svg"
                alt="plus"
                className="w-[36px] h-[36px]"
              />
            </button>
          </div>
        }
      >
        {/* 폴더 존재 시 폴더 카드 목록, 없으면 텍스트 */}
        {mockFolders.length === 0 ? (
          <div className="w-full flex h-[132px] justify-center items-center self-stretch rounded-[8px] bg-white shadow-card">
            <span className="text-body-20-regular">
              아직 요약하신 폴더가 없어요.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-[24px] self-stretch">
            {mockFolders.map((folder) => (
              <ProjectFolderCard key={folder.id} {...folder} />
            ))}
          </div>
        )}
      </ProjectAccordion>

      {/* Recents 영역 */}
      <ProjectAccordion title="Recents">
        {/* 트러블슈팅 존재 시 카드 목록, 없으면 텍스트 */}
        {mockCards.length === 0 ? (
          <div className="w-full flex h-[330px] justify-center items-center rounded-[16px] bg-white shadow-card">
            <span className="text-body-20-regula">
              아직 확인한 트러블슈팅이 없어요.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-[24px] self-stretch">
            {mockCards.map((card) => (
              <TroublogCard key={card.id} {...card} />
            ))}
          </div>
        )}
      </ProjectAccordion>

      {/* 모달 표시 */}
      {isModalOpen && <NewFolderModal onClose={handleCloseModal} />}
    </div>
  );
}
