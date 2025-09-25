<div align="center">

# <img src="src/assets/icons/logo.svg" width="32" height="32" alt="Troublog Icon"/> Troublog FE

<!--배지-->
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

<!--프로젝트 버튼-->
[![배포 링크][deploy-shield]][deploy-url]
[![API 문서][api-docs-shield]][api-docs-url]
[![이슈 신고][report-bug-shield]][report-bug-url]
[![기능 요청][request-feature-shield]][request-feature-url]

### ✨ 개발자의 트러블슈팅이 성장으로 이어지는 곳 ✨

</div>

<!--프로젝트 대문 이미지-->

![Troublog Banner](https://github.com/user-attachments/assets/83cd43ea-431d-4043-b84d-399479ab9603)

## 📋 목차

### 🔍 프로젝트 소개
- [📖 프로젝트 개요](#-프로젝트-개요)  
  - [✨ 주요 기능](#-주요-기능)  
  - [🖥️ 서비스 화면](#️-서비스-화면)  

### 🛠️ 기술 정보
- [⚙️ 기술 스택 & 아키텍처](#️-기술-스택--아키텍처)  
  - [📦 기술 스택](#-기술-스택)  
  - [🏗️ 시스템 아키텍처](#️-시스템-아키텍처)  

### 🚀 시작하기
- [⭐ 설치 및 실행](#-설치-및-실행)  
  - [📋 필수 환경](#-필수-환경)  
  - [💾 설치 과정](#-설치-과정)  
  - [🔧 환경 설정](#-환경-설정)  
  - [▶️ 개발 서버 실행](#️-개발-서버-실행) 
  - [📦 빌드 & 배포](#-빌드--배포)  

### 💡 기능 구현
- [🔐 인증 & 회원가입](#-인증--회원가입)  
- [📝 트러블슈팅 문서 관리](#-트러블슈팅-문서-관리)  
- [👥 커뮤니티](#-커뮤니티)  
- [🔔 알림 SSE 기반](#-알림-sse-기반)  
- [📊 마이페이지 & 통계](#-마이페이지--통계)  

### 🔧 문제 해결 & 정보
- [❗ 자주 발생하는 문제](#-자주-발생하는-문제)  
- [📝 커밋 컨벤션](#-커밋-컨벤션)  

### 👥 팀원
- [Team Members](#-team-members)  

### 📄 라이선스
- [라이선스](#-라이선스)  

# 📖 프로젝트 개요

> [!IMPORTANT]  
> **Troublog**는 개발자의 트러블슈팅이 성장으로 이어지는 곳입니다.

프로젝트를 진행하면서 마주치는 버그나 에러들, 너무나 소중한 경험이죠. 하지만 대부분 해결하고 나면 그냥 넘어가 버리는 경우가 많습니다.
개발자들이 프로젝트 진행 중 발생하는 문제와 해결 과정을 체계적으로 기록하고 관리할 수 있는 플랫폼이 있다면 어떨까요? 이런 경험들을 이력서나 포트폴리오에도 활용할 수 있고, 트러블슈팅 경험을 통해 성장할 수
있겠죠.
그리고 유사한 문제가 발생했을 때 빠르게 대처할 수 있는 환경을 제공하는 서비스라면 정말 유용할 것 같습니다. 나의 문제 해결 경험이 누군가에게는 소중한 도움이 될 수 있으니까요.

## ✨ 주요 기능

- 🐛 **트러블슈팅 포스트 작성**: 문제 상황부터 해결까지의 과정을 단계별로 기록
- 🏷️ **태그 시스템**: 기술 스택별, 문제 유형별 분류로 원하는 글을 빠르게 검색
- ⭐ **평가 기능**: 다른 개발자들이 해결책의 유용성을 별점으로 평가
- 👥 **팔로우 시스템**: 관심있는 개발자의 트러블슈팅 경험을 지속적으로 확인
- 📊 **프로젝트별 관리**: 진행중인 프로젝트에서 발생한 문제들을 모아서 관리
- ❤️ **좋아요 & 댓글**: 도움이 된 글에 반응하고 추가 정보나 의견 공유
- 🖼️ **이미지 업로드**: 에러 스크린샷이나 코드 이미지를 첨부해서 문제 상황을 명확히 전달
- 📈 **개인 통계**: 내가 해결한 문제 유형과 주로 사용하는 기술 스택 분석

## 🖥️ 서비스 화면

<div align="center">

|                                가이드라인 기반 관리                                 |                                  AI 템플릿 요약                                  |
|:--------------------------------------------------------------------------:|:---------------------------------------------------------------------------:|
| <img src="https://github.com/user-attachments/assets/ea00bad9-7417-4a9e-b358-0f3611db659d" width="450" alt="AI 요약"/> | <img src="https://github.com/user-attachments/assets/0ba5092b-bd75-4e78-891b-ba0689088d81" width="450" alt="템플릿 요야"/> |
|                             가이드라인에 따른 트러블슈팅 관리                             |                               AI를 이용한 템플릿 요약                                |

</div>

<div align="center">

|                                프로젝트별 트러블슈팅 관리                                 |                                  커뮤니티 기능                                  |                                  트러블슈팅 분석                                  |
|:-----------------------------------------------------------------------------:|:-------------------------------------------------------------------------:|:--------------------------------------------------------------------------:|
| <img src="https://github.com/user-attachments/assets/20071fda-5857-46d1-b982-227ce768a7d7" width="300" alt="프로젝트별 관리"/> | <img src="https://github.com/user-attachments/assets/7112a536-0f54-4173-9370-5d02b4fb74f2" width="300" alt="커뮤니티"/> | <img src="https://github.com/user-attachments/assets/23b69471-7c90-4d12-9104-09ee6804023c" width="300" alt="통계 분석"/> |
|                              프로젝트별 트러블슈팅 관리 및 보관                              |                             개발자 간 소통 및 지식 공유                              |                               트러블슈팅 분석 및 통계                                |

</div>

# ⚙️ 기술 스택 & 아키텍처

## 📦 기술 스택

> [!TIP]
> 빠른 개발 속도와 유연한 확장성을 위해 최신 프론트엔드 생태계를 적극적으로 도입했습니다.

### Frontend Framework

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### State & Data Management

![Zustand](https://img.shields.io/badge/zustand-602c3c?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAA8FBMVEVHcExXQzpKQDlFV16lpqyGh4tPPTdWT0weHRU7LRZGQzmxYjlaTkZsbmywVyxtXDSFhISXm6WWpcaytb6bm56gprY0LiiXmp2prLamsMa0XS42MSxkTUVDSkuyYzGihXdDV2GprbmedVxaRD1kTUWUdGFGOCN4a2OfpbI0SFFAMSddTkbCc0dWQiGFRypXQyJUQCBcTTWviDVXQyJcUDjlqCWxjkG+hBTiohtURD6lr8lORTtDVVZmPyxwSipaRSJDOzaWpsyYqMyYqM2dq8tPOjBERTs6QUKTcCeKaCJvViZdSDK4iSngoiDvqx7KkRuGEi1hAAAAOXRSTlMApZ78cB8hCAMQO/j/FOH4KlT1wFfJTjaY6SxtVexFn3Tn2sN6d671mVuJ+/PPN9CT6TfpS4C9jJaVLRihAAAAi0lEQVQIHXXBxRKCUAAF0Es/QMDubsVuGrv1///GBQ4bx3PwgwC8gFCRohs8QrQV0ZtKOZ9JcgBmU8MwqFa9kjNTUWB58f2jPOjU9juTBTbPq+vIar972MZjwPr1uDvqCFw2wQpQVm/t7Oo9gAgAFtrtZNtMFQFp7nkWU5IQECfjYbuQFvBFRJHgjw9L0A80UmaGpAAAAABJRU5ErkJggg==)
![Axios](https://img.shields.io/badge/Axios-5A29E4.svg?&style=for-the-badge&logo=Axios&logoColor=white)

### Infrastructure & Deployment

![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)
![MSW](https://img.shields.io/badge/msw-FF6A33.svg?style=for-the-badge&logo=mockserviceworker&logoColor=white)

### Development Tools

![Chart.js](https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white)

## 🏗️ 시스템 아키텍처

<div align="center">
  <img src="https://github.com/user-attachments/assets/61c262c5-93fe-4181-a9f5-51d22da25224" width="700" alt="시스템 아키텍처"/>
  <br/><b>Troublog FE 시스템 아키텍처</b>
</div>

> [!NOTE]
> SPA는 Vercel에서 서빙되고, API와 SSE 요청은 Vercel을 거쳐 백엔드 서버로 전달됩니다. 이를 통해 일관된 HTTPS 환경과 안정적인 실시간 통신을 보장합니다.

---

# ⭐ 설치 및 실행

## 📋 필수 환경

> [!WARNING]
> 프로젝트 실행 전에 반드시 아래 환경을 확인해주세요.

**필수 환경:**

- **Node.js 18** - [Node.js 다운로드](https://nodejs.org/ko)
- **Git** - 버전 관리 및 소스코드 클론
- **패키지 매니저** - `yarn`(권장) / `pnpm` / `npm`

```bash
# 개발 환경 확인
node --version    # Node.js 18 이상
git --version     # Git 2.0 이상
```

## 💾 설치 과정

1. **Repository 클론**

```bash
git clone https://github.com/IT-Cotato/11th-TroubleLog-FE.git
cd 11th-TroubleLog-FE
```

2. **패키지 설치**

```bash
# yarn 사용 시
yarn install

# 또는 npm
npm install

# 또는 pnpm
pnpm install
```

## 🔧 환경 설정

> [!IMPORTANT]
> API 키와 Redirect URI 같은 민감 정보는 반드시 .env.* 파일로 분리해 관리하세요.

### 기본 `.env` 예시

```bash
# 카카오 로그인
VITE_KAKAO_JS_SDK_KEY=your-kakao-sdk-key
VITE_APP_REDIRECT_URI=http://localhost:5173/oauth
VITE_KAKAO_REST_KEY=your-kakao-rest-key

# 공통 환경 변수
VITE_BASE_PATH=/
VITE_API_MOCKING=false
VITE_API_BASE_URL=/api
VITE_ENV_TYPE=dev
```

### `.env.local`

```bash
VITE_ENV_TYPE=local
VITE_API_BASE_URL=/api
VITE_APP_REDIRECT_URI=http://localhost:5173/oauth
```

### `.env.development`

```bash
VITE_ENV_TYPE=dev
VITE_API_BASE_URL=/api
```

### `.env.production`

```bash
VITE_ENV_TYPE=prod
VITE_API_BASE_URL=/api
# VITE_APP_REDIRECT_URI=https://troublog.com/oauth
```

## ▶️ 개발 서버 실행

**개발 모드 실행**

```bash
yarn dev
# or
npm run dev
# or
pnpm dev
```

> [!NOTE]  
> 브라우저에서 `http://localhost:5173` 접속 후 확인할 수 있습니다.

## 📦 빌드 & 배포

```bash
# 프로덕션 빌드
yarn build

# 로컬 빌드 미리보기
yarn preview
```
> [!NOTE]  
> Vercel 또는 원하는 호스팅 서비스에 `dist/` 폴더를 배포하면 됩니다.

---

# 💡 기능 구현

## 🔗 API 연동 & 화면 구현

> [!IMPORTANT]  
> Troublog 프론트엔드는 React + TypeScript + Vite 기반 SPA로, 백엔드 API와 연동하여 다음 기능들을 제공합니다.

### 🔐 인증 & 회원가입

- **소셜 로그인/일반 로그인** UI 및 API 연동 (카카오, 이메일)
- **회원가입 폼 검증**: 이메일 중복 확인, 비밀번호 조건 체크, Redirect 처리
- 담당: <a href="https://github.com/suniesong"><strong>송승희</strong></a>

### 📝 트러블슈팅 문서 관리

- **문서 작성/수정/삭제** 화면 구현 (Markdown 에디터 적용)
- **문서 임시저장/AI 요약/완성본+요약본 조회** 화면 구현
- **문서 검색/필터링**: 태그 기반, 키워드 기반 검색
- **프로젝트별 문서 모아보기** 기능
- 담당: <a href="https://github.com/suniesong"><strong>송승희</strong></a>, <a href="https://github.com/siiion"><strong>전시원</strong></a>

### 👥 커뮤니티

- **게시글 목록/상세 페이지**: 좋아요, 댓글, 대댓글, 수정/삭제 기능 포함
- **커뮤니티 검색**: 키워드 기반 포스트 검색
- 담당: <a href="https://github.com/siiion"><strong>전시원</strong></a>

### 🔔 알림 (SSE 기반)

- **실시간 알림 UI**: 새로운 댓글/좋아요 이벤트를 SSE로 수신
- 읽음 처리 및 알림 삭제 기능
- 담당: <a href="https://github.com/siiion"><strong>전시원</strong></a>

### 📊 마이페이지 & 통계

- **팔로우/팔로잉한 사용자 목록**, **내 프로필 정보 조회 및 수정** 기능
- **사용자별 활동 통계** 시각화 (차트, 그래프)
- **좋아요한 글/내 활동 내역** 확인 가능
- 담당: <a href="https://github.com/ahnsui"><strong>안수이</strong></a>, <a href="https://github.com/siiion"><strong>전시원</strong></a>

---

# ❗ 자주 발생하는 문제

### 🔗 API 호출 시 CORS 에러

- **증상**: 브라우저 콘솔에 `CORS policy` 오류 발생
- **해결**:
  - 개발 환경에서는 `VITE_API_BASE_URL=/api`로 설정
  - Vercel 배포 시에는 **백엔드 CORS 허용** 또는 **Vercel 리라이트 규칙** 적용

### ⚡ React StrictMode 이중 호출

- **증상**: API 요청 또는 SSE 연결이 2번 실행됨
- **해결**: 개발 모드에서는 가드 플래그 적용, 배포 환경에서는 문제 없음

### 🗂️ SPA 라우팅 404

- **증상**: 배포 환경에서 새로고침 시 404 발생
- **해결**: Vercel `redirects` 설정으로 모든 경로를 `/index.html`로 리라이트

### 🔑 환경 변수 누락

- **증상**: 카카오 로그인/리다이렉트가 동작하지 않음
- **해결**: `.env.*` 파일에 `VITE_KAKAO_JS_SDK_KEY`, `VITE_APP_REDIRECT_URI` 등이 올바르게 설정되어 있는지 확인

# 📝 커밋 컨벤션

- ✨ `feat`: 새로운 기능 추가
- 🐛 `fix`: 버그 수정
- 📝 `docs`: 문서 업데이트
- 💄 `style`: 코드 포맷, 세미콜론 누락 등 (로직 변경 없음)
- 🔨 `refactor`: 코드 리팩토링
- ⚡ `perf`: 성능 개선
- ✅ `test`: 테스트 코드 추가/수정
- 🔧 `chore`: 빌드, 설정, 패키지 작업

---


## 👥 Team Members

<table align="center">
  <tr>
    <td align="center" width="200">
      <a href="https://github.com/siiion">
        <img src="https://avatars.githubusercontent.com/u/112245253?v=4" width="120" height="120" style="border-radius: 50%;" alt="전시원"/>
      </a>
      <br />
      <a href="https://github.com/siiion"><strong>전시원</strong></a>
      <br />
      <sub><b>🪄 Frontend Team Leader</b></sub>
      <br />
      <sub>@siiion</sub>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/suniesong">
        <img src="https://avatars.githubusercontent.com/u/181450532?v=4" width="120" height="120" style="border-radius: 50%;" alt="송승희"/>
      </a>
      <br />
      <a href="https://github.com/suniesong"><strong>송승희</strong></a>
      <br />
      <sub><b>🪄 Frontend Developer</b></sub>
      <br />
      <sub>@suniesong</sub>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/ahnsui">
        <img src="https://avatars.githubusercontent.com/u/139625508?v=4" width="120" height="120" style="border-radius: 50%;" alt="안수이"/>
      </a>
      <br />
      <a href="https://github.com/ahnsui"><strong>안수이</strong></a>
      <br />
      <sub><b>🪄 Frontend Developer</b></sub>
      <br />
      <sub>@ahnsui</sub>
    </td>
  </tr>
</table>


# 📄 라이선스

> [!NOTE]
> 이 프로젝트는 오픈소스 프로젝트로, MIT 라이선스 하에 자유롭게 사용하실 수 있습니다.
>
> **주요 권한**: 상업적 사용, 수정, 배포, 개인적 사용 가능  
> **조건**: 저작권 고지 및 라이선스 고지 포함  
> **제한**: 책임 및 보증 없음

## MIT License

```text
MIT License

Copyright (c) 2024-2025 IT-Cotato Troublog Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

<div align="center">

### ✨ **Troublog와 함께 더 나은 개발 경험을 만들어가세요!** ✨

**🚀 지금 시작해보세요** | **🤝 커뮤니티 참여** | **💡 아이디어 제안**

*Made with ❤️ by [11th-Troublog](https://github.com/orgs/IT-Cotato/teams/11th-troublog) Team*

</div>

<!--URL for Badges-->

[deploy-shield]: https://img.shields.io/badge/-troublog.kr-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white

[api-docs-shield]: https://img.shields.io/badge/-API%20문서-85EA2D?style=for-the-badge&logo=swagger&logoColor=white

[report-bug-shield]: https://img.shields.io/badge/-🐞%20버그%20신고-F5A9A9?style=for-the-badge

[request-feature-shield]: https://img.shields.io/badge/-✨%20기능%20요청-A9D0F5?style=for-the-badge

<!--URL for Links-->

[deploy-url]: https://troublog.vercel.app

[api-docs-url]: https://troublog.shop/swagger-ui/index.html#/

[report-bug-url]: https://github.com/IT-Cotato/11th-Troublog-FE/issues

[request-feature-url]: https://github.com/IT-Cotato/11th-Troublog-FE/issues
