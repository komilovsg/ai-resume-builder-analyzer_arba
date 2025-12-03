import type { Route } from "./+types/job";
import { useParams, Link } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import ScoreCircle from "../components/ScoreCircle";
import ScoreBar from "../components/ScoreBar";
import FileUploader from "../components/FileUploader";
import { jobs } from "../../constants/jobs";
import { usePuterStore } from "../lib/puter";
import {
  analyzeResumeAgainstJob,
  type JobMatchAnalysisResult,
} from "../lib/job-match-ai";

export function meta({ params }: Route.MetaArgs) {
  const job = jobs.find((j) => j.id === params.id);

  return [
    {
      title: job
        ? `${job.title} — ${job.company} | ARBA`
        : "Вакансия не найдена | ARBA",
    },
  ];
}

export default function JobRoute() {
  const { id } = useParams<{ id: string }>();
  const job = jobs.find((j) => j.id === id);
  const { auth, kv, fs, ai } = usePuterStore();
  const { i18n, t } = useTranslation();
  
  // Получаем переведенные данные вакансии
  const getTranslatedJob = useMemo(() => {
    if (!job) return null;
    
    const language = i18n.language || "en";
    try {
      const translationKey = `jobs.jobData.${job.id}`;
      const jobData = t(translationKey, { returnObjects: true }) as any;
      
      // Проверяем, что jobData это объект и содержит title (не строка с ключом перевода)
      if (
        jobData && 
        typeof jobData === "object" && 
        !Array.isArray(jobData) && 
        jobData.title && 
        typeof jobData.title === "string" &&
        jobData.title !== translationKey &&
        !jobData.title.startsWith("jobs.jobData.")
      ) {
        return {
          ...job,
          title: jobData.title || job.title,
          description: jobData.description || job.description,
          requirements: Array.isArray(jobData.requirements) ? jobData.requirements : job.requirements,
          niceToHave: Array.isArray(jobData.niceToHave) ? jobData.niceToHave : job.niceToHave,
        };
      } else {
        console.warn(`Translation not found for ${translationKey}, using default job data`);
      }
    } catch (error) {
      console.warn("Error getting translated job data, using default:", error);
    }
    
    return job;
  }, [job, i18n.language, t]);
  
  const translatedJob = getTranslatedJob;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JobMatchAnalysisResult | null>(null);
  const [savedResumes, setSavedResumes] = useState<StoredNewResume[]>([]);
  const [selectedSource, setSelectedSource] = useState<"upload" | "saved">(
    "upload"
  );
  const [selectedStorageKey, setSelectedStorageKey] = useState<string | null>(
    null
  );
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    const loadSavedResumes = async () => {
      if (!auth.isAuthenticated) return;

      setLoadingSaved(true);
      try {
        const items = (await kv.list("resume:*", true)) as KVItem[];
        const newResumes: StoredNewResume[] = [];

        items?.forEach((item) => {
          try {
            const parsed = JSON.parse(item.value);
            if (isNewResume(parsed)) {
              newResumes.push({ ...parsed, storageKey: item.key });
            }
          } catch (e) {
            console.error("Error parsing saved resume:", e);
          }
        });

        setSavedResumes(newResumes);
      } catch (e) {
        console.error("Error loading saved resumes:", e);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedResumes();
  }, [auth.isAuthenticated, kv]);

  if (!job || !translatedJob) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <section className="main-section py-12">
          <p className="text-lg text-gray-700">{t("jobs.notFound")}</p>
          <Link to="/jobs" className="mt-4 inline-block text-primary-600">
            {t("jobs.backToJobList")}
          </Link>
        </section>
      </main>
    );
  }

  const handleAnalyzeClick = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setResult(null);

      if (!ai) {
        setError(t("jobs.errors.aiUnavailable"));
        return;
      }

      if (selectedSource === "upload") {
        if (!uploadedFile) {
          setError(t("jobs.errors.noFile"));
          return;
        }

        const uploaded = await fs.upload([uploadedFile]);
        if (!uploaded || !uploaded.path) {
          setError(t("jobs.errors.uploadFailed"));
          return;
        }

        const language = i18n.language || "en";
        
        // Build job description based on language using translated job data
        const jobTextParts: string[] = [];
        if (language === "en") {
          jobTextParts.push(`Title: ${translatedJob.title}`);
          jobTextParts.push(`Company: ${translatedJob.company}`);
          if (translatedJob.location) jobTextParts.push(`Location: ${translatedJob.location}`);
          if (translatedJob.employmentType) jobTextParts.push(`Type: ${translatedJob.employmentType}`);
          if (translatedJob.salaryRange) jobTextParts.push(`Salary: ${translatedJob.salaryRange}`);
          jobTextParts.push("");
          jobTextParts.push("Job Description:");
          jobTextParts.push(translatedJob.description);
          jobTextParts.push("");
          jobTextParts.push("Required Qualifications:");
          translatedJob.requirements.forEach((req: string) => jobTextParts.push(`- ${req}`));
          if (translatedJob.niceToHave && translatedJob.niceToHave.length > 0) {
            jobTextParts.push("");
            jobTextParts.push("Nice to Have:");
            translatedJob.niceToHave.forEach((item: string) => jobTextParts.push(`- ${item}`));
          }
        } else if (language === "tj") {
          jobTextParts.push(`Ном: ${translatedJob.title}`);
          jobTextParts.push(`Ширкат: ${translatedJob.company}`);
          if (translatedJob.location) jobTextParts.push(`Ҷойгиршавӣ: ${translatedJob.location}`);
          if (translatedJob.employmentType) jobTextParts.push(`Намуд: ${translatedJob.employmentType}`);
          if (translatedJob.salaryRange) jobTextParts.push(`Маош: ${translatedJob.salaryRange}`);
          jobTextParts.push("");
          jobTextParts.push("Тавсифи вакансия:");
          jobTextParts.push(translatedJob.description);
          jobTextParts.push("");
          jobTextParts.push("Талаботи зарурӣ:");
          translatedJob.requirements.forEach((req: string) => jobTextParts.push(`- ${req}`));
          if (translatedJob.niceToHave && translatedJob.niceToHave.length > 0) {
            jobTextParts.push("");
            jobTextParts.push("Хуб мешавад:");
            translatedJob.niceToHave.forEach((item: string) => jobTextParts.push(`- ${item}`));
          }
        } else {
          // Russian (default)
          jobTextParts.push(`Название: ${translatedJob.title}`);
          jobTextParts.push(`Компания: ${translatedJob.company}`);
          if (translatedJob.location) jobTextParts.push(`Локация: ${translatedJob.location}`);
          if (translatedJob.employmentType) jobTextParts.push(`Формат: ${translatedJob.employmentType}`);
          if (translatedJob.salaryRange) jobTextParts.push(`Зарплата: ${translatedJob.salaryRange}`);
          jobTextParts.push("");
          jobTextParts.push("Описание вакансии:");
          jobTextParts.push(translatedJob.description);
          jobTextParts.push("");
          jobTextParts.push("Обязательные требования:");
          translatedJob.requirements.forEach((req: string) => jobTextParts.push(`- ${req}`));
          if (translatedJob.niceToHave && translatedJob.niceToHave.length > 0) {
            jobTextParts.push("");
            jobTextParts.push("Будет плюсом:");
            translatedJob.niceToHave.forEach((item: string) => jobTextParts.push(`- ${item}`));
          }
        }
        const jobDescription = jobTextParts.join("\n");

        // Build prompt based on language
        let instructions = "";
        if (language === "en") {
          instructions = `
You are a professional career consultant and HR specialist for IT job positions.

You have been provided with a PDF file containing a candidate's resume (RESUME_FILE) and a job description text (JOB_DESCRIPTION).

JOB_DESCRIPTION:
"""
${jobDescription}
"""

Task:
1. Carefully read the resume from the file and match it against the job posting.
2. Assess how well the resume fits this specific job position.
3. Highlight the candidate's strengths relative to the requirements.
4. Identify key gaps and risks.
5. Provide specific recommendations on how to improve the resume specifically for this job.

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
- Focus on the actual text of the job posting and resume from the file.
`;
        } else if (language === "tj") {
          instructions = `
Шумо консультанти касбии касбӣ ва мутахассиси HR барои вакансияҳои IT ҳастед.

Ба шумо файли PDF бо резюмеи номзад (RESUME_FILE) ва матни тавсифи вакансия (JOB_DESCRIPTION) дода шудааст.

JOB_DESCRIPTION:
"""
${jobDescription}
"""

Вазифа:
1. Резюмеро аз файл бо эҳтиёт хонда ва онро бо вакансия муқоиса кунед.
2. Арзёбӣ кунед, ки резюме ба ин вакансияи мушаххас чӣ қадар мутобиқ аст.
3. Қувваҳои номзадро нисбат ба талабот барҷаста кунед.
4. Фосилаҳо ва хатарҳои асосиро муайян кунед.
5. Тавсияҳои мушаххас диҳед, ки чӣ тавр резюмеро барои ин вакансия беҳтар кардан мумкин аст.

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
- Ба матни воқеии вакансия ва резюме аз файл диққат диҳед.
`;
        } else {
          // Russian (default)
          instructions = `
Ты — профессиональный карьерный консультант и HR-специалист по IT-вакансиям.

Тебе передан PDF-файл с резюме кандидата (RESUME_FILE) и текст вакансии (JOB_DESCRIPTION).

JOB_DESCRIPTION:
"""
${jobDescription}
"""

Задача:
1. Внимательно прочитать резюме из файла и сопоставить его с вакансией.
2. Оценить, насколько резюме подходит под эту конкретную вакансию.
3. Выделить сильные стороны кандидата относительно требований.
4. Выявить ключевые пробелы и риски.
5. Дать конкретные рекомендации, как улучшить резюме именно под эту вакансию.

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
- Фокусируйся на реальном тексте вакансии и резюме из файла.
`;
        }

        const response = await ai.feedback(uploaded.path, instructions);

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
          throw new Error(t("jobs.errors.analysisFailed"));
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

        try {
          const analysis = JSON.parse(cleanedText) as JobMatchAnalysisResult;
          setResult(analysis);
        } catch (parseError) {
          console.error("Error parsing AI response:", parseError);
          console.error("Cleaned text:", cleanedText);
          throw new Error("Failed to parse AI response. The response may not be valid JSON.");
        }
      } else {
        if (!selectedStorageKey) {
          setError(t("jobs.errors.noResumeSelected"));
          return;
        }

        const selected = savedResumes.find(
          (r) => r.storageKey === selectedStorageKey
        );

        if (!selected) {
          setError(t("jobs.errors.resumeNotFound"));
          return;
        }

        if (!translatedJob) {
          setError(t("jobs.errors.analysisFailed"));
          return;
        }

        console.log("Analyzing resume against job:", {
          jobId: translatedJob.id,
          jobTitle: translatedJob.title,
          language: i18n.language || "en",
          resumeId: selected.id || "unknown"
        });
        
        const analysis = await analyzeResumeAgainstJob(translatedJob, selected, i18n.language || "en");
        setResult(analysis);
      }
    } catch (e) {
      console.error("Error in handleAnalyzeClick:", e);
      
      let errorMessage = t("jobs.errors.analysisFailed");
      
      if (e instanceof Error) {
        // Специальная обработка ошибки лимита использования AI
        if (e.message === "AI_USAGE_LIMIT_EXCEEDED" || 
            e.message.includes("usage-limited") || 
            e.message.includes("Error 400")) {
          errorMessage = t("jobs.errors.usageLimitExceeded");
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />
      <section className="main-section py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="mb-4 sm:mb-6 text-sm">
          <Link to="/jobs" className="text-primary-600 hover:underline inline-flex items-center gap-1">
            <span>←</span>
            <span>{t("jobs.backToJobs")}</span>
          </Link>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          <article className="rounded-2xl bg-white/90 p-4 sm:p-6 shadow-sm">
            <h1 className="text-base sm:text-lg font-semibold leading-tight">{translatedJob.title}</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-700">{translatedJob.company}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              {translatedJob.location && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {translatedJob.location}
                </span>
              )}
              {translatedJob.employmentType && (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  {translatedJob.employmentType}
                </span>
              )}
              {translatedJob.salaryRange && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {translatedJob.salaryRange}
                </span>
              )}
            </div>

            <section className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
              <div>
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  {t("jobs.sections.description")}
                </h2>
                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">{translatedJob.description}</p>
              </div>

              <div>
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  {t("jobs.sections.requirements")}
                </h2>
                <ul className="list-disc space-y-1.5 sm:space-y-2 pl-4 sm:pl-5 text-xs sm:text-sm text-gray-800">
                  {translatedJob.requirements.map((req: string, index: number) => (
                    <li key={`req-${index}`} className="leading-relaxed">{req}</li>
                  ))}
                </ul>
              </div>

              {translatedJob.niceToHave && translatedJob.niceToHave.length > 0 && (
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t("jobs.sections.niceToHave")}
                  </h2>
                  <ul className="list-disc space-y-1.5 sm:space-y-2 pl-4 sm:pl-5 text-xs sm:text-sm text-gray-800">
                    {translatedJob.niceToHave.map((item: string, index: number) => (
                      <li key={`nice-${index}`} className="leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </article>

          <aside className="space-y-4 sm:space-y-6">
            <div className="relative rounded-2xl bg-white/90 p-4 sm:p-6 shadow-sm">
              {isAnalyzing && (
                <>
                  <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-white/50 z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs sm:text-sm font-medium text-gray-700">
                        {t("jobs.analyzing")}
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className={isAnalyzing ? "opacity-30 pointer-events-none" : ""}>
                <h2 className="text-sm sm:text-base font-semibold">{t("jobs.workWithResume")}</h2>
                <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {t("jobs.workWithResumeDescription")}
                </p>

                <div className="mt-4 rounded-2xl bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
                  <p className="font-semibold mb-2.5 sm:mb-3 text-xs sm:text-sm">{t("jobs.resumeSource")}</p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedSource("upload")}
                      className={`px-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium transition w-full ${
                        selectedSource === "upload"
                          ? "border-primary-500 bg-white text-primary-700 shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-white"
                      }`}
                    >
                      {t("jobs.uploadPDF")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSource("saved")}
                      className={`px-4 py-2.5 rounded-full border text-xs sm:text-sm font-medium transition w-full ${
                        selectedSource === "saved"
                          ? "border-primary-500 bg-white text-primary-700 shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-white"
                      }`}
                    >
                      {t("jobs.fromSaved")}
                    </button>
                  </div>
                </div>

                {selectedSource === "upload" && (
                  <div className="mt-3 sm:mt-4 space-y-2">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {t("jobs.uploadPDFDescription")}
                    </p>
                    <FileUploader onFileSelect={setUploadedFile} />
                  </div>
                )}

                {selectedSource === "saved" && (
                  <div className="mt-3 sm:mt-4 space-y-2">
                    {loadingSaved ? (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {t("jobs.loadingSaved")}
                      </p>
                    ) : savedResumes.length === 0 ? (
                      <p className="text-xs sm:text-sm text-amber-600 leading-relaxed">
                        {t("jobs.noSavedResumes")}
                      </p>
                    ) : (
                      <>
                        <label
                          htmlFor="saved-resume-select"
                          className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5"
                        >
                          {t("jobs.selectResume")}
                        </label>
                        <select
                          id="saved-resume-select"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={selectedStorageKey || ""}
                          onChange={(e) =>
                            setSelectedStorageKey(
                              e.target.value || null
                            )
                          }
                        >
                          <option value="">{t("jobs.notSelected")}</option>
                          {savedResumes.map((resume) => (
                            <option key={resume.storageKey} value={resume.storageKey}>
                              {resume.fullName || "Без имени"} — {resume.title}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                )}

                <div className="mt-4 sm:mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={handleAnalyzeClick}
                    className="primary-button disabled:opacity-60 disabled:cursor-not-allowed w-full text-sm sm:text-base py-2.5 sm:py-3"
                    disabled={isAnalyzing}
                  >
                    {t("jobs.assessChances")}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-xs sm:text-sm text-red-600 leading-relaxed">
                    {error}
                  </p>
                )}
              </div>
            </div>

            {result && !isAnalyzing && (
              <div className="rounded-2xl bg-white/95 p-4 sm:p-6 lg:p-8 shadow-md">
                <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center scale-90 sm:scale-100">
                    <ScoreCircle score={result.overallScore} size={140} />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      {t("jobs.matchScore")}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-700 max-w-md leading-relaxed px-2">
                      {result.verdict}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-2.5 text-xs">
                  <MetricCard
                    label={t("jobs.overallMatch")}
                    value={result.overallScore}
                  />
                  <MetricCard
                    label={t("jobs.hardSkills")}
                    value={result.matchingSummary.hardSkillsScore}
                  />
                  <MetricCard
                    label={t("jobs.softSkills")}
                    value={result.matchingSummary.softSkillsScore}
                  />
                  <MetricCard
                    label={t("jobs.experience")}
                    value={result.matchingSummary.experienceRelevanceScore}
                  />
                  <MetricCard
                    label={t("jobs.structure")}
                    value={result.matchingSummary.structureClarityScore}
                  />
                </div>

                {result.criticalGaps.length > 0 && (
                  <div className="mt-4 sm:mt-6 rounded-xl border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100/50 p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-red-700 mb-2.5 sm:mb-3 flex items-center gap-1.5">
                      <span className="text-red-600">⚠️</span>
                      {t("jobs.criticalGaps")}
                    </h3>
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-red-800">
                      {result.criticalGaps.map((gap) => (
                        <li key={gap} className="flex items-start gap-1.5">
                          <span className="text-red-600 mt-0.5 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  <SuggestionBlock
                    title={t("jobs.summary")}
                    items={result.improvementSuggestions.summary}
                    type="warning"
                  />
                  <SuggestionBlock
                    title={t("jobs.experience")}
                    items={result.improvementSuggestions.experience}
                    type="info"
                  />
                  <SuggestionBlock
                    title={t("jobs.skills")}
                    items={result.improvementSuggestions.skills}
                    type="info"
                  />
                  <SuggestionBlock
                    title={t("jobs.extra")}
                    items={result.improvementSuggestions.extra}
                    type="success"
                  />
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

type StoredNewResume = ResumeData & { storageKey: string };

function isNewResume(resume: any): resume is ResumeData {
  return resume && typeof resume === "object" && resume.title !== undefined && resume.about !== undefined;
}

interface MetricCardProps {
  label: string;
  value: number;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-2 sm:px-2.5 py-2 sm:py-2.5 space-y-1 sm:space-y-1.5">
      <p className="text-[0.65rem] sm:text-[0.7rem] font-medium text-gray-600">{label}</p>
      <ScoreBar value={value} />
      <p className="text-[0.65rem] sm:text-[0.7rem] font-semibold text-gray-900">
        {Math.round(value)}%
      </p>
    </div>
  );
}

interface SuggestionBlockProps {
  title: string;
  items: string[];
  type?: "warning" | "info" | "success";
}

function SuggestionBlock({ title, items, type = "info" }: SuggestionBlockProps) {
  if (!items || items.length === 0) return null;

  const styles = {
    warning: {
      border: "border-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100/50",
      title: "text-amber-700",
      icon: "💡",
      text: "text-amber-800",
      bullet: "text-amber-600",
    },
    info: {
      border: "border-blue-400",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
      title: "text-blue-700",
      icon: "📝",
      text: "text-blue-800",
      bullet: "text-blue-600",
    },
    success: {
      border: "border-emerald-400",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50",
      title: "text-emerald-700",
      icon: "✨",
      text: "text-emerald-800",
      bullet: "text-emerald-600",
    },
  };

  const style = styles[type];

  return (
    <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-3 sm:p-4`}>
      <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${style.title} mb-2.5 sm:mb-3 flex items-center gap-1.5`}>
        <span>{style.icon}</span>
        {title}
      </h3>
      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
        {items.map((item) => (
          <li key={item} className={`flex items-start gap-1.5 ${style.text}`}>
            <span className={`${style.bullet} mt-0.5 flex-shrink-0`}>•</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


