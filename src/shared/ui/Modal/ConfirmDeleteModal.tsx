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
      className="px-6 sm:px-10 md:px-16 pt-10 sm:pt-14 pb-8 sm:pb-12 gap-6 sm:gap-10"
    >
      <div className="flex flex-col items-center gap-6 sm:gap-10 self-stretch text-center">
        <span className="text-head-24-bold sm:text-head-32-semibold">
          {title}
        </span>
        <p className="text-body-16-regular sm:text-body-20-regular text-gray3 whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:gap-[17px] w-full justify-center">
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
