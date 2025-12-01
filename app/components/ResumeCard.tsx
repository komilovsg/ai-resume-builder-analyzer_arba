import type { MouseEvent } from "react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import { usePuterStore } from "~/lib/puter";

interface ResumeCardProps {
  resume: Resume & { storageKey: string };
  onDelete: (storageKey: string) => void;
  isDeleting: boolean;
}

const ResumeCard = ({
  resume,
  onDelete,
  isDeleting,
}: ResumeCardProps) => {
  const { id, companyName, jobTitle, feedback, imagePath, storageKey } = resume;
  const { fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoadingImage(true);
      const blob = await fs.read(imagePath);
      if (!blob) {
        setIsLoadingImage(false);
        return;
      }
      let url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };

    loadResumes();
  }, [imagePath, fs]);

  const handleImageLoad = () => {
    setIsLoadingImage(false);
  };

  const handleImageError = () => {
    setIsLoadingImage(false);
  };

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete(storageKey);
  };

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={isDeleting}
        title="Удалить резюме"
        className="absolute -top-3 -right-3 z-10 rounded-full bg-white/90 border border-red-200 text-red-600 shadow-lg p-2 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto cursor-pointer"
      >
        {isDeleting ? (
          <span className="block w-4 h-4 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" />
        ) : (
          <span aria-hidden="true">✕</span>
        )}
      </button>
      <Link
        to={`/resume/${id}`}
        className={`resume-card animate-in fade-in duration-700 ${
          isDeleting ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="resume-card-header">
          <div className="flex flex-col gap-1.5">
            {companyName && (
              <h2 className="!text-sm font-bold break-words">
                {companyName}
              </h2>
            )}
            {jobTitle && (
              <h3 className="text-sm text-gray-500 break-words">{jobTitle}</h3>
            )}
            {!companyName && !jobTitle && (
              <h2 className="!text-black font-bold text-sm">Resume</h2>
            )}
          </div>
          <div className="flex-shrink-0">
            {feedback && feedback.overallScore !== undefined ? (
              <ScoreCircle score={feedback.overallScore} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">N/A</span>
              </div>
            )}
          </div>
        </div>
        <div className="gradient-border relative">
          <div className="w-full h-[300px] max-sm:h-[180px] relative bg-gray-50 rounded-xl flex items-center justify-center">
            {isLoadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-xs text-gray-500">Загрузка...</p>
                </div>
              </div>
            )}
            {resumeUrl && (
              <img
                src={resumeUrl}
                alt="resume"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`w-full h-full object-cover object-top rounded-xl transition-opacity duration-300 ${
                  isLoadingImage ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ResumeCard;
