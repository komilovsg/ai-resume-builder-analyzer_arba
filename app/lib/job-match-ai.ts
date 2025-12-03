import { usePuterStore } from "./puter";
import type { Job } from "../../constants/jobs";

interface JobMatchSummary {
  hardSkillsScore: number;
  softSkillsScore: number;
  experienceRelevanceScore: number;
  structureClarityScore: number;
}

export interface JobMatchAnalysisResult {
  overallScore: number;
  verdict: string;
  matchingSummary: JobMatchSummary;
  matchedKeywords: {
    requiredPresent: string[];
    requiredMissing: string[];
    niceToHavePresent: string[];
    niceToHaveMissing: string[];
  };
  criticalGaps: string[];
  improvementSuggestions: {
    summary: string[];
    experience: string[];
    skills: string[];
    extra: string[];
  };
}

export async function analyzeResumeAgainstJob(
  job: Job,
  resume: ResumeData,
  language: string = "en"
): Promise<JobMatchAnalysisResult> {
  const { ai } = usePuterStore.getState();

  if (!ai) {
    throw new Error("AI service not available");
  }

  console.log("Building job and resume text for analysis:", {
    jobId: job.id,
    jobTitle: job.title,
    language,
    hasResume: !!resume
  });

  const jobDescription = buildJobText(job, language);
  const resumeText = buildResumeText(resume, language);

  console.log("Job description length:", jobDescription.length);
  console.log("Resume text length:", resumeText.length);

  const prompt = buildPrompt(jobDescription, resumeText, language);

  try {
    const response = await ai.chat(prompt, undefined, false, {
      model: "claude-3-7-sonnet",
    });

    // Проверяем на ошибки в ответе
    if (response && typeof response === "object" && "success" in response && !response.success) {
      const errorObj = response as any;
      if (errorObj.error) {
        const errorMessage = errorObj.error.message || errorObj.error.delegate || "Unknown error";
        if (errorMessage.includes("usage-limited") || errorMessage.includes("400")) {
          throw new Error("AI_USAGE_LIMIT_EXCEEDED");
        }
        throw new Error(`AI API error: ${errorMessage}`);
      }
    }

    if (!response || !response.message) {
      throw new Error("No response from AI");
    }

    const content = response.message.content;
    let text = "";

    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content[0]?.text || "";
    }

    if (!text || text.trim().length === 0) {
      console.error("AI returned empty response");
      throw new Error("AI returned empty response");
    }

    console.log("AI response text length:", text.length);
    console.log("AI response preview:", text.substring(0, 200));

    const cleanedText = text
      .trim()
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    if (!cleanedText || cleanedText.length === 0) {
      console.error("Cleaned text is empty after processing");
      throw new Error("AI response is empty after cleaning");
    }

    try {
      const parsed = JSON.parse(cleanedText) as JobMatchAnalysisResult;
      
      // Валидация структуры ответа
      if (!parsed.overallScore || typeof parsed.overallScore !== "number") {
        throw new Error("Invalid response structure: missing or invalid overallScore");
      }
      if (!parsed.matchingSummary || typeof parsed.matchingSummary !== "object") {
        throw new Error("Invalid response structure: missing matchingSummary");
      }
      if (!parsed.improvementSuggestions || typeof parsed.improvementSuggestions !== "object") {
        throw new Error("Invalid response structure: missing improvementSuggestions");
      }
      
      return parsed;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Cleaned text length:", cleanedText.length);
      console.error("Cleaned text (first 500 chars):", cleanedText.substring(0, 500));
      console.error("Original text length:", text.length);
      throw new Error(
        `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Invalid JSON format"}`
      );
    }
  } catch (error) {
    console.error("Error analyzing resume against job:", error);
    
    // Специальная обработка ошибки лимита использования
    if (error instanceof Error && error.message === "AI_USAGE_LIMIT_EXCEEDED") {
      throw new Error("AI_USAGE_LIMIT_EXCEEDED");
    }
    
    // Проверяем, если ошибка содержит информацию о лимите
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("usage-limited") || errorMessage.includes("400")) {
      throw new Error("AI_USAGE_LIMIT_EXCEEDED");
    }
    
    throw new Error(
      error instanceof Error ? error.message : "Failed to analyze resume"
    );
  }
}

