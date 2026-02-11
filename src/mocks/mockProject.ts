import type { ProjectData, ProjectListItem } from "@/models/project.model";

/// 프로젝트 생성

export const mockProject: ProjectData = {
  id: 1,
  name: "Troublog",
  description: "개발자들을 위한 트러블슈팅 공유 서비스",
  thumbnailImageUrl: "https://image.url/project-thumbnail.png",
};

/// 전체 프로젝트 목록 조회

const initialProjectList: ProjectListItem[] = [
  {
    id: 1,
    name: "Troublog",
    description: "트러블슈팅 공유 플랫폼",
    thumbnailImageUrl: "https://image.url/thumbnail1.png",
    tags: ["Spring", "AWS"],
  },
  {
    id: 2,
    name: "TechBoard",
    description: "기술 블로그 플랫폼",
    thumbnailImageUrl: "https://image.url/thumbnail2.png",
    tags: ["Next.js", "Typescript"],
  },
];

export let mockProjectList: ProjectListItem[] = [...initialProjectList];

export const resetMockProjectList = () => {
  mockProjectList = [...initialProjectList];
};
