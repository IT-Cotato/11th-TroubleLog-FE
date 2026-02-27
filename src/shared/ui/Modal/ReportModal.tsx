import { useRef, useState } from "react";
import BaseModal from "./BaseModal";
import exitIcon from "@/assets/icons/exiticon.svg";
import unselectedCircle from "@/assets/icons/unselected_circle.svg";
import selectedCircle from "@/assets/icons/selected_circle.svg";
import type { ReportType } from "@/api/report.api";
import { uploadImage } from "@/api/image.api";
import { REPORT_OPTIONS } from "@/shared/constants/reportReasons";

const MAX_MB = 8;

interface ReportModalProps {
  onClose: () => void;
  /** reportType, 저작권 시 선택적 copyrightImgUrl */
  onSubmit?: (reportType: ReportType, copyrightImgUrl?: string) => void;
  /** 권리침해 신고 페이지 URL (미제공 시 링크 비활성화) */
  rightsViolationReportUrl?: string;
  loading?: boolean;
}

export default function ReportModal({
  onClose,
  onSubmit,
  rightsViolationReportUrl,
  loading = false,
}: ReportModalProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(
    REPORT_OPTIONS[0].reportType,
  );
  const [copyrightImgUrl, setCopyrightImgUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tempPreview, setTempPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCopyright = selectedReportType === "COPYRIGHT";

  const handleSubmit = () => {
    if (!selectedReportType) return;
    if (isUploading) {
      alert("이미지 업로드가 끝난 후 신고할 수 있어요.");
      return;
    }
    onSubmit?.(selectedReportType, copyrightImgUrl ?? undefined);
  };

  const handleCopyrightImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`파일 용량이 너무 커요. 최대 ${MAX_MB}MB까지 가능합니다.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (tempPreview) URL.revokeObjectURL(tempPreview);
    const localUrl = URL.createObjectURL(file);
    setTempPreview(localUrl);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const serverUrl = await uploadImage(file, (p) => setUploadProgress(p));
      setCopyrightImgUrl(serverUrl);
      if (localUrl) URL.revokeObjectURL(localUrl);
      setTempPreview(null);
    } catch (err: unknown) {
      console.error(err);
      alert(
        (err as { message?: string })?.message ?? "이미지 업로드에 실패했습니다.",
      );
      setCopyrightImgUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveCopyrightImage = () => {
    if (tempPreview) {
      URL.revokeObjectURL(tempPreview);
      setTempPreview(null);
    }
    setCopyrightImgUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <BaseModal
      onClose={onClose}
      width="w-[min(540px,92vw)]"
      className="bg-white shadow-card pt-5 sm:pt-6 pb-8 sm:pb-10 items-stretch"
    >
      {/* 헤더 */}
      <div className="w-full mb-6 border-b border-gray1 pb-5">
        <div className="flex justify-between items-center px-6 sm:px-10">
          <h2 className="text-head-24-bold text-black">신고하기</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-6 h-6 flex items-center justify-center"
          >
            <img src={exitIcon} alt="" className="w-full h-full" />
          </button>
        </div>
      </div>

      {/* 신고 사유 라디오 그룹 (2열) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 sm:gap-x-6 gap-y-7 sm:gap-y-9 w-full mt-5 mb-5 px-8 sm:px-12">
        {REPORT_OPTIONS.map(({ reportType, label }) => {
          const isSelected = selectedReportType === reportType;
          return (
            <label
              key={reportType}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="relative shrink-0 w-6 h-6 flex items-center justify-center">
                <input
                  type="radio"
                  name="reportReason"
                  value={reportType}
                  checked={isSelected}
                  onChange={() => setSelectedReportType(reportType)}
                  className="sr-only"
                />
                <img
                  src={isSelected ? selectedCircle : unselectedCircle}
                  alt=""
                  aria-hidden
                  className="w-6 h-6 block"
                />
              </span>
              <span className="text-body-14-regular sm:text-body-16-regular text-black group-hover:text-gray4">
                {label}
              </span>
            </label>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="서류 이미지 선택"
        onChange={handleCopyrightImageSelect}
      />

      {/* 안내 텍스트 */}
      <p className="text-body-16-regular text-[#525252] mt-6 mb-2 leading-relaxed px-8 sm:px-12 whitespace-pre-line text-left">
        {`저작권 위반 및 명예훼손 등의 권리침해 신고는 신고센터로 추가 서류를
접수해 주세요. 
추가 서류가 접수되지 않을 경우, 신고 건이 처리되지 않습니다.`}
      </p>

      {/* 권리침해 신고하기: 저작권 선택 시 이미지 업로드, 아니면 외부 링크 또는 비활성 */}
      <div className="mt-3 mb-8 px-8 sm:px-12 flex flex-wrap items-center gap-2">
        {isCopyright ? (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-body-16-regular text-gray-800 underline underline-offset-2 hover:text-black transition"
            >
              권리침해 신고하기 &gt;
            </button>
            {isUploading && (
              <span className="text-body-14-regular text-gray4">
                업로드 중… {uploadProgress}%
              </span>
            )}
            {!isUploading && copyrightImgUrl && (
              <>
                <span className="text-body-14-regular text-gray4">(첨부됨)</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCopyrightImage();
                  }}
                  className="text-body-14-regular text-gray4 underline underline-offset-1 hover:opacity-80"
                >
                  제거
                </button>
              </>
            )}
          </>
        ) : rightsViolationReportUrl &&
          rightsViolationReportUrl !== "#" &&
          rightsViolationReportUrl.trim() !== "" ? (
          <a
            href={rightsViolationReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-16-regular text-gray-800 underline underline-offset-2 hover:text-black transition inline-flex items-center gap-0.5"
          >
            권리침해 신고하기 &gt;
          </a>
        ) : (
          <span className="text-body-16-regular text-gray2 cursor-default">
            권리침해 신고하기 &gt;
          </span>
        )}
      </div>

      {/* 신고하기 버튼 */}
      <div className="flex justify-center w-full">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedReportType || loading}
          className="w-full max-w-[200px] sm:max-w-[160px] py-3 sm:py-[16px] min-h-[44px] sm:min-h-0 rounded-xl bg-primary text-white text-head-16-semibold sm:text-head-18-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {loading ? "처리 중..." : "신고하기"}
        </button>
      </div>
    </BaseModal>
  );
}
