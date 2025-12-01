import { usePuterStore } from "./puter";
import { detectLanguage } from "./language";
import i18n from "./i18n";
import {
  generateAboutPrompt,
  generateExperienceDescriptionPrompt,
  generateSkillsPrompt,
} from "../../constants/resume-prompts";

/**
 * Generate professional "About" section text using AI
 */
export async function generateAboutText(
  rawText: string,
  profession: string
): Promise<string> {
  const { ai } = usePuterStore.getState();

  if (!ai) {
    throw new Error("AI service not available");
  }

  const language = detectLanguage([rawText, profession], i18n.language);
  const prompt = generateAboutPrompt(rawText, profession, language);

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

    // Clean up the response (remove markdown, extra whitespace)
    return text.trim().replace(/^```[\w]*\n?/gm, "").replace(/```$/gm, "").trim();
  } catch (error) {
    console.error("Error generating about text:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate about text"
    );
  }
}

/**
 * Generate professional experience description using AI
 */
export async function generateExperienceDescription(
  rawDescription: string,
  company: string,
  position: string,
  profession: string
): Promise<string[]> {
  const { ai } = usePuterStore.getState();

  if (!ai) {
    throw new Error("AI service not available");
  }

  const language = detectLanguage(
    [rawDescription, company, position, profession],
    i18n.language
  );
  const prompt = generateExperienceDescriptionPrompt(
    rawDescription,
    company,
    position,
    profession,
    language
  );

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

    // Clean up and parse JSON
    const cleanedText = text
      .trim()
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    try {
      const bullets = JSON.parse(cleanedText);
      if (Array.isArray(bullets)) {
        return bullets.map((b) => String(b));
      }
      throw new Error("Response is not an array");
    } catch (parseError) {
      // If JSON parsing fails, try to extract bullet points manually
      const lines = cleanedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.startsWith("-"));

      if (lines.length > 0) {
        return lines.map((line) => line.replace(/^-\s*/, ""));
      }

      // Last resort: return as single item array
      return [cleanedText];
    }
  } catch (error) {
    console.error("Error generating experience description:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate experience description"
    );
  }
}

/**
 * Generate suggested skills for a profession using AI
 */
export async function generateSuggestedSkills(
  profession: string
): Promise<string[]> {
  const { ai } = usePuterStore.getState();

  if (!ai) {
    throw new Error("AI service not available");
  }

  const language = detectLanguage([profession], i18n.language);
  const prompt = generateSkillsPrompt(profession, language);

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

    // Clean up and parse JSON
    const cleanedText = text
      .trim()
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/```$/gm, "")
      .trim();

    try {
      const skills = JSON.parse(cleanedText);
      if (Array.isArray(skills)) {
        return skills.map((s) => String(s).trim()).filter((s) => s.length > 0);
      }
      throw new Error("Response is not an array");
    } catch (parseError) {
      // If JSON parsing fails, try to extract skills manually
      const lines = cleanedText
        .split(/[,\n]/)
        .map((line) => line.trim().replace(/^["'-]\s*|["'-]$/g, ""))
        .filter((line) => line.length > 0);

      return lines;
    }
  } catch (error) {
    console.error("Error generating suggested skills:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate suggested skills"
    );
  }
}

