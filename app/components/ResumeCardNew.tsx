import type { MouseEvent } from "react";
import { Link, useNavigate } from "react-router";
import ResumeModern from "./resume-preview/styles/ResumeModern";
import ResumeClassic from "./resume-preview/styles/ResumeClassic";
import ResumeMinimal from "./resume-preview/styles/ResumeMinimal";

interface ResumeCardNewProps {
  resume: ResumeData & { storageKey: string };
  onDelete: (storageKey: string) => void;
  isDeleting: boolean;
}

export default function ResumeCardNew({
  resume,
  onDelete,
  isDeleting,
}: ResumeCardNewProps) {
  const navigate = useNavigate();
  const styleLabels: Record<ResumeStyle, string> = {
    modern: "Современный",
    classic: "Классический",
    minimal: "Минималистичный",
  };

  const normalizedResume: ResumeData = {
    ...resume,
    fullName: resume.fullName || resume.title,
    location: resume.location || "",
    about: resume.about || "",
    aboutRaw: resume.aboutRaw || "",
    email: resume.email || "",
    phone: resume.phone || "",
    linkedin: resume.linkedin || "",
    telegram: resume.telegram || "",
    experiences: resume.experiences || [],
    skills: resume.skills || [],
    languages: resume.languages || [],
    recommendations: resume.recommendations || [],
    style: resume.style || "modern",
    createdAt: resume.createdAt || new Date().toISOString(),
    updatedAt: resume.updatedAt || new Date().toISOString(),
  };

  const renderPreviewByStyle = () => {
    switch (normalizedResume.style) {
      case "classic":
        return <ResumeClassic resumeData={normalizedResume} variant="card" />;
      case "minimal":
        return <ResumeMinimal resumeData={normalizedResume} variant="card" />;
      case "modern":
      default:
        return <ResumeModern resumeData={normalizedResume} variant="card" />;
    }
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete(resume.storageKey);
  };

  const handleEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/create?resumeId=${resume.id}`);
  };

  return (
    <div className="relative group animate-in fade-in duration-1000 pb-20">
      <div className="absolute -top-3 -right-3 z-10 flex gap-2 opacity-0 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
        <button
          type="button"
          onClick={handleEditClick}
          title="Редактировать резюме"
          className="rounded-full bg-white/90 border border-blue-200 text-blue-600 shadow-lg p-2 hover:bg-blue-50 transition cursor-pointer"
        >
          <span aria-hidden="true">✎</span>
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          title="Удалить резюме"
          className="rounded-full bg-white/90 border border-red-200 text-red-600 shadow-lg p-2 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isDeleting ? (
            <span className="block w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
          ) : (
            <span aria-hidden="true">✕</span>
          )}
        </button>
      </div>
      <Link
        to={`/resume/${resume.id}/preview`}
        className={`resume-card resume-card--preview animate-in fade-in duration-700 ${
          isDeleting ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="resume-card-preview-shell p-2 animate-in fade-in duration-1000">
          <div className="resume-card-preview-scale">{renderPreviewByStyle()}</div>
        </div>
        <div className="resume-card-caption">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Стиль: {styleLabels[normalizedResume.style]}
          </p>
        </div>
      </Link>
    </div>
  );
}

