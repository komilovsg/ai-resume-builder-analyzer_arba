import type { Route } from "./+types/jobs";
import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { jobs } from "../../constants/jobs";

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
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />
      <section className="main-section py-12">
        <div className="page-heading page-heading--compact mb-8">
          <h1 className="text-[2.5rem] leading-tight">Вакансии</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-xl">
            Выберите вакансию, чтобы ознакомиться с требованиями и оценить свои
            шансы с текущим резюме.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold line-clamp-2">
                    {job.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">{job.company}</p>
                </div>
                {job.location && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {job.location}
                  </span>
                )}
              </div>

              {job.employmentType && (
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary-600">
                  {job.employmentType}
                </p>
              )}

              <p className="mt-3 line-clamp-3 text-sm text-gray-700">
                {job.description}
              </p>

              {job.salaryRange && (
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  {job.salaryRange}
                </p>
              )}

              <p className="mt-4 text-sm font-medium text-primary-600">
                Открыть вакансию →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}


