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
  resume: ResumeData
): Promise<JobMatchAnalysisResult> {
  const { ai } = usePuterStore.getState();

  if (!ai) {
    throw new Error("AI service not available");
  }

  const jobDescription = buildJobText(job);
  const resumeText = buildResumeText(resume);

  const prompt = buildPrompt(jobDescription, resumeText);

  try {
    const response = await ai.chat(prompt, undefined, false, {
      model: "claude-3-7-sonnet",
    });

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

    const cleanedText = text
      .trim()
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    const parsed = JSON.parse(cleanedText) as JobMatchAnalysisResult;

    return parsed;
  } catch (error) {
    console.error("Error analyzing resume against job:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to analyze resume"
    );
  }
}

function buildJobText(job: Job): string {
  const parts: string[] = [];

  parts.push(`Название: ${job.title}`);
  parts.push(`Компания: ${job.company}`);

  if (job.location) {
    parts.push(`Локация: ${job.location}`);
  }

  if (job.employmentType) {
    parts.push(`Формат: ${job.employmentType}`);
  }

  if (job.salaryRange) {
    parts.push(`Зарплата: ${job.salaryRange}`);
  }

  parts.push("");
  parts.push("Описание вакансии:");
  parts.push(job.description);

  parts.push("");
  parts.push("Обязательные требования:");
  job.requirements.forEach((req) => {
    parts.push(`- ${req}`);
  });

  if (job.niceToHave && job.niceToHave.length > 0) {
    parts.push("");
    parts.push("Будет плюсом:");
    job.niceToHave.forEach((item) => {
      parts.push(`- ${item}`);
    });
  }

  return parts.join("\n");
}

function buildResumeText(resume: ResumeData): string {
  const parts: string[] = [];

  if (resume.fullName) {
    parts.push(`Имя: ${resume.fullName}`);
  }

  if (resume.title) {
    parts.push(`Желаемая позиция / Title: ${resume.title}`);
  }

  if (resume.location) {
    parts.push(`Локация: ${resume.location}`);
  }

  if (resume.email) {
    parts.push(`Email: ${resume.email}`);
  }

  if (resume.phone) {
    parts.push(`Телефон: ${resume.phone}`);
  }

  if (resume.linkedin) {
    parts.push(`LinkedIn: ${resume.linkedin}`);
  }

  if (resume.telegram) {
    parts.push(`Telegram: ${resume.telegram}`);
  }

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
    resume.skills.forEach((skill) => {
      parts.push(`- ${skill}`);
    });
    parts.push("");
  }

  if (resume.languages && resume.languages.length > 0) {
    parts.push("Языки:");
    resume.languages.forEach((lang) => {
      parts.push(`- ${lang.name} (${lang.level})`);
    });
    parts.push("");
  }

  return parts.join("\n");
}

function buildPrompt(jobDescription: string, resumeText: string): string {
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


