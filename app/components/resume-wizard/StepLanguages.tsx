import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useResumeStore } from "~/lib/resume-store";
import { useTranslation } from "react-i18next";

const languageKeys = [
  "russian",
  "english",
  "tajik",
  "german",
  "french",
  "spanish",
  "italian",
  "chinese",
  "japanese",
  "korean",
  "arabic",
  "turkish",
  "uzbek",
  "kazakh",
  "ukrainian",
  "polish",
  "portuguese",
  "hindi",
] as const;

export default function StepLanguages() {
  const { resumeData, addLanguage, removeLanguage, nextStep, prevStep } =
    useResumeStore();
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [level, setLevel] = useState<LanguageLevel>("fluent");
  const [useCustom, setUseCustom] = useState(false);

  const languages = resumeData.languages || [];

  const commonLanguages = useMemo(
    () =>
      languageKeys.map((key) => ({
        key,
        label: t(`wizard.languages.common.${key}`),
      })),
    [t]
  );

  const languageLevels: { value: LanguageLevel; label: string }[] = [
    { value: "native", label: t('wizard.languages.levels.native') },
    { value: "fluent", label: t('wizard.languages.levels.fluent') },
    { value: "intermediate", label: t('wizard.languages.levels.intermediate') },
    { value: "basic", label: t('wizard.languages.levels.basic') },
  ];

  const handleAddLanguage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const languageName = useCustom
      ? customLanguage.trim()
      : selectedLanguage.trim();

    if (!languageName) {
      alert(t('wizard.languages.selectOrEnterError'));
      return;
    }

    // Check if already added
    if (languages.some((lang) => lang.name === languageName)) {
      alert(t('wizard.languages.alreadyAdded'));
      return;
    }

    addLanguage({
      name: languageName,
      level,
    });

    // Reset form
    setSelectedLanguage("");
    setCustomLanguage("");
    setLevel("fluent");
    setUseCustom(false);
  };

  return (
    <div className="wizard-step">
      <h1 className="text-gradient">{t('wizard.languages.title')}</h1>
      <h2>{t('wizard.languages.subtitle')}</h2>
      <p className="text-dark-200 mb-6">
        {t('wizard.languages.description')}
      </p>

      <div className="w-full max-w-2xl space-y-6">
        {/* Current Languages */}
        {languages.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">{t('wizard.languages.yourLanguages')}</h3>
            <div className="space-y-2">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="flex items-center justify-between gradient-border p-4"
                >
                  <div>
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-gray-500 ml-2">
                      ({languageLevels.find((l) => l.value === lang.level)?.label})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Language Form */}
        <form onSubmit={handleAddLanguage} className="space-y-4">
          <div className="form-div">
            <label>{t('wizard.languages.selectOrEnter')}</label>
            <div className="flex flex gap-4 mb-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  checked={!useCustom}
                  onChange={() => setUseCustom(false)}
                  className="w-3 h-3 cursor-pointer"
                />
                <span className="text-gray-700 group-hover:text-gray-900 whitespace-nowrap">{t('wizard.languages.fromList')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  className="w-3 h-3 cursor-pointer"
                />
                <span className="text-gray-700 group-hover:text-gray-900 whitespace-nowrap">{t('wizard.languages.custom')}</span>
              </label>
            </div>

            {!useCustom ? (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-4 inset-shadow rounded-2xl focus:outline-none bg-white"
                required
              >
                <option value="">{t('wizard.languages.selectLanguage')}</option>
                {commonLanguages.map((lang) => (
                  <option key={lang.key} value={lang.label}>
                    {lang.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                placeholder={t('wizard.languages.languagePlaceholder')}
                required
              />
            )}
          </div>

          <div className="form-div">
            <label htmlFor="language-level">{t('wizard.languages.level')}</label>
            <select
              id="language-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as LanguageLevel)}
              className="w-full p-4 inset-shadow rounded-2xl focus:outline-none bg-white"
            >
              {languageLevels.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="primary-button w-full">
            <p>{t('wizard.languages.addLanguage')}</p>
          </button>
        </form>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button type="button" onClick={prevStep} className="secondary-button w-full sm:w-1/2">
            <p>{t('wizard.languages.back')}</p>
          </button>
          <button type="button" onClick={nextStep} className="primary-button w-full sm:w-1/2">
            <p>{t('wizard.languages.continue')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}

