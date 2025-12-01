import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Datails";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";

export const meta = () => {
  return [
    { title: "ARBA — Resume Review & ATS Score" },
    {
      name: "description",
      content:
        "Detailed AI-powered review of your resume with ATS score, section breakdown and improvement tips.",
    },
    { name: "og:title", content: "ARBA — Resume Review & ATS Score" },
    {
      name: "og:description",
      content:
        "See how your resume performs across tone, content, structure and skills with an ATS-focused analysis.",
    },
    { name: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "ARBA — Resume Review & ATS Score" },
    {
      name: "twitter:description",
      content:
        "Get a detailed AI review of your resume and actionable suggestions to improve it.",
    },
  ];
};

export default function Resume() {
  const { auth, isLoading, kv, fs } = usePuterStore();
  const { id } = useParams();
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    
}, [auth.isAuthenticated, isLoading, navigate, id]);

  useEffect(() => {
    const loadResume = async () => {
      setIsLoadingResume(true);
      setIsImageLoaded(false);
      try {
        const resume = await kv.get(`resume:${id}`);

        if (!resume) {
          setIsLoadingResume(false);
          return;
        }

        const data = JSON.parse(resume);

        const resumeBlob = await fs.read(data.resumePath);
        if (!resumeBlob) {
          setIsLoadingResume(false);
          return;
        }

        const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
        const resumeUrl = URL.createObjectURL(pdfBlob);
        setResumeUrl(resumeUrl);

        const imageBlob = await fs.read(data.imagePath);
        if (!imageBlob) {
          setIsLoadingResume(false);
          return;
        }

        const imageUrl = URL.createObjectURL(imageBlob);
        setImageUrl(imageUrl);

        setFeedback(data.feedback);
        console.log({ resumeUrl, imageUrl, feedback });
      } catch (error) {
        console.error("Error loading resume:", error);
      } finally {
        setIsLoadingResume(false);
      }
    };
    
    if (id && auth.isAuthenticated) {
      loadResume();
    }
  }, [id, kv, fs, auth.isAuthenticated]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            {t('resumeReview.backToHomepage')}
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {isLoadingResume ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">{t('resumeReview.loading')}</p>
            </div>
          ) : imageUrl && resumeUrl ? (
            <div className="relative animate-in fade-in duration-1000 gradient-border msx-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              {!isImageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500">Загрузка изображения...</p>
                </div>
              )}
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  onLoad={() => setIsImageLoaded(true)}
                  className={`w-full h-full object-contain rounded-2xl transition-opacity duration-300 ${
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  title={t('resumeReview.title')}
                />
              </a>
            </div>
          ) : null}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">{t('resumeReview.title')}</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                <Summary feedback={feedback} />
                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                <Details feedback={feedback} />
            </div>
          ): (
            <img src="/images/resume-scan-2.gif" alt="search" className="w-full" />
          )

          }
        </section>
      </div>
    </main>
  );
}
