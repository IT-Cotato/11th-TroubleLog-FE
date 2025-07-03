import TroublogCard from "@/components/Card/TroublogCard";

const sampleTags = ["카카오SDK", "환경변수", "로그인"];

export default function TestCardPage() {
  return (
    <div className="flex flex-col gap-10 p-10 bg-gray-100 min-h-screen">
      <h1 className="text-head-24-bold">🔍 TroublogCard 테스트 화면</h1>

      {/* 1. 내가 작성한 inProgress 상태 */}
      <TroublogCard
        isMine={true}
        status="inProgress"
        visibility="private"
        errorCategory="API 연동"
        title="카카오 SDK 초기화 오류"
        createdAt="2025.06.30"
        tags={sampleTags}
        likeCount={0}
        commentCount={0}
        importance={2}
      />

      {/* 2. 내가 작성한 complete + 공개 */}
      <TroublogCard
        isMine={true}
        status="complete"
        visibility="public"
        errorCategory="빌드"
        title="Vite 환경에서 .env 설정 문제"
        createdAt="2025.06.29"
        tags={sampleTags}
        likeCount={3}
        commentCount={1}
        importance={4}
      />

      {/* 3. 내가 작성한 created + 비공개 */}
      <TroublogCard
        isMine={true}
        status="created"
        visibility="private"
        errorCategory="CI/CD"
        title="Github Actions 실패 로그 분석"
        createdAt="2025.06.28"
        tags={sampleTags}
        likeCount={1}
        commentCount={0}
        importance={3}
      />

      {/* 4. 다른 사람이 작성한 카드 */}
      <TroublogCard
        isMine={false}
        status="complete"
        visibility="public"
        errorCategory="디자인"
        title="폰트 적용 안되는 이슈"
        createdAt="2025.06.27"
        tags={sampleTags}
        likeCount={7}
        commentCount={5}
        authorProfileImageUrl="/sample-profile.png"
      />
    </div>
  );
}
