import type { Route } from "./+types/job";
import { useParams, Link } from "react-router";
import { useEffect, useState } from "react";
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
  const { i18n } = useTranslation();
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

  if (!job) {
    return (
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <section className="main-section py-12">
          <p className="text-lg text-gray-700">Вакансия не найдена.</p>
          <Link to="/jobs" className="mt-4 inline-block text-primary-600">
            Вернуться к списку вакансий
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
        setError("AI сервис недоступен. Попробуйте позже.");
        return;
      }

      if (selectedSource === "upload") {
        if (!uploadedFile) {
          setError("Сначала загрузите PDF-файл резюме, чтобы мы могли его оценить.");
          return;
        }

        const uploaded = await fs.upload([uploadedFile]);
        if (!uploaded || !uploaded.path) {
          setError("Не удалось загрузить файл резюме. Попробуйте ещё раз.");
          return;
        }

        const jobTextParts: string[] = [];
        jobTextParts.push(`Название: ${job.title}`);
        jobTextParts.push(`Компания: ${job.company}`);
        if (job.location) jobTextParts.push(`Локация: ${job.location}`);
        if (job.employmentType)
          jobTextParts.push(`Формат: ${job.employmentType}`);
        if (job.salaryRange)
          jobTextParts.push(`Зарплата: ${job.salaryRange}`);
        jobTextParts.push("");
        jobTextParts.push("Описание вакансии:");
        jobTextParts.push(job.description);
        jobTextParts.push("");
        jobTextParts.push("Обязательные требования:");
        job.requirements.forEach((req) => jobTextParts.push(`- ${req}`));
        if (job.niceToHave && job.niceToHave.length > 0) {
          jobTextParts.push("");
          jobTextParts.push("Будет плюсом:");
          job.niceToHave.forEach((item) => jobTextParts.push(`- ${item}`));
        }
        const jobDescription = jobTextParts.join("\n");

        const language = i18n.language || "en";
        const instructions = `
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

Отвечай на языке интерфейса пользователя: ${language}.

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

        const response = await ai.feedback(uploaded.path, instructions);

        if (!response || !response.message) {
          throw new Error("AI не вернул ответ");
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

        const analysis = JSON.parse(cleanedText) as JobMatchAnalysisResult;
        setResult(analysis);
      } else {
        if (!selectedStorageKey) {
          setError(
            "Выберите резюме из списка созданных, чтобы запустить анализ."
          );
          return;
        }

        const selected = savedResumes.find(
          (r) => r.storageKey === selectedStorageKey
        );

        if (!selected) {
          setError(
            "Не удалось найти выбранное резюме. Попробуйте выбрать другое."
          );
          return;
        }

        const analysis = await analyzeResumeAgainstJob(job, selected);
        setResult(analysis);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось выполнить анализ. Попробуйте ещё раз."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />
      <section className="main-section py-12">
        <div className="mb-6 text-sm">
          <Link to="/jobs" className="text-primary-600 hover:underline">
            ← Ко всем вакансиям
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
          <article className="rounded-2xl bg-white/90 p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="mt-1 text-gray-700">{job.company}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              {job.location && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {job.location}
                </span>
              )}
              {job.employmentType && (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  {job.employmentType}
                </span>
              )}
              {job.salaryRange && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {job.salaryRange}
                </span>
              )}
            </div>

            <section className="mt-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Описание
                </h2>
                <p className="mt-2 text-sm text-gray-800">{job.description}</p>
              </div>

              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Обязательные требования
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
                  {job.requirements.map((req: string) => (
                    <li key={req}>{req}</li>
                  ))}
                </ul>
              </div>

              {job.niceToHave && job.niceToHave.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Будет плюсом
                  </h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
                    {job.niceToHave.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </article>

          <aside className="space-y-4">
            <div className="relative rounded-2xl bg-white/90 p-6 shadow-sm">
              {isAnalyzing && (
                <>
                  <div className="absolute inset-0 rounded-2xl backdrop-blur-sm bg-white/50 z-10" />
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-medium text-gray-700">
                        Анализируем шансы по этой вакансии...
                      </p>
                    </div>
                  </div>
                </>
              )}
              <div className={isAnalyzing ? "opacity-30 pointer-events-none" : ""}>
                <h2 className="text-lg font-semibold">Работа с резюме</h2>
                <p className="mt-2 text-sm text-gray-700">
                  Вы можете либо создать новое резюме под эту вакансию, либо
                  оценить свои шансы с уже собранным или сохранённым резюме.
                </p>

                <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-xs text-gray-700">
                  <p className="font-semibold mb-2">Откуда взять резюме для анализа?</p>
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setSelectedSource("upload")}
                      className={`px-3 py-2 rounded-full border text-xs font-medium transition w-full ${
                        selectedSource === "upload"
                          ? "border-primary-500 bg-white text-primary-700 shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-white"
                      }`}
                    >
                      Загрузить PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSource("saved")}
                      className={`px-3 py-2 rounded-full border text-xs font-medium transition w-full ${
                        selectedSource === "saved"
                          ? "border-primary-500 bg-white text-primary-700 shadow-sm"
                          : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-white"
                      }`}
                    >
                      Из сохранённых
                    </button>
                  </div>
                </div>

                {selectedSource === "upload" && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-700">
                      Загрузите PDF-файл резюме — мы сравним его с этой вакансией и покажем ваши шансы.
                    </p>
                    <FileUploader onFileSelect={setUploadedFile} />
                  </div>
                )}

                {selectedSource === "saved" && (
                  <div className="mt-3 space-y-2">
                    {loadingSaved ? (
                      <p className="text-xs text-gray-500">
                        Загружаем список ваших резюме...
                      </p>
                    ) : savedResumes.length === 0 ? (
                      <p className="text-xs text-amber-600">
                        Пока нет сохранённых резюме нового формата. Создайте резюме на
                        главной странице и сохраните его.
                      </p>
                    ) : (
                      <>
                        <label
                          htmlFor="saved-resume-select"
                          className="text-xs font-medium text-gray-700"
                        >
                          Выберите резюме:
                        </label>
                        <select
                          id="saved-resume-select"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
                          value={selectedStorageKey || ""}
                          onChange={(e) =>
                            setSelectedStorageKey(
                              e.target.value || null
                            )
                          }
                        >
                          <option value="">— Не выбрано —</option>
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

                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleAnalyzeClick}
                    className="secondary-button w-full justify-center disabled:opacity-60 mt-3"
                    disabled={isAnalyzing}
                  >
                    Оценить мои шансы
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-xs text-red-600">
                    {error}
                  </p>
                )}
              </div>
            </div>

            {result && !isAnalyzing && (
              <div className="rounded-2xl bg-white/95 p-8 shadow-md">
                <div className="flex flex-col items-center text-center gap-4">
                  <ScoreCircle score={result.overallScore} size={140} />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Оценка соответствия
                    </h2>
                    <p className="text-sm text-gray-700 max-w-md">
                      {result.verdict}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                  <MetricCard
                    label="Общий матч"
                    value={result.overallScore}
                  />
                  <MetricCard
                    label="Hard skills"
                    value={result.matchingSummary.hardSkillsScore}
                  />
                  <MetricCard
                    label="Soft skills"
                    value={result.matchingSummary.softSkillsScore}
                  />
                  <MetricCard
                    label="Опыт"
                    value={result.matchingSummary.experienceRelevanceScore}
                  />
                  <MetricCard
                    label="Структура"
                    value={result.matchingSummary.structureClarityScore}
                  />
                </div>

                {result.criticalGaps.length > 0 && (
                  <div className="mt-5 rounded-xl border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100/50 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-red-700 mb-3 flex items-center gap-2">
                      <span className="text-red-600">⚠️</span>
                      Критические пробелы
                    </h3>
                    <ul className="space-y-2 text-xs text-red-800">
                      {result.criticalGaps.map((gap) => (
                        <li key={gap} className="flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <SuggestionBlock
                    title="Summary / О себе"
                    items={result.improvementSuggestions.summary}
                    type="warning"
                  />
                  <SuggestionBlock
                    title="Опыт"
                    items={result.improvementSuggestions.experience}
                    type="info"
                  />
                  <SuggestionBlock
                    title="Навыки"
                    items={result.improvementSuggestions.skills}
                    type="info"
                  />
                  <SuggestionBlock
                    title="Дополнительно"
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
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
      <p className="text-[0.75rem] font-medium text-gray-600">{label}</p>
      <ScoreBar value={value} />
      <p className="text-xs font-semibold text-gray-900">
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
    <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-4`}>
      <h3 className={`text-sm font-bold uppercase tracking-wide ${style.title} mb-3 flex items-center gap-2`}>
        <span>{style.icon}</span>
        {title}
      </h3>
      <ul className="space-y-2 text-xs">
        {items.map((item) => (
          <li key={item} className={`flex items-start gap-2 ${style.text}`}>
            <span className={`${style.bullet} mt-0.5`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


