import { useState } from "react";
import type { FormEvent } from "react";
import { useResumeStore } from "~/lib/resume-store";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { useTranslation } from "react-i18next";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export default function StepRecommendations() {
  const { resumeData, addRecommendation, removeRecommendation, prevStep, initializeResume } =
    useResumeStore();
  const { kv } = usePuterStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [contact, setContact] = useState("");

  const recommendations = resumeData.recommendations || [];

  const handleAddRecommendation = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !position.trim() || !contact.trim()) {
      alert(t('wizard.recommendations.fillAll'));
      return;
    }

    addRecommendation({
      name: name.trim(),
      position: position.trim(),
      contact: contact.trim(),
    });

    // Reset form
    setName("");
    setPosition("");
    setContact("");
  };

  const handleFinish = async () => {
    if (!resumeData.title) {
      alert(t('wizard.recommendations.enterTitleFirst'));
      return;
    }

    // Prepare final resume data
    const finalResume: ResumeData = {
      id: resumeData.id || "",
      fullName: resumeData.fullName || "",
      title: resumeData.title,
      about: resumeData.about || "",
      aboutRaw: resumeData.aboutRaw || "",
      location: resumeData.location || "",
      email: resumeData.email || "",
      phone: resumeData.phone || "",
      linkedin: resumeData.linkedin || "",
      telegram: resumeData.telegram || "",
      experiences: resumeData.experiences || [],
      skills: resumeData.skills || [],
      languages: resumeData.languages || [],
      recommendations: resumeData.recommendations || [],
      style: resumeData.style || "modern",
      createdAt: resumeData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save to KV store
      await kv.set(`resume:${finalResume.id}`, JSON.stringify(finalResume));
      
      // Show success notification
      Toastify({
        text: t('wizard.recommendations.saveSuccess'),
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
          background: "linear-gradient(135deg, #36cfc9, #6dd178)",
          borderRadius: "1rem",
        },
      }).showToast();
      
      // Navigate to preview
      navigate(`/resume/${finalResume.id}/preview`);
    } catch (error) {
      console.error("Error saving resume:", error);
      Toastify({
        text: t('wizard.recommendations.saveError'),
        duration: 4000,
        gravity: "top",
        position: "right",
        style: {
          background: "linear-gradient(135deg, #ff5f6d, #ffc371)",
          borderRadius: "1rem",
        },
      }).showToast();
    }
  };

  return (
    <div className="wizard-step">
      <h1 className="text-gradient">{t('wizard.recommendations.title')}</h1>
      <h2>{t('wizard.recommendations.subtitle')}</h2>
      <p className="text-dark-200 mb-6">
        {t('wizard.recommendations.description')}
      </p>

      <div className="w-full max-w-2xl space-y-6">
        {/* Current Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">{t('wizard.recommendations.yourRecommendations')}</h3>
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gradient-border p-4"
                >
                  <div>
                    <p className="font-medium">{rec.name}</p>
                    <p className="text-gray-600">{rec.position}</p>
                    <p className="text-sm text-gray-500">{rec.contact}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecommendation(rec.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Recommendation Form */}
        <form onSubmit={handleAddRecommendation} className="space-y-4">
          <div className="form-div">
            <label htmlFor="rec-name">{t('wizard.recommendations.name')}</label>
            <input
              type="text"
              id="rec-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('wizard.recommendations.namePlaceholder')}
              required
            />
          </div>

          <div className="form-div">
            <label htmlFor="rec-position">{t('wizard.recommendations.position')}</label>
            <input
              type="text"
              id="rec-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={t('wizard.recommendations.positionPlaceholder')}
              required
            />
          </div>

          <div className="form-div">
            <label htmlFor="rec-contact">{t('wizard.recommendations.contact')}</label>
            <input
              type="text"
              id="rec-contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t('wizard.recommendations.contactPlaceholder')}
              required
            />
          </div>

          <button type="submit" className="primary-button w-full">
            <p>{t('wizard.recommendations.add')}</p>
          </button>
        </form>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button type="button" onClick={prevStep} className="secondary-button w-full sm:w-1/2">
            <p>{t('wizard.recommendations.back')}</p>
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="primary-button w-full sm:w-1/2"
          >
            <p>{t('wizard.recommendations.finish')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

