import { buildContactSegments } from "../utils/contact";

interface ResumeMinimalProps {
  resumeData: ResumeData;
  variant?: "page" | "card";
}

export default function ResumeMinimal({ resumeData, variant = "page" }: ResumeMinimalProps) {
  const contactSegments = buildContactSegments(resumeData);
  const isInteractive = variant === "page";
  const formatDate = (date: string | null) => {
    if (!date) return "По настоящее время";
    const [year, month] = date.split("-");
    return `${month}/${year}`;
  };

  const getLanguageLabel = (level: LanguageLevel) => {
    const labels: Record<LanguageLevel, string> = {
      native: "Родной",
      fluent: "Свободно",
      intermediate: "Средний",
      basic: "Базовый",
    };
    return labels[level];
  };

  return (
    <div className="resume-document resume-minimal">
      {/* Header */}
      <header className="mb-12">
        {resumeData.fullName && (
          <h1 className={`${variant === "card" ? "text-lg" : "text-2xl"} font-semibold text-gray-900 tracking-wide mb-1`}>
            {resumeData.fullName}
          </h1>
        )}
        <p className={`${variant === "card" ? "text-xs" : "text-xl"} font-light text-gray-700 uppercase tracking-widest`}>
          {resumeData.title}
        </p>
        {contactSegments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs text-gray-500 uppercase tracking-widest">
            {contactSegments.map((segment, index) => (
              <div key={`${segment.text}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">•</span>}
                {isInteractive && segment.href ? (
                  <a href={segment.href} className="hover:text-gray-900 transition-colors normal-case break-all">
                    {segment.isBracketed ? `[${segment.text}]` : segment.text}
                  </a>
                ) : (
                  <span className="normal-case">
                    {segment.isBracketed ? `[${segment.text}]` : segment.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {resumeData.about && (
          <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-2xl">
            {resumeData.about}
          </p>
        )}
      </header>

      {/* Experience */}
      {resumeData.experiences && resumeData.experiences.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-normal text-gray-500 uppercase tracking-widest mb-6">
            Опыт работы
          </h2>
          <div className="space-y-8">
            {resumeData.experiences.map((exp) => (
              <div key={exp.id} className="flex gap-8">
                <div className="w-24 text-xs text-gray-400 flex-shrink-0">
                  {formatDate(exp.period.start)} - {formatDate(exp.period.end)}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-normal text-gray-900 mb-1">
                    {exp.position}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{exp.company}</p>
                  {exp.description && (
                    <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-normal text-gray-500 uppercase tracking-widest mb-6">
            Навыки
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {resumeData.skills.map((skill, index) => (
              <span key={index} className="text-sm text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Languages */}
      {resumeData.languages && resumeData.languages.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-normal text-gray-500 uppercase tracking-widest mb-6">
            Языки
          </h2>
          <div className="space-y-2">
            {resumeData.languages.map((lang) => (
              <div key={lang.id} className="flex gap-4 text-sm">
                <span className="text-gray-900 w-32">{lang.name}</span>
                <span className="text-gray-500">
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
          <section className="mb-10">
            <h2 className="text-sm font-normal text-gray-500 uppercase tracking-widest mb-6">
              Рекомендации
            </h2>
            <div className="space-y-4">
              {resumeData.recommendations.map((rec) => (
                <div key={rec.id} className="text-sm">
                  <p className="text-gray-900">{rec.name}</p>
                  <p className="text-gray-500">{rec.position}</p>
                  <p className="text-gray-400 text-xs">{rec.contact}</p>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}

