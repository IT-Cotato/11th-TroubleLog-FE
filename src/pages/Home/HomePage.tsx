import PostButton from "@/components/Button/PostButton";
import TroublogCard from "@/components/Card/TroublogCard";
import ProjectAccordion from "@/components/Project/ProjectAccordion";
import ProjectFolderCard from "@/components/Project/ProjectFolderCard";
import { mockCards } from "@/mocks/mockCards";
import { mockFolders } from "@/mocks/mockFolders";

export default function HomePage() {
  return (
    <div className="flex px-[156px] pt-[79px] pb-[158px] flex-col items-start gap-[40px]">
      {/* 상단 영역 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <span className="text-head-32-regular">나의 프로젝트</span>
        <PostButton />
      </div>

      {/* Project Folders 영역 */}
      <ProjectAccordion title="Project Folders">
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
    </div>
  );
}
