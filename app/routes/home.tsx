import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import ResumeCardNew from "~/components/ResumeCardNew";
import DeleteConfirmModal from "~/components/DeleteConfirmModal";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ARBA — AI Resume Builder & ATS Analyzer" },
    {
      name: "description",
      content:
        "Create professional resumes with AI, choose modern templates and analyze your CV with ATS-friendly recommendations.",
    },
    { name: "og:title", content: "ARBA — AI Resume Builder & ATS Analyzer" },
    {
      name: "og:description",
      content:
        "Build and analyze resumes with AI: smart templates, multilingual support (EN/RU/TJ) and ATS-focused feedback.",
    },
    { name: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "ARBA — AI Resume Builder & ATS Analyzer" },
    {
      name: "twitter:description",
      content:
        "AI-powered resume builder and analyzer with ATS optimization and multilingual support.",
    },
  ];
}

// Helper function to check if resume is old format (with feedback) or new format (ResumeData)
type StoredOldResume = Resume & { storageKey: string };
type StoredNewResume = ResumeData & { storageKey: string };

const isOldResume = (resume: any): resume is Resume => {
  return resume.feedback !== undefined && resume.imagePath !== undefined;
};

const isNewResume = (resume: any): resume is ResumeData => {
  return resume.title !== undefined && resume.about !== undefined;
};

