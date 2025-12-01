import { useState } from "react";
import type { FormEvent } from "react";
import { useResumeStore } from "~/lib/resume-store";
import { generateExperienceDescription } from "~/lib/resume-ai";
import { useTranslation } from "react-i18next";

export default function StepExperience() {
  const {
    resumeData,
    addExperience,
    removeExperience,
    updateExperience,
    nextStep,
    prevStep,
    setGenerating,
    isGenerating,
  } = useResumeStore();
  const { t } = useTranslation();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPresent, setIsPresent] = useState(false);
  const [rawDescription, setRawDescription] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const experiences = resumeData.experiences || [];

  const resetForm = () => {
    setCompany("");
    setPosition("");
    setStartDate("");
    setEndDate("");
    setIsPresent(false);
    setRawDescription("");
    setGeneratedDescription("");
    setEditingId(null);
  };

  const hasPendingData = Boolean(
    company.trim() ||
      position.trim() ||
      startDate ||
      endDate ||
      rawDescription.trim() ||
      generatedDescription ||
      editingId
  );

  const persistExperience = () => {
    if (!hasPendingData) {
      return true;
    }

    if (!company.trim() || !position.trim() || !startDate) {
      alert(t('wizard.experience.fillRequiredBeforeContinue'));
      return false;
    }

    if (!isPresent && !endDate) {
      alert(t('wizard.experience.endDateRequired'));
      return false;
    }

    const experienceData = {
      company: company.trim(),
      position: position.trim(),
      period: {
        start: startDate,
        end: isPresent ? null : endDate,
      },
      description: "",
      descriptionRaw: rawDescription.trim(),
    };

    experienceData.description = generatedDescription || rawDescription.trim();

    if (editingId) {
      updateExperience(editingId, experienceData);
    } else {
      addExperience(experienceData);
    }

    resetForm();
    return true;
  };

  const handleAddExperience = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    persistExperience();
  };

  const handleEdit = (exp: Experience) => {
    setEditingId(exp.id);
    setCompany(exp.company);
    setPosition(exp.position);
    setStartDate(exp.period.start);
    setEndDate(exp.period.end || "");
    setIsPresent(exp.period.end === null);
    setRawDescription(exp.descriptionRaw || "");
    setGeneratedDescription(exp.description || "");
  };

  const handleNextStep = () => {
    if (!persistExperience()) {
      return;
    }
    nextStep();
  };

  const handleDelete = (id: string) => {
    if (confirm(t('wizard.experience.deleteConfirm'))) {
      removeExperience(id);
    }
  };

  const handleGenerateDescription = async () => {
    if (!rawDescription.trim()) {
      alert(t('wizard.experience.enterInfoFirst'));
      return;
    }

    if (!company.trim() || !position.trim()) {
      alert(t('wizard.experience.fillRequiredFields'));
      return;
    }

    if (!resumeData.title) {
      alert(t('wizard.experience.enterTitleFirst'));
      return;
    }

    setGenerating(true);
    try {
      const bullets = await generateExperienceDescription(
        rawDescription,
        company,
        position,
        resumeData.title
      );
      const description = bullets.join("\n");
      setGeneratedDescription(description);
    } catch (error) {
      console.error("Error generating description:", error);
      alert(t('wizard.experience.generationError'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="wizard-step">
      <h1 className="text-gradient">{t('wizard.experience.title')}</h1>
      <h2>{t('wizard.experience.subtitle')}</h2>
      <p className="text-dark-200 mb-6">
        {t('wizard.experience.description')}
      </p>

      <div className="w-full max-w-2xl space-y-6">
        {/* Existing Experiences */}
        {experiences.length > 0 && (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="gradient-border p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exp.position}</h3>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {exp.period.start} - {exp.period.end || t('wizard.experience.presentTime')}
                    </p>
                    {exp.description && (
                      <div className="mt-2 text-sm whitespace-pre-line">
                        {exp.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(exp)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <img src="/icons/pin.svg" alt="edit" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <img src="/icons/cross.svg" alt="delete" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Experience Form */}
        <form onSubmit={handleAddExperience} className="space-y-4">
          <div className="form-div">
            <label htmlFor="company">{t('wizard.experience.company')}</label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('wizard.experience.companyPlaceholder')}
              required
            />
          </div>

          <div className="form-div">
            <label htmlFor="position">{t('wizard.experience.position')}</label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder={t('wizard.experience.positionPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-div">
              <label htmlFor="start-date">{t('wizard.experience.startDate')}</label>
              <input
                type="month"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-div">
              <label htmlFor="end-date">{t('wizard.experience.endDate')}</label>
              <input
                type="month"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPresent}
                required={!isPresent}
              />
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={(e) => setIsPresent(e.target.checked)}
                />
                <span className="text-sm">{t('wizard.experience.presentTime')}</span>
              </label>
            </div>
          </div>

          <div className="form-div">
            <label htmlFor="description-raw">
              {t('wizard.experience.jobDescription')}
            </label>
            <textarea
              id="description-raw"
              rows={4}
              value={rawDescription}
              onChange={(e) => setRawDescription(e.target.value)}
              placeholder={t('wizard.experience.jobDescriptionPlaceholder')}
            />
            <div className="w-full flex justify-between gap-4 mt-2">
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={!rawDescription.trim() || isGenerating || !company.trim() || !position.trim()}
                className={`primary-button w-full ${
                  !rawDescription.trim() || isGenerating || !company.trim() || !position.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <p>{isGenerating ? t('wizard.experience.generating') : t('wizard.experience.generateWithAI')}</p>
              </button>
            </div>
            {generatedDescription && (
              <div className="w-full mt-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  {t('wizard.experience.generatedDescriptionLabel')}
                </label>
                <textarea
                  rows={5}
                  value={generatedDescription}
                  onChange={(e) => setGeneratedDescription(e.target.value)}
                  className="w-full p-3 bg-white rounded-lg border border-gray-300 text-sm"
                  placeholder={t('wizard.experience.generatedDescriptionPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t('wizard.experience.canEditDescription')}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="primary-button w-full"
          >
            <p>
              {editingId ? t('wizard.experience.saveChanges') : t('wizard.experience.add')}
            </p>
          </button>
        </form>

        <div className="w-full flex justify-between gap-4 mt-8">
          <button type="button" onClick={prevStep} className="secondary-button w-full">
            <p>{t('wizard.experience.back')}</p>
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            className="primary-button w-full"
          >
            <p>{t('wizard.experience.continue')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

