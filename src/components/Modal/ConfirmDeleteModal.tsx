import BaseModal from "./BaseModal";
import CancelButton from "../Button/CancelButton";
import SaveButton from "../Button/SaveButton";
interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  label?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  onClose,
  onConfirm,
  title,
  description,
  label,
  loading = false,
}: ConfirmDeleteModalProps) {
  const buttonLabel = label ?? (loading ? "삭제 중..." : "삭제");

  return (
    <BaseModal
      onClose={onClose}
      className="px-[64px] pt-[67px] pb-[66px] gap-[40px]"
    >
      <div className="flex flex-col items-center gap-[40px] self-stretch">
        <span className="text-head-32-semibold">{title}</span>
        <p className="text-center text-body-20-regular text-gray3 whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-[17px]">
        <CancelButton onClick={onClose} disabled={loading} />
        <SaveButton
          onClick={onConfirm}
          label={buttonLabel}
          disabled={loading}
        />
      </div>
    </BaseModal>
  );
}