function buildJobText(job: Job, language: string = "en"): string {
  const parts: string[] = [];

  if (language === "en") {
    parts.push(`Title: ${job.title}`);
    parts.push(`Company: ${job.company}`);
    if (job.location) parts.push(`Location: ${job.location}`);
    if (job.employmentType) parts.push(`Type: ${job.employmentType}`);
    if (job.salaryRange) parts.push(`Salary: ${job.salaryRange}`);
    parts.push("");
    parts.push("Job Description:");
    parts.push(job.description);
    parts.push("");
    parts.push("Required Qualifications:");
    job.requirements.forEach((req) => parts.push(`- ${req}`));
    if (job.niceToHave && job.niceToHave.length > 0) {
      parts.push("");
      parts.push("Nice to Have:");
      job.niceToHave.forEach((item) => parts.push(`- ${item}`));
    }
  } else if (language === "tj") {
    parts.push(`Ном: ${job.title}`);
    parts.push(`Ширкат: ${job.company}`);
    if (job.location) parts.push(`Ҷойгиршавӣ: ${job.location}`);
    if (job.employmentType) parts.push(`Намуд: ${job.employmentType}`);
    if (job.salaryRange) parts.push(`Маош: ${job.salaryRange}`);
    parts.push("");
    parts.push("Тавсифи вакансия:");
    parts.push(job.description);
    parts.push("");
    parts.push("Талаботи зарурӣ:");
    job.requirements.forEach((req) => parts.push(`- ${req}`));
    if (job.niceToHave && job.niceToHave.length > 0) {
      parts.push("");
      parts.push("Хуб мешавад:");
      job.niceToHave.forEach((item) => parts.push(`- ${item}`));
    }
  } else {
    // Russian (default)
    parts.push(`Название: ${job.title}`);
    parts.push(`Компания: ${job.company}`);
    if (job.location) parts.push(`Локация: ${job.location}`);
    if (job.employmentType) parts.push(`Формат: ${job.employmentType}`);
    if (job.salaryRange) parts.push(`Зарплата: ${job.salaryRange}`);
    parts.push("");
    parts.push("Описание вакансии:");
    parts.push(job.description);
    parts.push("");
    parts.push("Обязательные требования:");
    job.requirements.forEach((req) => parts.push(`- ${req}`));
    if (job.niceToHave && job.niceToHave.length > 0) {
      parts.push("");
      parts.push("Будет плюсом:");
      job.niceToHave.forEach((item) => parts.push(`- ${item}`));
    }
  }

  return parts.join("\n");
}

