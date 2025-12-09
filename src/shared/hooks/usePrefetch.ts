import { useCallback, useRef } from "react";
import getAPIResponseData from "@/utils/getAPIResponseData";
import type { UserInfoData } from "@/models/user.model";
import type { CommunityPostDetailServer } from "@/types/community.model";
import type { ProjectDetail } from "@/types/project.model";

/**
 * 링크 hover 시 데이터 프리페칭을 위한 훅
 * 경로를 분석하여 해당 페이지에 필요한 데이터를 미리 가져옵니다.
 *
 * @example
 * const prefetch = usePrefetch();
 * <Link
 *   to="/user/mypage/123"
 *   onMouseEnter={() => prefetch('/user/mypage/123')}
 * >
 */
export function usePrefetch() {
  const prefetchCache = useRef<Set<string>>(new Set());

  const prefetch = useCallback((path: string) => {
    // 이미 프리페칭한 경로는 스킵
    if (prefetchCache.current.has(path)) {
      return;
    }

    prefetchCache.current.add(path);

    // 경로 분석 및 프리페치 실행
    try {
      // 마이페이지: /user/mypage/:id
      const mypageMatch = path.match(/^\/user\/mypage\/(\d+)$/);
      if (mypageMatch) {
        const userId = Number(mypageMatch[1]);
        if (Number.isFinite(userId)) {
          // 사용자 정보 프리페치 (에러 시 리다이렉트 방지)
          getAPIResponseData<UserInfoData>({
            url: `/user/${userId}`,
            method: "GET",
            __skipGlobalAuthGuard: true, // 프리페치는 선택적이므로 에러 시 리다이렉트 방지
          }).catch(() => {
            // 실패해도 조용히 무시 (프리페치는 선택적)
          });
          return;
        }
      }

      // 커뮤니티 포스트 상세: /user/community/:postId
      const communityMatch = path.match(/^\/user\/community\/(\d+)$/);
      if (communityMatch) {
        const postId = Number(communityMatch[1]);
        if (Number.isFinite(postId)) {
          // 커뮤니티 포스트 상세 프리페치 (에러 시 리다이렉트 방지)
          getAPIResponseData<CommunityPostDetailServer | null>({
            url: `/community/${postId}`,
            method: "GET",
            __skipGlobalAuthGuard: true, // 프리페치는 선택적이므로 에러 시 리다이렉트 방지
          }).catch(() => {
            // 실패해도 조용히 무시
          });
          return;
        }
      }

      // 프로젝트 상세: /user/project/:id
      const projectMatch = path.match(/^\/user\/project\/(\d+)$/);
      if (projectMatch) {
        const projectId = Number(projectMatch[1]);
        if (Number.isFinite(projectId)) {
          // 프로젝트 상세 프리페치 (에러 시 리다이렉트 방지)
          getAPIResponseData<ProjectDetail>({
            url: `/projects/${projectId}`,
            method: "GET",
            __skipGlobalAuthGuard: true, // 프리페치는 선택적이므로 에러 시 리다이렉트 방지
          }).catch(() => {
            // 실패해도 조용히 무시
          });
          return;
        }
      }
    } catch (error) {
      // 프리페치 실패는 조용히 무시 (선택적 기능)
      console.debug("Prefetch failed for path:", path, error);
    }
  }, []);

  return prefetch;
}
