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
  {
    id: "junior-frontend-react",
    title: "Junior Frontend Developer (React)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$1,500 – $2,500",
    createdAt: "2025-01-15",
    description:
      "We are looking for a motivated Junior Frontend Developer to join our team. This is a great opportunity to grow your skills while working on an innovative AI-powered product.",
    requirements: [
      "6+ months of experience with React or similar frameworks",
      "Basic knowledge of JavaScript/TypeScript",
      "Understanding of HTML, CSS, and responsive design",
      "Willingness to learn and adapt quickly",
      "Good communication skills and team player attitude",
    ],
    niceToHave: [
      "Experience with Git version control",
      "Familiarity with Tailwind CSS",
      "Portfolio or GitHub with personal projects",
    ],
  },
  {
    id: "middle-frontend-react",
    title: "Middle Frontend Developer (React/TypeScript)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$2,500 – $4,000",
    createdAt: "2025-01-12",
    description:
      "We need a Middle Frontend Developer to help us build and maintain our AI-powered resume builder. You'll work with modern React stack and collaborate with a talented team.",
    requirements: [
      "2+ years of experience with React and TypeScript",
      "Experience with state management (Redux, Zustand, or similar)",
      "Knowledge of modern CSS frameworks (Tailwind, styled-components, etc.)",
      "Experience with RESTful APIs and async data handling",
      "Understanding of component architecture and code reusability",
    ],
    niceToHave: [
      "Experience with testing frameworks (Jest, React Testing Library)",
      "Knowledge of Next.js or similar frameworks",
      "Experience with design systems",
    ],
  },
  {
    id: "ui-ux-designer",
    title: "UI/UX Designer",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$2,000 – $4,000",
    createdAt: "2025-01-08",
    description:
      "We are seeking a creative UI/UX Designer to help us create intuitive and beautiful user interfaces for our AI-powered resume builder. You'll work closely with developers and product managers.",
    requirements: [
      "2+ years of experience in UI/UX design",
      "Strong portfolio demonstrating design skills",
      "Proficiency in Figma, Adobe XD, or similar design tools",
      "Understanding of user-centered design principles",
      "Ability to create wireframes, prototypes, and design systems",
    ],
    niceToHave: [
      "Experience with design systems and component libraries",
      "Basic knowledge of HTML/CSS",
      "Experience with user research and testing",
      "Knowledge of accessibility standards (WCAG)",
    ],
  },
  {
    id: "product-manager",
    title: "Product Manager",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$3,500 – $5,500",
    createdAt: "2025-01-05",
    description:
      "We are looking for an experienced Product Manager to lead product development for our AI-powered resume builder. You'll work with cross-functional teams to define product strategy and roadmap.",
    requirements: [
      "3+ years of experience as a Product Manager",
      "Experience with B2B or SaaS products",
      "Strong analytical and problem-solving skills",
      "Ability to work with technical teams and understand technical constraints",
      "Experience with user research and data-driven decision making",
    ],
    niceToHave: [
      "Experience with AI/ML products",
      "Technical background (engineering, computer science)",
      "Experience with agile methodologies",
      "Knowledge of analytics tools (Google Analytics, Mixpanel, etc.)",
    ],
  },
  {
    id: "junior-backend-node",
    title: "Junior Backend Developer (Node.js)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$1,500 – $2,500",
    createdAt: "2025-01-18",
    description:
      "We are looking for a Junior Backend Developer to join our team. This is an excellent opportunity to learn and grow while working on real-world AI-powered applications.",
    requirements: [
      "6+ months of experience with Node.js or similar backend technologies",
      "Basic understanding of JavaScript/TypeScript",
      "Knowledge of RESTful API principles",
      "Understanding of databases (SQL or NoSQL)",
      "Willingness to learn and work in a team environment",
    ],
    niceToHave: [
      "Experience with Express.js or similar frameworks",
      "Knowledge of authentication and authorization",
      "Familiarity with Git and version control",
    ],
  },
  {
    id: "senior-backend-node",
    title: "Senior Backend Engineer (Node.js)",
    company: "ARBA",
    location: "Remote",
    employmentType: "Full-time",
    salaryRange: "$4,500 – $7,000",
    createdAt: "2025-01-03",
    description:
      "We need a Senior Backend Engineer to lead our backend architecture and help scale our AI-powered resume analysis platform. You'll work on complex technical challenges and mentor junior developers.",
    requirements: [
      "5+ years of experience with Node.js",
      "Deep understanding of backend architecture and design patterns",
      "Experience with microservices and distributed systems",
      "Strong knowledge of databases (PostgreSQL, MongoDB, Redis)",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
    ],
    niceToHave: [
      "Experience with Docker and Kubernetes",
      "Knowledge of message queues (RabbitMQ, Kafka)",
      "Experience with AI/ML integration",
      "Background in system design and scalability",
    ],
  },
];


