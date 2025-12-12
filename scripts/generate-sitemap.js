/**
 * Sitemap 동적 생성 스크립트
 *
 * 사용 방법:
 * 1. 환경 변수 설정: BASE_URL, API_BASE_URL
 * 2. 실행: node scripts/generate-sitemap.js
 * 3. 생성된 sitemap.xml이 public/sitemap.xml에 저장됩니다.
 *
 * 빌드 시 자동 실행하려면 package.json의 build 스크립트에 추가:
 * "build": "node scripts/generate-sitemap.js && tsc -b && vite build"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 설정
const BASE_URL = process.env.VITE_BASE_URL || "https://troublog.com";
const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://troublog.shop";

// 날짜 포맷팅 (YYYY-MM-DD)
function formatDate(date = new Date()) {
  return date.toISOString().split("T")[0];
}

// XML 이스케이프
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// URL 엔트리 생성
function createUrlEntry(
  loc,
  lastmod = null,
  changefreq = "weekly",
  priority = "0.8"
) {
  const lastmodDate = lastmod || formatDate();
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// API 호출 헬퍼
async function fetchWithRetry(url, retries = 3, timeoutMs = 10_000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(t);
      if (response.ok) {
        return await response.json();
      }
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

// 모든 페이지 가져오기
async function fetchAllPages(fetcher, maxPages = 10) {
  const allItems = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= maxPages) {
    try {
      const data = await fetcher(page);
      if (data && data.content && Array.isArray(data.content)) {
        allItems.push(...data.content);
        hasNext =
          data.hasNext || (data.isLast !== undefined ? !data.isLast : false);
        page++;
      } else {
        hasNext = false;
      }
    } catch (error) {
      console.error(`페이지 ${page} 가져오기 실패:`, error.message);
      hasNext = false;
    }
  }

  return allItems;
}

// Sitemap 생성
async function generateSitemap() {
  console.log("Sitemap 생성 시작...");

  const urls = [];

  // 정적 페이지
  urls.push(createUrlEntry(`${BASE_URL}/`, null, "weekly", "1.0"));
  urls.push(createUrlEntry(`${BASE_URL}/user/community`, null, "daily", "0.9"));

  // 동적 페이지 가져오기
  try {
    // 커뮤니티 포스트 가져오기
    console.log("커뮤니티 포스트 가져오는 중...");
    const communityPosts = await fetchAllPages(async (page) => {
      const url = `${API_BASE_URL}/community/list?page=${page}&size=50&sortBy=latest`;
      return await fetchWithRetry(url);
    }, 5); // 최대 5페이지 (250개 포스트)

    communityPosts.forEach((post) => {
      // Canonical URL 우선순위: slug > postId
      // slug가 있으면 slug 기반 URL만 사용 (SEO 친화적, canonical URL)
      // slug가 없으면 postId 기반 URL 사용 (하위 호환)
      // 둘 다 있으면 slug만 사용하여 중복 방지
      if (post.slug) {
        // 슬러그 기반 URL (canonical, SEO 친화적)
        urls.push(
          createUrlEntry(
            `${BASE_URL}/user/community/p/${post.slug}`,
            post.createdAt ? formatDate(new Date(post.createdAt)) : null,
            "weekly",
            "0.8"
          )
        );
      } else if (post.postId) {
        // slug가 없는 경우에만 ID 기반 URL 사용 (하위 호환)
        urls.push(
          createUrlEntry(
            `${BASE_URL}/user/community/${post.postId}`,
            post.createdAt ? formatDate(new Date(post.createdAt)) : null,
            "weekly",
            "0.8"
          )
        );
      }
    });

    // 프로젝트 가져오기
    console.log("프로젝트 가져오는 중...");
    const projects = await fetchAllPages(async (page) => {
      const url = `${API_BASE_URL}/projects?page=${page}&size=50`;
      return await fetchWithRetry(url);
    }, 5); // 최대 5페이지 (250개 프로젝트)

    projects.forEach((project) => {
      if (project.id) {
        urls.push(
          createUrlEntry(
            `${BASE_URL}/user/project/${project.id}`,
            project.createdAt ? formatDate(new Date(project.createdAt)) : null,
            "weekly",
            "0.7"
          )
        );
      }
    });

    // 사용자 마이페이지 (공개 프로필만)
    // 주의: 모든 사용자 마이페이지를 포함하면 sitemap이 너무 커질 수 있습니다.
    // 필요시 공개 프로필만 필터링하여 추가하세요.
    console.log("사용자 프로필 가져오는 중...");
    // 예시: API에서 공개 프로필 목록을 가져오는 엔드포인트가 있다면 사용
    // const publicUsers = await fetchAllPages(async (page) => {
    //   const url = `${API_BASE_URL}/users/public?page=${page}&size=50`;
    //   return await fetchWithRetry(url);
    // }, 3);
    //
    // publicUsers.forEach((user) => {
    //   if (user.id) {
    //     urls.push(createUrlEntry(
    //       `${BASE_URL}/user/mypage/${user.id}`,
    //       null,
    //       'monthly',
    //       '0.6'
    //     ));
    //   }
    // });
  } catch (error) {
    console.error("동적 페이지 가져오기 실패:", error.message);
    console.log("정적 페이지만 포함하여 계속 진행합니다...");
  }

  // XML 생성
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.join("\n")}
</urlset>`;

  // 파일 저장
  const outputPath = path.join(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");

  console.log(`✅ Sitemap 생성 완료: ${urls.length}개 URL 포함`);
  console.log(`📄 저장 위치: ${outputPath}`);
}

// 실행
generateSitemap().catch((error) => {
  console.error("⚠️  Sitemap 생성 실패:", error.message);
  console.log("정적 sitemap.xml을 사용하여 빌드를 계속 진행합니다...");
  // 빌드 실패를 방지하기 위해 exit(0)으로 변경
  // 대신 경고만 출력하고 빌드는 계속 진행
  process.exit(0);
});
