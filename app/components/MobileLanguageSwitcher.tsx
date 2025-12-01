import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';

interface MobileLanguageSwitcherProps {
  onClose: () => void;
}

export default function MobileLanguageSwitcher({
  onClose,
}: MobileLanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const options = useMemo(
    () => [
      { code: 'en', label: 'English', nativeLabel: 'English' },
      { code: 'ru', label: 'Русский', nativeLabel: 'Русский' },
      { code: 'tj', label: 'Тоҷикӣ', nativeLabel: 'Тоҷикӣ' },
    ] as const,
    []
  );

  const changeLanguage = async (lng: string) => {
    if (i18n.language === lng || isChanging) return;

    setIsChanging(true);
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);

    setTimeout(() => {
      setIsChanging(false);
      onClose();
    }, 300);
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <div className="mobile-language-switcher">
      {options.map((option) => (
        <button
          key={option.code}
          onClick={() => changeLanguage(option.code)}
          className={`mobile-language-switcher__button ${
            currentLanguage === option.code ? 'active' : ''
          }`}
          disabled={isChanging || currentLanguage === option.code}
        >
          <div className="mobile-language-switcher__button-content">
            <span className="mobile-language-switcher__code">{option.label}</span>
            <span className="mobile-language-switcher__native">
              {option.nativeLabel}
            </span>
          </div>
          {currentLanguage === option.code && (
            <div className="mobile-language-switcher__check">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