export default function Home() {
  const { auth, kv, fs } = usePuterStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [oldResumes, setOldResumes] = useState<StoredOldResume[]>([]);
  const [newResumes, setNewResumes] = useState<StoredNewResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    storageKey: string | null;
  }>({ isOpen: false, storageKey: null });

  useEffect(() => {
    if (!auth.isAuthenticated) navigate("/auth?next=/");
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    const loadResumes = async () => {
      if (!auth.isAuthenticated) return;
      
      setLoadingResumes(true);

      try {
        const resumes = (await kv.list("resume:*", true)) as KVItem[];

        const old: StoredOldResume[] = [];
        const new_: StoredNewResume[] = [];

        resumes?.forEach((item) => {
          try {
            const parsed = JSON.parse(item.value);
            if (isOldResume(parsed)) {
              old.push({ ...parsed, storageKey: item.key });
            } else if (isNewResume(parsed)) {
              new_.push({ ...parsed, storageKey: item.key });
            }
          } catch (error) {
            console.error("Error parsing resume:", error);
          }
        });

        setOldResumes(old);
        setNewResumes(new_);
      } catch (error) {
        console.error("Error loading resumes:", error);
      } finally {
        setLoadingResumes(false);
      }
    };

    if (auth.isAuthenticated) {
      loadResumes();
    }
  }, [auth.isAuthenticated, kv]);

  const showToast = (message: string, type: "success" | "error") => {
    Toastify({
      text: message,
      duration: 3500,
      gravity: "top",
      position: "right",
      style: {
        background:
          type === "success"
            ? "linear-gradient(135deg, #36cfc9, #6dd178)"
            : "linear-gradient(135deg, #ff5f6d, #ffc371)",
        borderRadius: "1rem",
      },
    }).showToast();
  };

  const handleDeleteClick = (storageKey: string) => {
    setModalState({ isOpen: true, storageKey });
  };

  const handleModalClose = () => {
    if (deletingKey) return; // Не закрываем модалку во время удаления
    setModalState({ isOpen: false, storageKey: null });
  };

  const handleDeleteResume = async () => {
    const storageKey = modalState.storageKey;
    if (!storageKey) return;

    // Проверка авторизации
    if (!auth.isAuthenticated) {
      console.error("User is not authenticated");
      showToast(t('home.deleteError'), "error");
      return;
    }

    setDeletingKey(storageKey);
    try {
      console.log("=== Starting resume deletion ===");
      console.log("Storage key:", storageKey);
      console.log("User authenticated:", auth.isAuthenticated);
      console.log("User:", auth.user?.username);
      
      // Найти резюме для получения путей к файлам
      const oldResumeToDelete = oldResumes.find((r) => r.storageKey === storageKey);
      
      // Удалить файлы, если это старое резюме (у старых резюме есть файлы)
      if (oldResumeToDelete) {
        try {
          console.log("Deleting associated files...");
          if (oldResumeToDelete.imagePath) {
            await fs.delete(oldResumeToDelete.imagePath);
            console.log("Deleted image file:", oldResumeToDelete.imagePath);
          }
          if (oldResumeToDelete.resumePath) {
            await fs.delete(oldResumeToDelete.resumePath);
            console.log("Deleted resume file:", oldResumeToDelete.resumePath);
          }
        } catch (fileError) {
          console.warn("Error deleting files (continuing with KV delete):", fileError);
          // Продолжаем удаление даже если файлы не удалились
        }
      }

      // Удалить запись из KV storage
      // Согласно документации Puter, метод просто удаляет запись
      // Если запись не существует, это не ошибка - просто продолжаем
      try {
        console.log("Attempting to delete KV entry...");
        await kv.delete(storageKey);
        console.log("KV entry deleted successfully");
        
        // Проверяем, что запись действительно удалена
        const verifyValue = await kv.get(storageKey);
        if (verifyValue !== null && verifyValue !== undefined) {
          console.warn("KV entry still exists after delete, trying again...");
          // Пробуем еще раз
          await kv.delete(storageKey);
        }
      } catch (kvError) {
        console.error("Error during KV delete operation:", kvError);
        // Пробуем удалить еще раз на случай временной ошибки
        try {
          console.log("Retrying KV delete...");
          await kv.delete(storageKey);
          console.log("KV entry deleted successfully on retry");
        } catch (retryError) {
          console.error("KV delete failed on retry as well:", retryError);
          // Проверяем, может запись уже удалена
          const verifyValue = await kv.get(storageKey);
          if (verifyValue === null || verifyValue === undefined) {
            console.log("KV entry was deleted despite error (may have been already deleted)");
          } else {
            throw new Error(`Failed to delete from KV storage: ${kvError instanceof Error ? kvError.message : String(kvError)}`);
          }
        }
      }

      // Обновить состояние
      setOldResumes((prev) =>
        prev.filter((resume) => resume.storageKey !== storageKey)
      );
      setNewResumes((prev) =>
        prev.filter((resume) => resume.storageKey !== storageKey)
      );

      // Закрыть модалку и показать успех
      setModalState({ isOpen: false, storageKey: null });
      showToast(t('home.deleteSuccess'), "success");
      console.log("Resume deleted successfully");
    } catch (error) {
      console.error("Error deleting resume:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        storageKey,
      });
      showToast(t('home.deleteError'), "error");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading page-heading--compact py-12">
          <h1 className="text-[2.75rem] leading-tight">{t('home.title')}</h1>
          {!loadingResumes && oldResumes.length === 0 && newResumes.length === 0 ? (
            <h2 className="text-2xl text-dark-200">
              {t('home.noResumes')}
            </h2>
          ) : (
            <h2 className="text-2xl text-dark-200">
              {t('home.hasResumes')}
            </h2>
          )}
          <div className="home-cta mt-8">
            <div className="home-cta__text">
              <p className="text-sm text-gray-600">
                {t('home.description')}
              </p>
            </div>
            <div className="home-cta__actions">
              <Link to="/create" className="primary-button home-cta__btn home-cta__btn--primary">
                <span className="home-cta__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 3.333v9.334M3.333 8h9.334"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="truncate">{t('home.createResume')}</p>
              </Link>
              <Link to="/upload" className="secondary-button home-cta__btn home-cta__btn--secondary">
                <span className="home-cta__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M10.667 1.333H4A1.333 1.333 0 0 0 2.667 2.667v10.666A1.333 1.333 0 0 0 4 14.667h8a1.333 1.333 0 0 0 1.333-1.334V5.333L10.667 1.333Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.667 1.333V5.333h3.333M8 8v3.333M6.667 9.333 8 8l1.333 1.333"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p className="truncate">{t('home.uploadResume')}</p>
              </Link>
            </div>
          </div>
        </div>
        {loadingResumes && (
          <div>
            <img
              src="/images/resume-scan-2.gif"
              className="w-[200px]"
              alt="resume"
            />
          </div>
        )}

        {!loadingResumes && (oldResumes.length > 0 || newResumes.length > 0) && (
          <>
            {oldResumes.length > 0 && (
              <div className="w-full">
                <h2 className="text-2xl font-bold mb-4 text-center">{t('home.analyzedResumes')}</h2>
                <hr className="mb-6 border-gray-300 md:w-[80%] w-full mx-auto" />
                <div className="resumes-section">
                  {oldResumes.map((resume) => (
                    <ResumeCard
                      key={resume.storageKey}
                      resume={resume}
                      onDelete={handleDeleteClick}
                      isDeleting={deletingKey === resume.storageKey}
                    />
                  ))}
                </div>
              </div>
            )}

            {newResumes.length > 0 && (
              <div className="w-full mt-8">
                <h2 className="text-2xl font-bold mb-4 text-center">{t('home.createdResumes')}</h2>
                <hr className="mb-6 border-gray-300 md:w-[80%] w-full mx-auto" />
                <div className="resumes-section">
                  {newResumes.map((resume) => (
                    <ResumeCardNew
                      key={resume.storageKey}
                      resume={resume}
                      onDelete={handleDeleteClick}
                      isDeleting={deletingKey === resume.storageKey}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </section>
      <DeleteConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleDeleteResume}
        isLoading={deletingKey !== null}
      />
    </main>
  );
}
