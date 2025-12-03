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

IMPORTANT CONTEXT:
This resume was created using AI assistance, so it may be well-structured and professional in general, but might not perfectly match THIS SPECIFIC job's requirements. Your task is to:
1. Fairly assess how well it matches THIS specific position (not general quality)
2. Recognize transferable skills and potential, even if exact keywords are missing
3. Provide constructive, actionable feedback to improve the match

Task:
1. Assess the resume's match to THIS SPECIFIC job position using a balanced approach:
   - Hard Skills Score: Rate based on exact technical requirements match (0-100)
   - Soft Skills Score: Rate based on transferable skills, experience, and potential (0-100)
   - Experience Relevance: Rate how relevant the candidate's experience is, even if not exact match (0-100)
   - Structure Clarity: Rate the resume's overall quality and clarity (0-100)
   
2. Calculate Overall Score as a WEIGHTED AVERAGE:
   - Hard Skills: 30% weight
   - Soft Skills: 25% weight  
   - Experience Relevance: 30% weight
   - Structure Clarity: 15% weight
   
   This ensures that a well-written resume with transferable skills gets fair recognition.

3. Highlight candidate's strengths and transferable skills that could apply to this role.

4. Identify gaps - but distinguish between:
   - Critical gaps (must-have requirements completely missing)
   - Minor gaps (nice-to-have items or slight variations)

5. Provide SPECIFIC, ACTIONABLE recommendations to improve the match.

SCORING GUIDELINES:
- If the resume is well-written but missing some specific requirements: give credit for structure and transferable skills
- If the candidate has similar experience in related technologies: recognize this as relevant
- If soft skills or general experience could apply: give appropriate credit
- Be fair: a 60-70% score means "good match with some gaps" not "bad resume"
- Only give very low scores (<50%) if there are fundamental mismatches

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
- Be fair and constructive in your assessment.
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

КОНТЕКСТИ МУҲИМ:
Ин резюме бо ёрии AI эҷод шудааст, бинобар ин он метавонад дар умум хуб сохтор ёфта ва касбӣ бошад, аммо метавонад ба ин вакансияи мушаххас мутобиқ набошад. Вазифаи шумо:
1. Одилона арзёбӣ кардан, ки он ба ин вакансияи мушаххас чӣ қадар мутобиқ аст (на сифати умумӣ)
2. Маҳоратҳои табдилшаванда ва қобилияти номзадро эътироф кардан, ҳатто агар калимаҳои аниқ нестанд
3. Тавсияҳои созанда ва амалӣ барои беҳтар кардани мутобиқат додан

Вазифа:
1. Мутобиқатии резюмеро ба ин вакансияи мушаххас бо усули мутавозин арзёбӣ кунед:
   - Холи маҳоратҳои сахт: Арзёбӣ дар асоси мутобиқатии аниқи талаботи техникӣ (0-100)
   - Холи маҳоратҳои нарм: Арзёбӣ дар асоси маҳоратҳои табдилшаванда, таҷриба ва қобилият (0-100)
   - Релевантсияи таҷриба: Арзёбӣ, ки таҷрибаи номзад чӣ қадар релевант аст, ҳатто агар мутобиқати аниқ набошад (0-100)
   - Равшании сохтор: Арзёбӣ сифати умумӣ ва равшании резюме (0-100)

2. Холи умумиро ҳамчун ВАЗНИ МУТАВОЗИН ҳисоб кунед:
   - Маҳоратҳои сахт: вазни 30%
   - Маҳоратҳои нарм: вазни 25%
   - Релевантсияи таҷриба: вазни 30%
   - Равшании сохтор: вазни 15%
   
   Ин кафолат медиҳад, ки резюмеи хуб навишташуда бо маҳоратҳои табдилшаванда эътирофи одилона гирад.

3. Қувваҳо ва маҳоратҳои табдилшавандаи номзадро, ки метавонанд ба ин вазифа татбиқ шаванд, барҷаста кунед.

4. Фосилаҳоро муайян кунед - аммо фарқ кунед байни:
   - Фосилаҳои ҷиддӣ (талаботи зарурӣ, ки комилан нестанд)
   - Фосилаҳои хурд (чизҳои хуб ё тағйироти андак)

5. Тавсияҳои МУШАХХАС ва АМАЛӢ барои беҳтар кардани мутобиқат диҳед.

ҚОИДАҲОИ АРЗЁБӢ:
- Агар резюме хуб навишта шуда бошад, аммо баъзе талаботи мушаххас нестанд: барои сохтор ва маҳоратҳои табдилшаванда баҳо диҳед
- Агар номзад таҷрибаи монанд дар технологияҳои монанди дошта бошад: инро ҳамчун релевант эътироф кунед
- Агар маҳоратҳои нарм ё таҷрибаи умумӣ татбиқ шаванд: баҳои мувофиқ диҳед
- Одилона бошед: холи 60-70% маънои "мутобиқати хуб бо баъзе фосилаҳо" аст, на "резюмеи бад"
- Танҳо холи хеле паст (<50%) диҳед, агар номувофиқиҳои асосӣ бошад

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
- Дар арзёбӣ одилона ва созанда бошед.
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

ВАЖНЫЙ КОНТЕКСТ:
Это резюме было создано с помощью AI, поэтому оно может быть хорошо структурированным и профессиональным в целом, но может не идеально подходить под ЭТИ КОНКРЕТНЫЕ требования вакансии. Ваша задача:
1. Справедливо оценить, насколько оно подходит под ЭТУ конкретную позицию (не общее качество)
2. Распознать переносимые навыки и потенциал, даже если точные ключевые слова отсутствуют
3. Дать конструктивную, практическую обратную связь для улучшения соответствия

Задача:
1. Оценить соответствие резюме ЭТОЙ КОНКРЕТНОЙ вакансии сбалансированным подходом:
   - Балл Hard Skills: Оценка на основе точного соответствия техническим требованиям (0-100)
   - Балл Soft Skills: Оценка на основе переносимых навыков, опыта и потенциала (0-100)
   - Релевантность опыта: Оценка, насколько релевантен опыт кандидата, даже если не точное совпадение (0-100)
   - Качество структуры: Оценка общего качества и ясности резюме (0-100)
   
2. Рассчитать Общий балл как ВЗВЕШЕННОЕ СРЕДНЕЕ:
   - Hard Skills: вес 30%
   - Soft Skills: вес 25%
   - Релевантность опыта: вес 30%
   - Качество структуры: вес 15%
   
   Это гарантирует, что хорошо написанное резюме с переносимыми навыками получит справедливое признание.

3. Выделить сильные стороны кандидата и переносимые навыки, которые могут применяться в этой роли.

4. Выявить пробелы - но различать между:
   - Критическими пробелами (обязательные требования полностью отсутствуют)
   - Незначительными пробелами (желательные пункты или небольшие вариации)

5. Дать КОНКРЕТНЫЕ, ПРАКТИЧЕСКИЕ рекомендации для улучшения соответствия.

ПРИНЦИПЫ ОЦЕНКИ:
- Если резюме хорошо написано, но отсутствуют некоторые конкретные требования: дайте кредит за структуру и переносимые навыки
- Если кандидат имеет похожий опыт в смежных технологиях: признайте это как релевантное
- Если soft skills или общий опыт могут применяться: дайте соответствующую оценку
- Будьте справедливы: балл 60-70% означает "хорошее соответствие с некоторыми пробелами", а не "плохое резюме"
- Давайте очень низкие баллы (<50%) только если есть фундаментальные несоответствия

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
- Будь справедливым и конструктивным в оценке.
`;
  }
}


