import { buildContactSegments } from "../utils/contact";
import { useTranslation } from "react-i18next";

interface ResumeModernProps {
  resumeData: ResumeData;
  variant?: "page" | "card";
}

export default function ResumeModern({ resumeData, variant = "page" }: ResumeModernProps) {
  const { t } = useTranslation();
  const contactSegments = buildContactSegments(resumeData);
  const isInteractive = variant === "page";
  const formatDate = (date: string | null) => {
    if (!date) return t("wizard.experience.presentTime");
    const [year, month] = date.split("-");
    return `${month}/${year}`;
  };

  const getLanguageLabel = (level: LanguageLevel) => {
    return t(`wizard.languages.levels.${level}`);
  };

  return (
    <div className="resume-document resume-modern">
      {/* Header */}
      <header className="mb-8 pb-6 border-b-2 border-gray-300">
        {resumeData.fullName && (
          <h1 className={`${variant === "card" ? "text-xl" : "text-2xl"} font-bold text-gray-900 tracking-wide mb-1`}>
            {resumeData.fullName}
          </h1>
        )}
        <p className={`${variant === "card" ? "text-sm" : "text-2xl"} font-semibold text-gray-700 uppercase tracking-wide`}>
          {resumeData.title}
        </p>
        {contactSegments.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-y-2 text-sm uppercase tracking-wide text-gray-600">
            {contactSegments.map((segment, index) => (
              <div key={`${segment.text}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">•</span>}
                {isInteractive && segment.href ? (
                  <a
                    href={segment.href}
                    className="hover:text-blue-600 transition-colors break-all"
                  >
                    {segment.isBracketed ? `[${segment.text}]` : segment.text}
                  </a>
                ) : (
                  <span className="break-all">
                    {segment.isBracketed ? `[${segment.text}]` : segment.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {resumeData.about && (
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">
            {resumeData.about}
          </p>
        )}
      </header>

      {/* Experience */}
      {resumeData.experiences && resumeData.experiences.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            {t("wizard.experience.title")}
          </h2>
          <div className="space-y-6">
            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="pl-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {exp.position}
                    </h3>
                    <p className="text-lg text-gray-600">{exp.company}</p>
                  </div>
                  <span className="text-gray-500 text-sm whitespace-nowrap">
                    {formatDate(exp.period.start)} -{" "}
                    {formatDate(exp.period.end)}
                  </span>
                </div>
                {exp.description && (
                  <div className="text-gray-700 whitespace-pre-line mt-2">
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            {t("wizard.skills.title")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {resumeData.languages && resumeData.languages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            {t("wizard.languages.title")}
          </h2>
          <div className="space-y-2">
            {resumeData.languages.map((lang) => (
              <div key={lang.id} className="flex justify-between">
                <span className="font-medium">{lang.name}</span>
                <span className="text-gray-600">
                  {getLanguageLabel(lang.level)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {resumeData.recommendations &&
        resumeData.recommendations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              {t("wizard.recommendations.title")}
            </h2>
            <div className="space-y-4">
              {resumeData.recommendations.map((rec) => (
                <div key={rec.id} className="pl-4 border-l-4 border-green-500">
                  <p className="font-semibold text-gray-900">{rec.name}</p>
                  <p className="text-gray-600">{rec.position}</p>
                  <p className="text-sm text-gray-500">{rec.contact}</p>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}

