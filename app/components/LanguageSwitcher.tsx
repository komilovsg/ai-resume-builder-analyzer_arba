import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const options = useMemo(
    () => [
      { code: "en", label: "EN", aria: "Switch to English" },
      { code: "ru", label: "RU", aria: "Switch to Russian" },
      { code: "tj", label: "TJ", aria: "Switch to Tajik" },
    ] as const,
    []
  );

  const changeLanguage = async (lng: string) => {
    if (i18n.language === lng || isChanging) return;
    
    setIsChanging(true);
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    
    // Плавное завершение анимации
    setTimeout(() => {
      setIsChanging(false);
    }, 300);
  };

  const currentLanguage = i18n.language || "en";

  return (
    <div
      className={`language-switcher ${isChanging ? "language-switcher--changing" : ""}`}
    >
      {options.map((option) => (
        <button
          key={option.code}
          onClick={() => changeLanguage(option.code)}
          className={`language-switcher__button cursor-pointer ${
            currentLanguage === option.code ? "active" : ""
          }`}
          aria-label={option.aria}
          disabled={isChanging}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

