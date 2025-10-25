import logo from "@/assets/icons/logo.svg";
import mailIcon from "@/assets/icons/mail.svg";
import githubIcon from "@/assets/icons/github.svg";

export default function Footer() {
  return (
    <footer className="w-full bg-[#545454] text-white py-8 flex flex-col items-center gap-3 mt-auto">
      {/* 로고 */}
      <img src={logo} alt="Troublog Logo" className="w-6 h-6" />

      {/* Contact 텍스트 */}
      <p className="text-sm mt-1">Contact Troublog</p>

      {/* 아이콘 영역 */}
      <div className="flex gap-4 mt-1">
        <a href="mailto:troublog.official@gmail.com">
          <img
            src={mailIcon}
            alt="mail"
            className="w-5 h-5 opacity-80 hover:opacity-100"
          />
        </a>
        <a
          href="https://github.com/IT-Cotato/11th-Troublog"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={githubIcon}
            alt="github"
            className="w-5 h-5 opacity-80 hover:opacity-100"
          />
        </a>
      </div>

      {/* 이메일 */}
      <p className="text-xs text-gray-300 mt-2">
        문의하기:{" "}
        <a
          href="https://forms.gle/your-google-form-link" // TODO: 실제 구글폼 링크 삽입
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-gray-100 transition-colors"
        >
          troublog.official@gmail.com
        </a>
      </p>

      {/* 구분선 */}
      <div className="w-[80%] border-t border-gray-400 mt-6 mb-3" />

      {/* 하단 영역 */}
      <div className="w-[80%] flex justify-between text-[13px] text-gray-300">
        <a href="/terms" className="hover:underline">
          트러블로그 이용약관 &gt;
        </a>
        <p>Copyright@2025.Troublog. All rights reserved.</p>
      </div>
    </footer>
  );
}
