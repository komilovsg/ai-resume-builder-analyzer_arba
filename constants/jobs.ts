export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  employmentType?: string;
  description: string;
  requirements: string[];
  niceToHave?: string[];
  salaryRange?: string;
  createdAt?: string;
}

export const jobs: Job[] = [
  {
    id: "senior-frontend-react",
    title: "Senior Frontend Engineer (React/TypeScript)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$4,000 – $6,000",
    createdAt: "2025-01-01",
    description:
      "We are building an AI-powered resume builder and ATS analyzer and are looking for a Senior Frontend Engineer who is passionate about great UX, clean architecture and modern React tooling.",
    requirements: [
      "3+ years of experience with React and TypeScript",
      "Strong understanding of modern frontend architecture and state management",
      "Experience with Tailwind CSS or similar utility-first CSS frameworks",
      "Ability to design and implement reusable UI components",
      "Experience with API integration and working with async data",
    ],
    niceToHave: [
      "Experience with AI/LLM-powered products",
      "Experience with design systems and component libraries",
      "Background in UX/UI or close collaboration with designers",
    ],
  },
  {
    id: "middle-backend-node",
    title: "Backend Engineer (Node.js)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$3,000 – $5,000",
    createdAt: "2025-01-10",
    description:
      "We are looking for a Backend Engineer to help us scale AI-resume analysis, integrate external services and build a reliable API for our frontend.",
    requirements: [
      "2+ years of experience with Node.js",
      "Experience with RESTful API design",
      "Solid understanding of relational or NoSQL databases",
      "Knowledge of authentication and authorization principles",
    ],
    niceToHave: [
      "Experience with serverless architectures",
      "Experience with AI/ML related APIs",
    ],
  },
];


