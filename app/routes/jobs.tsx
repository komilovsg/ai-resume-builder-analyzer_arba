import type { Route } from "./+types/jobs";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../components/Navbar";
import { jobs } from "../../constants/jobs";
import { LuMessageCircleWarning } from "react-icons/lu";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ARBA — Job Listings" },
    {
      name: "description",
      content:
        "Browse open positions and check how well your resume matches each job.",
    },
  ];
}

export default function JobsRoute() {
  const { t } = useTranslation();
  
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />
      <section className="main-section pt-6 sm:pt-8 px-4 sm:px-6">
        <div className="page-heading page-heading--compact flex flex-col gap-4 w-screen -mx-4 sm:-mx-6 px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] leading-tight">{t("jobs.title")}</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 w-full leading-relaxed">
            {t("jobs.description")}
          </p>
        </div>
        </section>
        <section className="main-section px-4 sm:px-6">
          <div className="flex items-center gap-2 mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl w-full">
            <LuMessageCircleWarning size={28} className="flex-shrink-0 text-blue-800" />
            <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
              {t("jobs.languageNote")}
            </p>
          </div>
          </section>
        <section className="main-section py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block rounded-2xl border border-gray-200 bg-white/80 p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold line-clamp-2 leading-tight">
                    {job.title}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-600">{job.company}</p>
                </div>
                {job.location && (
                  <span className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-1 text-[0.65rem] sm:text-xs font-medium text-gray-700 flex-shrink-0">
                    {job.location}
                  </span>
                )}
              </div>

              {job.employmentType && (
                <p className="mt-2.5 sm:mt-3 text-xs font-medium uppercase tracking-wide text-primary-600">
                  {job.employmentType}
                </p>
              )}

              <p className="mt-3 sm:mt-4 line-clamp-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
                {job.description}
              </p>

              {job.salaryRange && (
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-emerald-700">
                  {job.salaryRange}
                </p>
              )}

              <p className="mt-4 sm:mt-5 text-xs sm:text-sm font-medium text-primary-600 flex items-center gap-1">
                <span>{t("jobs.openJob")}</span>
                <span>→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}


