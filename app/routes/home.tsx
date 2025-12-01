import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import ResumeCardNew from "~/components/ResumeCardNew";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ARBA" },
    { name: "description", content: "AI-Resume Builder and Analyzer" },
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
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [oldResumes, setOldResumes] = useState<StoredOldResume[]>([]);
  const [newResumes, setNewResumes] = useState<StoredNewResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

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
      },
    }).showToast();
  };

  const handleDeleteResume = async (storageKey: string) => {
    if (!confirm(t('home.deleteConfirm'))) {
      return;
    }

    setDeletingKey(storageKey);
    try {
      const result = await kv.delete(storageKey);
      if (!result) {
        throw new Error("KV delete returned false");
      }

      setOldResumes((prev) =>
        prev.filter((resume) => resume.storageKey !== storageKey)
      );
      setNewResumes((prev) =>
        prev.filter((resume) => resume.storageKey !== storageKey)
      );

      showToast(t('home.deleteSuccess'), "success");
    } catch (error) {
      console.error("Error deleting resume:", error);
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
              <Link to="/create" className="primary-button home-cta__btn">
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
                <p>{t('home.createResume')}</p>
              </Link>
              <Link to="/upload" className="secondary-button home-cta__btn">
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
                <p>{t('home.uploadResume')}</p>
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
                <div className="resumes-section">
                  {oldResumes.map((resume) => (
                    <ResumeCard
                      key={resume.storageKey}
                      resume={resume}
                      onDelete={handleDeleteResume}
                      isDeleting={deletingKey === resume.storageKey}
                    />
                  ))}
                </div>
              </div>
            )}

            {newResumes.length > 0 && (
              <div className="w-full mt-8">
                <h2 className="text-2xl font-bold mb-4 text-center">{t('home.createdResumes')}</h2>
                <div className="resumes-section">
                  {newResumes.map((resume) => (
                    <ResumeCardNew
                      key={resume.storageKey}
                      resume={resume}
                      onDelete={handleDeleteResume}
                      isDeleting={deletingKey === resume.storageKey}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </section>
    </main>
  );
}
