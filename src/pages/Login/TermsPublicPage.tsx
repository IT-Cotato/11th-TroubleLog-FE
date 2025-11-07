import HeaderLogoOnly from "@/layouts/Header/HeaderLogoOnly";
import { useState } from "react";

type Tab = "terms" | "privacy";

export default function TermsPublicPage() {
  const [tab, setTab] = useState<Tab>("terms");

  return (
    <div className="min-h-screen bg-white">
      <HeaderLogoOnly />
      {/* 상단 여백/헤더 자리 */}
      <div className="h-12" />

      <main className="mx-auto max-w-screen-xl px-4 sm:px-8">
        {/* 탭 */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setTab("terms")}
            className={`px-5 sm:px-6 py-2.5 rounded-full text-sm sm:text-base transition
              ${
                tab === "terms"
                  ? "bg-primary text-white"
                  : "bg-subColor1 text-white"
              }`}
          >
            이용약관
          </button>
          <button
            onClick={() => setTab("privacy")}
            className={`px-5 sm:px-6 py-2.5 rounded-full text-sm sm:text-base transition
              ${
                tab === "privacy"
                  ? "bg-primary text-white"
                  : "bg-subColor1 text-white"
              }`}
          >
            개인정보 처리방침
          </button>
        </div>

        {/* 카드 */}
        <section className="mt-8 rounded-[20px] border border-black/5 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="p-5 sm:p-8">
            {/* 스크롤 영역 */}
            <div className="max-h-[65vh] overflow-auto pr-1 sm:pr-2 leading-relaxed text-[13px] sm:text-[15px] text-black/90">
              {tab === "terms" ? <TermsBody /> : <PrivacyBody />}
            </div>
          </div>
        </section>
      </main>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}

function TermsBody() {
  return (
    <div className="space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">제1조 목적</h2>
      <p>
        본 약관은 TroubleLog(이하 “서비스”)가 제공하는 회원가입 및 서비스 이용과
        관련하여, 서비스와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로
        합니다.
      </p>

      <h2 className="text-base sm:text-lg font-semibold">제2조 용어의 정의</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>회원: 서비스에 개인정보를 제공하여 회원가입을 완료한 자</li>
        <li>닉네임: 회원 식별 및 서비스 이용을 위해 설정하는 이름</li>
        <li>
          선택 정보: 관심 분야, 한 줄 소개 등 본인 소개를 위해 입력하는 선택적
          정보
        </li>
        <li>계정: 가입 및 서비스 이용을 위한 회원 식별 정보의 집합</li>
        <li>이메일: 공지/알림 등 고지사항 전달을 위한 기본 수단</li>
      </ol>

      <h2 className="text-base sm:text-lg font-semibold">
        제3조 약관의 효력 및 변경
      </h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>본 약관은 회원가입 시 동의 절차를 거쳐 효력이 발생합니다.</li>
        <li>
          회사는 합리적인 사유가 발생할 경우 약관을 변경할 수 있으며, 변경 시
          공지합니다.
        </li>
      </ol>

      <h2 className="text-base sm:text-lg font-semibold">
        제4조 회원가입 및 계정 관리
      </h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>회원은 이메일과 비밀번호를 입력하여 가입할 수 있습니다.</li>
        <li>
          닉네임, 관심 분야, 한 줄 소개, 공개 여부 등은 선택 입력사항입니다.
        </li>
        <li>
          회원은 본인 계정을 선량한 관리자의 주의로 관리해야 하며, 타인에게
          양도·대여할 수 없습니다.
        </li>
      </ol>

      <h2 className="text-base sm:text-lg font-semibold">제5조 서비스 제공</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          회원은 트러블슈팅 지식 공유 및 문서화 기능을 이용할 수 있습니다.
        </li>
        <li>
          운영상·기술적 사유로 서비스가 일시 중단될 수 있으며, 사전 고지를
          원칙으로 합니다.
        </li>
      </ol>

      <h2 className="text-base sm:text-lg font-semibold">제6조 회원의 의무</h2>
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          회원은 허위 정보를 기재하거나 타인의 정보를 도용해서는 안 됩니다.
        </li>
        <li>
          서비스 내에서 타인의 지적재산권, 명예 등을 침해해서는 안 됩니다.
        </li>
      </ol>

      <h2 className="text-base sm:text-lg font-semibold">
        제7조 서비스 이용 제한
      </h2>
      <p>
        회원이 본 약관을 위반할 경우, 회사는 사전 통보 후 계정 이용을 제한하거나
        삭제할 수 있습니다.
      </p>

      <h2 className="text-base sm:text-lg font-semibold">제8조 책임의 한계</h2>
      <p>
        서비스는 회원 간 발생하는 트러블슈팅 지식 공유 내용에 대해 보증하지
        않습니다.
      </p>

      <h2 className="text-base sm:text-lg font-semibold">제9조 준거법</h2>
      <p>본 약관은 대한민국 법률을 기준으로 해석합니다.</p>
    </div>
  );
}

function PrivacyBody() {
  return (
    <div className="space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">
        TroubleLog 개인정보처리방침
      </h2>

      <h3 className="text-sm sm:text-base font-semibold">
        1. 수집하는 개인정보 항목
      </h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>필수: 이메일, 비밀번호</li>
        <li>선택: 닉네임, 관심 분야, 한 줄 소개, 깃허브 주소</li>
      </ul>

      <h3 className="text-sm sm:text-base font-semibold">
        2. 수집 및 이용 목적
      </h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>이메일 공지 및 공지사항 전달</li>
        <li>비밀번호: 회원 로그인 및 보안</li>
        <li>프로필/커뮤니티 기능 제공</li>
      </ul>

      <h3 className="text-sm sm:text-base font-semibold">3. 보관 및 파기</h3>
      <p>
        회원 탈퇴 시 즉시 모든 개인정보를 파기합니다. 다만, 관련 법령에 따라
        보관 의무가 있는 경우 해당 기간 동안 보관합니다.
      </p>

      <h3 className="text-sm sm:text-base font-semibold">4. 제3자 제공</h3>
      <p>원칙적으로 외부에 제공하지 않습니다.</p>

      <h3 className="text-sm sm:text-base font-semibold">
        5. 안전성 확보 조치
      </h3>
      <p>암호화 및 보안 기술을 적용하여 회원 정보를 보호합니다.</p>

      <h3 className="text-sm sm:text-base font-semibold">6. 문의처</h3>
      <p>개인정보 관련 문의: troublog.official@gmail.com</p>
    </div>
  );
}
