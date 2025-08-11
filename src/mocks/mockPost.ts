import type { CommunityPostDetailProps } from "@/pages/Community/CommunityPostDetail";
import postMockImage from "@/assets/images/post_mock_img.png";

export const mockPost: CommunityPostDetailProps = {
  errorType: "Network/API Error",
  title: "CORS 오류",
  tags: ["Spring Boot", "React", "API 호출"],
  date: "2025.06.23",
  isMine: true,
  authorName: "rlagyfla",
  authorFollowers: 6,
  authorBio: "한줄 소개......",
  importance: 5,
  questions: [
    "어떤 오류가 발생했나요?",
    "문제 원인 파악",
    "해결 방법 및 적용",
    "검증 및 회고",
  ],
  contents: [
    [
      "프론트엔드 개발 중 React 앱에서 백엔드 API(Spring Boot 서버)에 데이터를 요청했는데, 브라우저 콘솔에서 CORS policy: No 'Access-Control-Allow-Origin' header 오류가 발생했습니다.로컬 개발 환경에서는 정상 작동했으나, EC2에 배포한 서버에서만 해당 오류가 발생했습니다.",
    ],
    [
      "문제의 핵심은 Spring 서버의 CORS 설정이 누락되어 있었기 때문이었습니다.@CrossOrigin 어노테이션을 사용하지 않았고, WebMvcConfigurer를 통해 글로벌 CORS 설정을 하지 않은 상태였습니다.또한, EC2 서버의 보안 그룹에서는 3000번 포트 요청이 열려 있었지만, Spring 앱은 8080에서 실행 중이었고 해당 포트의 응답을 브라우저가 막고 있었습니다.",
    ],
    [
      "먼저, Spring Boot에 글로벌 CORS 설정을 적용했습니다.WebMvcConfigurer를 상속받아 addCorsMappings() 메서드를 override하고, 프론트엔드에서 접근하는 http://localhost:3000, http://mydomain.com 을 허용하도록 설정했습니다.",
      {
        type: "image",
        src: postMockImage,
        alt: "CORS 설정 코드",
      },
      "이후 배포 환경에서도 정상적으로 API 요청이 작동함을 확인했습니다.",
    ],
    [
      "약 2시간 동안 고민했고, 처음에는 프론트엔드 설정 문제로 의심했으나 서버 로그 분석 후 백엔드 문제임을 파악했습니다.해결하면서 CORS 정책의 원리와 Spring Boot에서의 대응 방식에 대해 확실히 이해할 수 있었고, 추후 프로젝트에서도 빠르게 대처할 수 있을 자신감이 생겼습니다.",
    ],
  ],
  isLiked: true,
  likeCounts: 5,
  commentCounts: 4,
  comments: [
    {
      id: "1",
      name: "rlagyfla",
      date: "25.06.14",
      content:
        "댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.",
      isMine: false,
      isReply: false,
    },
    {
      id: "2",
      name: "rlagyfla",
      date: "25.06.14",
      content: "댓글을 작성해주세요.",
      isMine: true,
      isReply: false,
    },
    {
      id: "3",
      name: "rlagyfla",
      date: "25.06.14",
      content:
        "댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.",
      isMine: false,
      isReply: true,
      parentId: "2",
    },
    {
      id: "4",
      name: "rlagyfla",
      date: "25.06.14",
      content:
        "댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.댓글을 작성해주세요.",
      isMine: false,
      isReply: false,
    },
  ],
};