function buildResumeText(resume: ResumeData, language: string = "en"): string {
  const parts: string[] = [];

  if (language === "en") {
    if (resume.fullName) parts.push(`Name: ${resume.fullName}`);
    if (resume.title) parts.push(`Desired Position / Title: ${resume.title}`);
    if (resume.location) parts.push(`Location: ${resume.location}`);
    if (resume.email) parts.push(`Email: ${resume.email}`);
    if (resume.phone) parts.push(`Phone: ${resume.phone}`);
    if (resume.linkedin) parts.push(`LinkedIn: ${resume.linkedin}`);
    if (resume.telegram) parts.push(`Telegram: ${resume.telegram}`);
    parts.push("");
    if (resume.about) {
      parts.push("About Me Section:");
      parts.push(resume.about);
      parts.push("");
    }
    if (resume.experiences && resume.experiences.length > 0) {
      parts.push("Work Experience:");
      resume.experiences.forEach((exp, index) => {
        parts.push(`Experience #${index + 1}:`);
        parts.push(`Company: ${exp.company}`);
        parts.push(`Position: ${exp.position}`);
        if (exp.period && (exp.period.start || exp.period.end)) {
          const start = exp.period.start || "";
          const end = exp.period.end || "Present";
          parts.push(`Period: ${start} — ${end}`);
        }
        if (exp.description) {
          parts.push("Description of responsibilities and achievements:");
          parts.push(exp.description);
        }
        parts.push("");
      });
    }
    if (resume.skills && resume.skills.length > 0) {
      parts.push("Skills:");
      resume.skills.forEach((skill) => parts.push(`- ${skill}`));
      parts.push("");
    }
    if (resume.languages && resume.languages.length > 0) {
      parts.push("Languages:");
      resume.languages.forEach((lang) => parts.push(`- ${lang.name} (${lang.level})`));
      parts.push("");
    }
  } else if (language === "tj") {
    if (resume.fullName) parts.push(`Ном: ${resume.fullName}`);
    if (resume.title) parts.push(`Вазифаи мақсаднок / Ном: ${resume.title}`);
    if (resume.location) parts.push(`Ҷойгиршавӣ: ${resume.location}`);
    if (resume.email) parts.push(`Email: ${resume.email}`);
    if (resume.phone) parts.push(`Телефон: ${resume.phone}`);
    if (resume.linkedin) parts.push(`LinkedIn: ${resume.linkedin}`);
    if (resume.telegram) parts.push(`Telegram: ${resume.telegram}`);
    parts.push("");
    if (resume.about) {
      parts.push("Блоки 'Дар бораи ман':");
      parts.push(resume.about);
      parts.push("");
    }
    if (resume.experiences && resume.experiences.length > 0) {
      parts.push("Таҷрибаи корӣ:");
      resume.experiences.forEach((exp, index) => {
        parts.push(`Таҷриба #${index + 1}:`);
        parts.push(`Ширкат: ${exp.company}`);
        parts.push(`Вазифа: ${exp.position}`);
        if (exp.period && (exp.period.start || exp.period.end)) {
          const start = exp.period.start || "";
          const end = exp.period.end || "то ҳол";
          parts.push(`Давра: ${start} — ${end}`);
        }
        if (exp.description) {
          parts.push("Тавсифи масъулиятҳо ва натиҷаҳо:");
          parts.push(exp.description);
        }
        parts.push("");
      });
    }
    if (resume.skills && resume.skills.length > 0) {
      parts.push("Маҳоратҳо:");
      resume.skills.forEach((skill) => parts.push(`- ${skill}`));
      parts.push("");
    }
    if (resume.languages && resume.languages.length > 0) {
      parts.push("Забонҳо:");
      resume.languages.forEach((lang) => parts.push(`- ${lang.name} (${lang.level})`));
      parts.push("");
    }
  } else {
    // Russian (default)
    if (resume.fullName) parts.push(`Имя: ${resume.fullName}`);
    if (resume.title) parts.push(`Желаемая позиция / Title: ${resume.title}`);
    if (resume.location) parts.push(`Локация: ${resume.location}`);
    if (resume.email) parts.push(`Email: ${resume.email}`);
    if (resume.phone) parts.push(`Телефон: ${resume.phone}`);
    if (resume.linkedin) parts.push(`LinkedIn: ${resume.linkedin}`);
    if (resume.telegram) parts.push(`Telegram: ${resume.telegram}`);
    parts.push("");
    if (resume.about) {
      parts.push("Блок 'О себе':");
      parts.push(resume.about);
      parts.push("");
    }
    if (resume.experiences && resume.experiences.length > 0) {
      parts.push("Опыт работы:");
      resume.experiences.forEach((exp, index) => {
        parts.push(`Опыт #${index + 1}:`);
        parts.push(`Компания: ${exp.company}`);
        parts.push(`Должность: ${exp.position}`);
        if (exp.period && (exp.period.start || exp.period.end)) {
          const start = exp.period.start || "";
          const end = exp.period.end || "по наст. время";
          parts.push(`Период: ${start} — ${end}`);
        }
        if (exp.description) {
          parts.push("Описание обязанностей и результатов:");
          parts.push(exp.description);
        }
        parts.push("");
      });
    }
    if (resume.skills && resume.skills.length > 0) {
      parts.push("Навыки:");
      resume.skills.forEach((skill) => parts.push(`- ${skill}`));
      parts.push("");
    }
    if (resume.languages && resume.languages.length > 0) {
      parts.push("Языки:");
      resume.languages.forEach((lang) => parts.push(`- ${lang.name} (${lang.level})`));
      parts.push("");
    }
  }

  return parts.join("\n");
}

