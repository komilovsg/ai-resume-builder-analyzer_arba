import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Фокусировка на кнопке подтверждения при открытии
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);

    // Обработка ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    // Блокировка скролла body при открытии модалки
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, isLoading]);

  // Обработка клика на backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current && !isLoading) {
      onClose();
    }
  };

  // Обработка подтверждения
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="delete-confirm-modal"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-description"
    >
      <div
        ref={modalRef}
        className="delete-confirm-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-confirm-modal__header">
          <h2 id="delete-confirm-title" className="delete-confirm-modal__title">
            {t("home.deleteConfirmTitle")}
          </h2>
          <p
            id="delete-confirm-description"
            className="delete-confirm-modal__description"
          >
            {t("home.deleteConfirmMessage")}
          </p>
        </div>
        <div className="delete-confirm-modal__actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="delete-confirm-modal__button delete-confirm-modal__button--cancel"
          >
            {t("home.deleteCancel")}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="delete-confirm-modal__button delete-confirm-modal__button--confirm"
          >
            {isLoading ? (
              <>
                <span className="delete-confirm-modal__spinner" aria-hidden="true" />
                <span>{t("home.deleteDeleting")}</span>
              </>
            ) : (
              t("home.deleteConfirmButton")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
