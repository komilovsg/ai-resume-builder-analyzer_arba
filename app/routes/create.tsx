import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Navbar from "~/components/Navbar";
import ResumeWizard from "~/components/resume-wizard/ResumeWizard";
import { usePuterStore } from "~/lib/puter";
import { useResumeStore } from "~/lib/resume-store";

export function meta() {
  return [
    { title: "ARBA — Create Resume with AI" },
    {
      name: "description",
      content:
        "Create a professional, ATS-friendly resume step by step with AI assistance and modern templates.",
    },
    { name: "og:title", content: "ARBA — Create Resume with AI" },
    {
      name: "og:description",
      content:
        "Use the ARBA wizard to generate strong resume sections with AI and export them in clean templates.",
    },
    { name: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "ARBA — Create Resume with AI" },
    {
      name: "twitter:description",
      content:
        "Step-by-step AI resume builder with multilingual support and ready-to-use layouts.",
    },
  ];
}

export default function Create() {
  const { auth, isLoading, kv } = usePuterStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  const { resumeData, initializeResume, hydrateResume, reset } = useResumeStore();
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/create`);
    }
  }, [auth.isAuthenticated, isLoading, navigate]);

  // Создание нового резюме - очищаем старое состояние
  useEffect(() => {
    if (!resumeId) {
      // При создании нового резюме всегда сбрасываем старое состояние
      // Это очистит localStorage и начнет с чистого листа
      reset();
      initializeResume();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]); // Зависим только от resumeId, чтобы не вызывать повторно
  // reset и initializeResume - стабильные функции из Zustand store

  // Загрузка существующего резюме для редактирования
  useEffect(() => {
    if (!resumeId) {
      return; // Если это новое резюме, ничего не загружаем
    }

    let isMounted = true;

    const loadExistingResume = async () => {
      setIsLoadingExisting(true);
      setLoadError(null);
      try {
        const stored = await kv.get(`resume:${resumeId}`);
        if (!stored) {
          if (isMounted) {
            setLoadError("Резюме не найдено или было удалено.");
          }
          return;
        }
        const parsed = JSON.parse(stored) as ResumeData;
        if (isMounted) {
          hydrateResume(parsed);
        }
      } catch (error) {
        console.error("Error loading resume:", error);
        if (isMounted) {
          setLoadError("Не удалось загрузить резюме. Попробуйте позже.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingExisting(false);
        }
      }
    };

    loadExistingResume();

    return () => {
      isMounted = false;
    };
  }, [resumeId, kv, hydrateResume]);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        {isLoadingExisting ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <img src="/images/resume-scan-2.gif" className="w-[160px]" alt="loading" />
            <p className="text-gray-600">Загружаем резюме для редактирования...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-lg font-semibold text-red-600">{loadError}</p>
            <button
              type="button"
              onClick={() => navigate("/create")}
              className="primary-button w-fit"
            >
              <p>Создать новое резюме</p>
            </button>
          </div>
        ) : (
          <ResumeWizard autoInit={!resumeId} enableStepNavigation={Boolean(resumeId)} />
        )}
      </section>
    </main>
  );
}

