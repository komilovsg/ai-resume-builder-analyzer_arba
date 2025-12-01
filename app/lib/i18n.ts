import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../../locales/en.json';
import ruTranslations from '../../locales/ru.json';
import tjTranslations from '../../locales/tj.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ru: {
        translation: ruTranslations,
      },
      tj: {
        translation: tjTranslations,
      },
    },
    lng: typeof window !== 'undefined' ? (localStorage.getItem('i18nextLng') || 'en') : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

