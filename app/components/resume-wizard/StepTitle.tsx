import { useState } from "react";
import type { FormEvent } from "react";
import { useResumeStore } from "~/lib/resume-store";
import { useTranslation } from "react-i18next";

export default function StepTitle() {
  const { resumeData, setTitle, setPersonalInfo, nextStep } = useResumeStore();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState(resumeData.fullName || "");
  const [title, setTitleLocal] = useState(resumeData.title || "");
  const [location, setLocation] = useState(resumeData.location || "");
  const [email, setEmail] = useState(resumeData.email || "");
  const [phone, setPhone] = useState(resumeData.phone || "");
  const [linkedin, setLinkedin] = useState(resumeData.linkedin || "");
  const [telegram, setTelegram] = useState(resumeData.telegram || "");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedFullName = fullName.trim();
    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedLinkedin = linkedin.trim();
    const trimmedTelegram = telegram.trim();

    if (!trimmedFullName || !trimmedTitle) {
      return;
    }

    if (!trimmedEmail || !trimmedPhone) {
      alert(t('wizard.title.contactRequired'));
      return;
    }

    setTitle(trimmedTitle);
    setPersonalInfo({
      fullName: trimmedFullName,
      location: trimmedLocation,
      email: trimmedEmail,
      phone: trimmedPhone,
      linkedin: trimmedLinkedin,
      telegram: trimmedTelegram,
    });
    nextStep();
  };

  return (
    <div className="wizard-step">
      <h1 className="text-gradient">{t('wizard.title.title')}</h1>
      <h2>{t('wizard.title.subtitle')}</h2>
      <p className="text-dark-200 mb-6">
        {t('wizard.title.description')}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="form-div">
          <label htmlFor="resume-fullname">{t('wizard.title.fullName')}</label>
          <input
            type="text"
            id="resume-fullname"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('wizard.title.fullNamePlaceholder')}
            required
            className="w-full"
          />
        </div>

        <div className="form-div">
          <label htmlFor="resume-title">{t('wizard.title.resumeTitle')}</label>
          <input
            type="text"
            id="resume-title"
            value={title}
            onChange={(e) => setTitleLocal(e.target.value)}
            placeholder={t('wizard.title.resumeTitlePlaceholder')}
            required
            className="w-full"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 w-full">
          <div className="form-div">
            <label htmlFor="resume-location">{t('wizard.title.location')}</label>
            <input
              type="text"
              id="resume-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('wizard.title.locationPlaceholder')}
            />
          </div>

          <div className="form-div">
            <label htmlFor="resume-email">{t('wizard.title.email')}</label>
            <input
              type="email"
              id="resume-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('wizard.title.emailPlaceholder')}
              required
            />
          </div>

          <div className="form-div">
            <label htmlFor="resume-phone">{t('wizard.title.phone')}</label>
            <input
              type="tel"
              id="resume-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('wizard.title.phonePlaceholder')}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 w-full">
          <div className="form-div">
            <label htmlFor="resume-linkedin">{t('wizard.title.linkedin')}</label>
            <input
              type="url"
              id="resume-linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder={t('wizard.title.linkedinPlaceholder')}
            />
          </div>

          <div className="form-div">
            <label htmlFor="resume-telegram">{t('wizard.title.telegram')}</label>
            <input
              type="text"
              id="resume-telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder={t('wizard.title.telegramPlaceholder')}
            />
          </div>
        </div>

        <button type="submit" className="primary-button mt-8 w-full">
          <p>{t('wizard.title.continue')}</p>
        </button>
      </form>
    </div>
  );
}

