import { useState } from "react";
import type { FormEvent } from "react";
import { useResumeStore } from "~/lib/resume-store";
import { generateAboutText } from "~/lib/resume-ai";
import { useTranslation } from "react-i18next";

export default function StepAbout() {
  const { resumeData, setAbout, setAboutRaw, nextStep, prevStep, setGenerating, setGenerationError, isGenerating } =
    useResumeStore();
  const { t } = useTranslation();
  const [rawText, setRawText] = useState(resumeData.aboutRaw || "");
  const [generatedText, setGeneratedText] = useState(resumeData.about || "");

  const handleGenerate = async () => {
    if (!rawText.trim()) {
      alert(t('wizard.about.enterInfoFirst'));
      return;
    }

    if (!resumeData.title) {
      alert(t('wizard.about.enterTitleFirst'));
      return;
    }

    setGenerating(true);
    setGenerationError(null);

    try {
      const generated = await generateAboutText(rawText, resumeData.title);
      setGeneratedText(generated);
      setAbout(generated);
      setAboutRaw(rawText);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('wizard.about.generationError');
      setGenerationError(errorMessage);
      alert(`${t('wizard.about.generationError')}: ${errorMessage}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (generatedText.trim() || rawText.trim()) {
      setAbout(generatedText || rawText);
      setAboutRaw(rawText);
      nextStep();
    }
  };

  return (
    <div className="wizard-step">
      <h1 className="text-gradient">{t('wizard.about.title')}</h1>
      <h2>{t('wizard.about.subtitle')}</h2>
      <p className="text-dark-200 mb-6">
        {t('wizard.about.description')}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="form-div">
          <label htmlFor="about-raw">{t('wizard.about.rawText')}</label>
          <textarea
            id="about-raw"
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t('wizard.about.rawTextPlaceholder')}
            className="w-full"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!rawText.trim() || isGenerating}
          className={`primary-button mt-4 w-full ${!rawText.trim() || isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <p>{isGenerating ? t('wizard.about.generating') : t('wizard.about.generateWithAI')}</p>
        </button>

        {generatedText && (
          <div className="form-div mt-6">
            <label htmlFor="about-generated">{t('wizard.about.generatedText')}</label>
            <textarea
              id="about-generated"
              rows={4}
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              className="w-full"
              placeholder={t('wizard.about.generatedPlaceholder')}
            />
            <p className="text-sm text-gray-500 mt-2">
              {t('wizard.about.canEdit')}
            </p>
          </div>
        )}

        <div className="w-full flex justify-between gap-4 mt-8">
          <button
            type="button"
            onClick={prevStep}
            className="secondary-button w-full"
          >
            <p>{t('wizard.about.back')}</p>
          </button>
          <button type="submit" className="primary-button w-full">
            <p>{t('wizard.about.continue')}</p>
          </button>
        </div>
      </form>
    </div>
  );
}