function buildPrompt(jobDescription: string, resumeText: string, language: string = "en"): string {
  if (language === "en") {
    return `
You are a professional career consultant and HR specialist for IT job positions.

You have:
1) A job description (JOB_DESCRIPTION).
2) A candidate's resume as text (RESUME_TEXT).

JOB_DESCRIPTION:
"""
${jobDescription}
"""

RESUME_TEXT:
"""
${resumeText}
"""

Task:
1. Assess how well the resume fits this specific job position.
2. Highlight the candidate's strengths relative to the requirements.
3. Identify key gaps and risks.
4. Provide specific recommendations on how to improve the resume specifically for this job.

Respond in the user's interface language: English.

Response format — strictly JSON according to the following schema:

{
  "overallScore": number,
  "verdict": string,
  "matchingSummary": {
    "hardSkillsScore": number,
    "softSkillsScore": number,
    "experienceRelevanceScore": number,
    "structureClarityScore": number
  },
  "matchedKeywords": {
    "requiredPresent": string[],
    "requiredMissing": string[],
    "niceToHavePresent": string[],
    "niceToHaveMissing": string[]
  },
  "criticalGaps": string[],
  "improvementSuggestions": {
    "summary": string[],
    "experience": string[],
    "skills": string[],
    "extra": string[]
  }
}

Requirements:
- Do not go beyond this schema.
- Write concisely, to the point, without generic phrases.
- Focus on the actual text of the job posting and resume.
`;
  } else if (language === "tj") {
    return `
Шумо консультанти касбии касбӣ ва мутахассиси HR барои вакансияҳои IT ҳастед.

Шумо доред:
1) Тавсифи вакансия (JOB_DESCRIPTION).
2) Резюмеи номзад ба сурати матн (RESUME_TEXT).

JOB_DESCRIPTION:
"""
${jobDescription}
"""

RESUME_TEXT:
"""
${resumeText}
"""

Вазифа:
1. Арзёбӣ кунед, ки резюме ба ин вакансияи мушаххас чӣ қадар мутобиқ аст.
2. Қувваҳои номзадро нисбат ба талабот барҷаста кунед.
3. Фосилаҳо ва хатарҳои асосиро муайян кунед.
4. Тавсияҳои мушаххас диҳед, ки чӣ тавр резюмеро барои ин вакансия беҳтар кардан мумкин аст.

Ба забони интерфейси корбар ҷавоб диҳед: тоҷикӣ.

Формати ҷавоб — қатъиан JSON мувофиқи намунаи зерин:

{
  "overallScore": number,
  "verdict": string,
  "matchingSummary": {
    "hardSkillsScore": number,
    "softSkillsScore": number,
    "experienceRelevanceScore": number,
    "structureClarityScore": number
  },
  "matchedKeywords": {
    "requiredPresent": string[],
    "requiredMissing": string[],
    "niceToHavePresent": string[],
    "niceToHaveMissing": string[]
  },
  "criticalGaps": string[],
  "improvementSuggestions": {
    "summary": string[],
    "experience": string[],
    "skills": string[],
    "extra": string[]
  }
}

Ҳатмӣ:
- Аз ин намуна берун наравед.
- Мухтасар, ба мақсад, бе ибораҳои умумӣ нависед.
- Ба матни воқеии вакансия ва резюме диққат диҳед.
`;
  } else {
    // Russian (default)
    return `
Ты — профессиональный карьерный консультант и HR-специалист по IT-вакансиям.

У тебя есть:
1) Описание вакансии (JOB_DESCRIPTION).
2) Резюме кандидата в виде текста (RESUME_TEXT).

JOB_DESCRIPTION:
"""
${jobDescription}
"""

RESUME_TEXT:
"""
${resumeText}
"""

Задача:
1. Оценить, насколько резюме подходит под эту конкретную вакансию.
2. Выделить сильные стороны кандидата относительно требований.
3. Выявить ключевые пробелы и риски.
4. Дать конкретные рекомендации, как улучшить резюме именно под эту вакансию.

Отвечай на языке интерфейса пользователя: русский.

Формат ответа — строго JSON по следующей схеме:

{
  "overallScore": number,
  "verdict": string,
  "matchingSummary": {
    "hardSkillsScore": number,
    "softSkillsScore": number,
    "experienceRelevanceScore": number,
    "structureClarityScore": number
  },
  "matchedKeywords": {
    "requiredPresent": string[],
    "requiredMissing": string[],
    "niceToHavePresent": string[],
    "niceToHaveMissing": string[]
  },
  "criticalGaps": string[],
  "improvementSuggestions": {
    "summary": string[],
    "experience": string[],
    "skills": string[],
    "extra": string[]
  }
}

Обязательно:
- Не выходи за пределы этой схемы.
- Пиши кратко, по делу, без общих фраз.
- Фокусируйся на реальном тексте вакансии и резюме.
`;
  }
}


