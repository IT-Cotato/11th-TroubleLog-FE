import { useState } from "react";

export interface UseWriteModalsResult {
  // 저장/요약 모달
  isPostSaveModalOpen: boolean;
  setIsPostSaveModalOpen: (v: boolean) => void;
  isTemplateSelectModalOpen: boolean;
  setIsTemplateSelectModalOpen: (v: boolean) => void;
  isLoadingModalOpen: boolean;
  setIsLoadingModalOpen: (v: boolean) => void;
  isSuccessModalOpen: boolean;
  setIsSuccessModalOpen: (v: boolean) => void;
  // 토스트 알림
  showAlert: boolean;
  setShowAlert: (v: boolean) => void;
  showSaveAlert: boolean;
  setShowSaveAlert: (v: boolean) => void;
  showCancelAlert: boolean;
  setShowCancelAlert: (v: boolean) => void;
}

export function useWriteModals(): UseWriteModalsResult {
  const [isPostSaveModalOpen, setIsPostSaveModalOpen] = useState(false);
  const [isTemplateSelectModalOpen, setIsTemplateSelectModalOpen] =
    useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  return {
    isPostSaveModalOpen,
    setIsPostSaveModalOpen,
    isTemplateSelectModalOpen,
    setIsTemplateSelectModalOpen,
    isLoadingModalOpen,
    setIsLoadingModalOpen,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    showAlert,
    setShowAlert,
    showSaveAlert,
    setShowSaveAlert,
    showCancelAlert,
    setShowCancelAlert,
  };
}
