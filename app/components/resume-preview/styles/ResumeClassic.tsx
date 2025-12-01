import { buildContactSegments } from "../utils/contact";
import { useTranslation } from "react-i18next";

interface ResumeClassicProps {
  resumeData: ResumeData;
  variant?: "page" | "card";
}

export default function ResumeClassic({ resumeData, variant = "page" }: ResumeClassicProps) {
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
    <div className="resume-document resume-classic">
      {/* Header */}
      <header className="mb-8 text-center">
        {resumeData.fullName && (
          <h1 className={`${variant === "card" ? "text-xl" : "text-5xl"} font-bold text-gray-900 mb-2 uppercase tracking-wide`}>
            {resumeData.fullName}
          </h1>
        )}
        <p className={`${variant === "card" ? "text-sm" : "text-2xl"} font-semibold text-gray-800 uppercase tracking-[0.4em]`}>
          {resumeData.title}
        </p>
        {contactSegments.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs font-semibold text-gray-700 tracking-wide uppercase">
            {contactSegments.map((segment, index) => (
              <div key={`${segment.text}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">•</span>}
                {isInteractive && segment.href ? (
                  <a href={segment.href} className="hover:text-blue-600 transition-colors">
                    {segment.isBracketed ? `[${segment.text}]` : segment.text}
                  </a>
                ) : (
                  <span>{segment.isBracketed ? `[${segment.text}]` : segment.text}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {resumeData.about && (
          <div className="mt-4 border-t-2 border-b-2 border-gray-900 py-4">
            <p className="text-gray-700 text-base leading-relaxed">
              {resumeData.about}
            </p>
          </div>
        )}
      </header>

      {/* Experience */}
      {resumeData.experiences && resumeData.experiences.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-900 pb-2">
            {t("wizard.experience.title")}
          </h2>
          <div className="space-y-6">
            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 uppercase">
                      {exp.position}
                    </h3>
                    <p className="text-lg text-gray-700 font-semibold">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-gray-600 font-medium">
                    {formatDate(exp.period.start)} - {formatDate(exp.period.end)}
                  </span>
                </div>
                {exp.description && (
                  <div className="text-gray-700 whitespace-pre-line mt-2 pl-4 border-l-2 border-gray-400">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-900 pb-2">
            {t("wizard.skills.title")}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {resumeData.skills.map((skill, index) => (
              <div
                key={index}
                className="text-gray-700 border-b border-gray-300 pb-1"
              >
                • {skill}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {resumeData.languages && resumeData.languages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-900 pb-2">
            {t("wizard.languages.title")}
          </h2>
          <div className="space-y-2">
            {resumeData.languages.map((lang) => (
              <div key={lang.id} className="flex justify-between border-b border-gray-300 pb-1">
                <span className="font-semibold text-gray-900">{lang.name}</span>
                <span className="text-gray-600 italic">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-900 pb-2">
              {t("wizard.recommendations.title")}
            </h2>
            <div className="space-y-4">
              {resumeData.recommendations.map((rec) => (
                <div key={rec.id} className="border-l-4 border-gray-900 pl-4">
                  <p className="font-bold text-gray-900 uppercase">{rec.name}</p>
                  <p className="text-gray-700 font-semibold">{rec.position}</p>
                  <p className="text-sm text-gray-600">{rec.contact}</p>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}

