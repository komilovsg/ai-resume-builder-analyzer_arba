import { getLanguageInstruction } from "~/lib/language";
import type { SupportedLanguage } from "~/lib/language";

/**
 * AI Prompts for Resume Generation
 */

export const generateAboutPrompt = (
  rawText: string,
  profession: string,
  language: SupportedLanguage
): string => {
  const languageInstruction = getLanguageInstruction(language);

  return `You are an expert resume writer. Your task is to create a professional "About" or "Summary" section for a resume.

The user's profession/target position is: ${profession}

The user has provided the following raw information about themselves:
${rawText}

Based on this information, create a professional, concise, and compelling "About" section for their resume. The text should:
- Be 3-4 sentences long
- Highlight key strengths and experience relevant to ${profession}
- Use professional language
- Be ATS-friendly (avoid excessive formatting characters)
- Focus on achievements and value proposition
- Be written in a confident, professional tone

${languageInstruction}

Return ONLY the generated text, without any additional comments, explanations, or markdown formatting.`;
};

export const generateExperienceDescriptionPrompt = (
  rawDescription: string,
  company: string,
  position: string,
  profession: string,
  language: SupportedLanguage
): string => {
  const languageInstruction =
    language === "ru"
      ? "Каждый пункт описания обязан быть написан на русском языке."
      : language === "tj"
      ? "Ҳар як нуқтаи тавсиф бояд пурра ба забони тоҷикӣ навишта шавад."
      : "Each bullet point must be written in English.";

  return `You are an expert resume writer. Your task is to create a professional job description for a resume entry.

The user's target profession is: ${profession}
Company: ${company}
Position: ${position}

The user has provided the following raw information about their work:
${rawDescription}

Based on this information, create a professional job description with 3-5 bullet points. Each bullet point should:
- Start with a strong action verb
- Be specific and quantifiable when possible
- Highlight achievements and impact
- Be relevant to ${profession}
- Use professional language
- Be ATS-friendly

${languageInstruction}

Format the response as a JSON array of strings, where each string is a bullet point. Example format:
["Achieved X by doing Y", "Led team of Z to accomplish W", "Improved metrics by X%"]

Return ONLY the JSON array, without any additional text, comments, or markdown formatting.`;
};

export const generateSkillsPrompt = (
  profession: string,
  language: SupportedLanguage
): string => {
  const languageInstruction =
    language === "ru"
      ? "Названия всех навыков должны быть на русском языке."
      : language === "tj"
      ? "Номи ҳамаи маҳоратҳо бояд ба забони тоҷикӣ навишта шавад."
      : "List all skill names in English.";

  return `You are an expert career advisor. Your task is to suggest relevant skills for a resume.

The target profession is: ${profession}

Based on this profession, suggest 10-15 relevant skills that would be important for this role. Include:
- Technical skills specific to the profession
- Soft skills that are valuable
- Tools and technologies commonly used
- Industry-specific competencies

${languageInstruction}

Return the skills as a JSON array of strings. Example format:
["Skill 1", "Skill 2", "Skill 3"]

Return ONLY the JSON array, without any additional text, comments, or markdown formatting.`;
};

export const generateResumePrompt = (
  resumeData: ResumeData
): string => {
  return `You are an expert resume writer. Create a comprehensive, professional resume based on the following information:

FULL NAME:
${resumeData.fullName}

PROFESSION/TITLE: ${resumeData.title}

LOCATION:
${resumeData.location || "Not provided"}

ABOUT:
${resumeData.about}

CONTACTS:
${[
    resumeData.email && `Email: ${resumeData.email}`,
    resumeData.phone && `Phone: ${resumeData.phone}`,
    resumeData.linkedin && `LinkedIn: ${resumeData.linkedin}`,
    resumeData.telegram && `Telegram: ${resumeData.telegram}`,
  ]
    .filter(Boolean)
    .join("\n") || "Not provided"}

EXPERIENCE:
${resumeData.experiences.map((exp) => `
Company: ${exp.company}
Position: ${exp.position}
Period: ${exp.period.start} - ${exp.period.end || "Present"}
Description: ${exp.description}
`).join("\n---\n")}

SKILLS:
${resumeData.skills.join(", ")}

LANGUAGES:
${resumeData.languages.map((lang) => `${lang.name} (${lang.level})`).join(", ")}

${resumeData.recommendations.length > 0 ? `
RECOMMENDATIONS:
${resumeData.recommendations.map((rec) => `
${rec.name} - ${rec.position}
Contact: ${rec.contact}
`).join("\n")}
` : ""}

Create a well-structured, professional resume that is:
- ATS-friendly
- Well-organized with clear sections
- Professional in tone
- Highlighting achievements and value

Return the resume as formatted text suitable for a professional document.`;
};

