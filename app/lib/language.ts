export type SupportedLanguage = "ru" | "en" | "tj";

const CYRILLIC_REGEX = /[А-Яа-яЁё]/g;
const LATIN_REGEX = /[A-Za-z]/g;
// Tajik uses Cyrillic with additional letters that are not present in Russian.
// We use them as a heuristic to distinguish Tajik text from generic Cyrillic.
const TAJIK_EXTRA_CYRILLIC_REGEX = /[ҚқҒғӢӣҶҷҲҳЪъӮӯ]/g;

export const detectLanguage = (
  texts: Array<string | null | undefined>,
  uiLanguage?: string | null
): SupportedLanguage => {
  // Если пользователь явно выбрал таджикский интерфейс — форсим таджикский для AI,
  // чтобы все генерации были на таджикском, даже если в тексте мало уникальных букв.
  if (uiLanguage === "tj") {
    return "tj";
  }

  const combined = texts.filter(Boolean).join(" ").trim();
  if (!combined) {
    return "en";
  }

  const tajikExtraCount = (combined.match(TAJIK_EXTRA_CYRILLIC_REGEX) || []).length;
  const cyrillicCount = (combined.match(CYRILLIC_REGEX) || []).length;
  const latinCount = (combined.match(LATIN_REGEX) || []).length;

  if (tajikExtraCount > 0) {
    return "tj";
  }

  if (cyrillicCount > 0 && cyrillicCount >= latinCount) {
    return "ru";
  }

  return "en";
};

export const getLanguageInstruction = (language: SupportedLanguage): string => {
  if (language === "ru") {
    return "Весь итоговый текст должен быть написан на русском языке.";
  }

  if (language === "tj") {
    return "Ҳамаи матни ниҳоӣ бояд пурра ба забони тоҷикӣ навишта шавад.";
  }

  return "Write the final response in English.";
};

