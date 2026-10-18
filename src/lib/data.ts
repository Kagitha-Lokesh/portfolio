// Configuration to enable or disable the intro loading animation
export const SHOW_LOADER = true;

export interface Profile {
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  phoneHref: string;
  location: string;
  resumeSummary: string;
  shortLine: string;
  github: string;
  linkedin: string;
  portfolio: string;
  resumePath: string;
  idNo: string;
  department: string;
  validTill: string;
  cgpa: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface SkillElement {
  number: number;
  symbol: string;
  name: string;
  family: "Languages" | "Frontend" | "Backend" | "Databases" | "Tools" | "AI & Concepts";
  projects: string[];
  isBrand: boolean;
  brandColor?: string;
}

export interface SkillGroup {
  name: string;
  skills: SkillElement[];
}

export interface Project {
  id: string;
  index: string;
  title: string;
  kicker: string;
  year: string;
  description: string;
  features: string[];
  tech: string[];
  github?: string;
  demo?: string;
}

export interface Certification {
  id: string;
  index: string;
  title: string;
  issuer: string;
  year?: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  period: string;
  location: string;
  cgpa?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface TimelineItem {
  id: string;
  year: string;
  title: string;
  place: string;
  detail: string;
  type: "education" | "experience";
}

export interface AchievementItem {
  id: string;
  index: string;
  platform: string;
  metricLabel: string;
  caption: string;
  detail: string;
  value: number;
  suffix?: string;
  brandColor: string;
}

export const PROFILE: Profile = {
  name: "Lokesh Kagitha",
  firstName: "Lokesh",
  lastName: "Kagitha",
  role: "Full Stack Developer",
  email: "kagithalokesh8@gmail.com",
  phone: "+91 7032817065",
  phoneHref: "tel:+917032817065",
  location: "Andhra Pradesh, India",
  resumeSummary: "Developing scalable full-stack web applications using React.js, Node.js, Express.js, Firebase, and REST APIs.",
  shortLine: "Building enterprise HRM modules and production-grade applications with modern software engineering practices.",
  github: "https://github.com/Kagitha-Lokesh",
  linkedin: "https://www.linkedin.com/in/lokesh-kagitha/",
  portfolio: "https://lokesh-kagitha-portfolio.vercel.app/",
  resumePath: "/resume.pdf",
  idNo: "LK-2026-FSD",
  department: "CSE (AI & ML)",
  validTill: "2026",
  cgpa: "8.0",
};

// Navigation items matching sections
export const NAV: NavItem[] = [
  { id: "about", label: "About", href: "#about" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "work", label: "Work", href: "#work" },
  { id: "certifications", label: "Certifications", href: "#certifications" },
  { id: "experience", label: "Experience", href: "#experience" },
  { id: "achievements", label: "Achievements", href: "#achievements" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export const EDUCATION: EducationItem[] = [
  {
    id: "edu-1",
    institution: "SRI VASAVI INSTITUTE OF ENGINEERING & TECHNOLOGY",
    degree: "B.Tech in CSE (Artificial Intelligence & Machine Learning)",
    period: "2022 – 2026",
    location: "Pedana, Andhra Pradesh",
    cgpa: "8.0",
  },
  {
    id: "edu-2",
    institution: "Sri Chaitanya Junior College",
    degree: "Intermediate Education",
    period: "2020 – 2022",
    location: "Gudivada, Andhra Pradesh",
  },
  {
    id: "edu-3",
    institution: "Sahayamatha EM High School",
    degree: "Secondary School Education",
    period: "2020",
    location: "Mudinepalli, Andhra Pradesh",
  },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: "exp-1",
    company: "CHARANI INFOTECH PVT LTD",
    role: "Full Stack Developer Intern",
    period: "02 Feb 2026 – 01 May 2026",
    location: "Hyderabad, Telangana",
    bullets: [
      "Developing scalable full-stack web applications using React.js, Node.js, Express.js, Firebase, and REST APIs.",
      "Building enterprise HRM modules including employee management, attendance tracking, payroll, notifications, workflow automation, and role-based access control.",
      "Contributing to a production-grade e-commerce platform by developing responsive UI components, integrating backend APIs, and optimizing application performance.",
    ],
  },
];

export const TIMELINE: TimelineItem[] = [
  {
    id: "tl-1",
    year: "2020",
    title: "Secondary School Education",
    place: "Sahayamatha EM High School · Mudinepalli, Andhra Pradesh",
    detail: "Completed secondary education foundational schooling.",
    type: "education",
  },
  {
    id: "tl-2",
    year: "2020 – 2022",
    title: "Intermediate Education",
    place: "Sri Chaitanya Junior College · Gudivada, Andhra Pradesh",
    detail: "Pre-university intermediate education in Mathematics, Physics, and Chemistry.",
    type: "education",
  },
  {
    id: "tl-3",
    year: "2022 – 2026",
    title: "B.Tech in CSE (AI & ML) — CGPA: 8.0",
    place: "Sri Vasavi Institute of Engineering & Technology · Pedana, Andhra Pradesh",
    detail: "Specialized in Computer Science with Artificial Intelligence & Machine Learning coursework and applied engineering.",
    type: "education",
  },
  {
    id: "tl-4",
    year: "2026",
    title: "Full Stack Developer Intern",
    place: "Charani Infotech Pvt Ltd · Hyderabad, Telangana",
    detail: "Engineered enterprise HRM modules, attendance systems, payroll workflows, and REST APIs with React.js, Node.js, Express, and Firebase.",
    type: "experience",
  },
];

export const SKILL_ELEMENTS: SkillElement[] = [
  { number: 1, symbol: "Js", name: "JavaScript", family: "Languages", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#f7df1e" },
  { number: 2, symbol: "Ht", name: "HTML5", family: "Languages", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#e34f26" },
  { number: 3, symbol: "Cs", name: "CSS3", family: "Languages", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#1572b6" },
  { number: 4, symbol: "Sq", name: "SQL", family: "Languages", projects: ["Attendance System"], isBrand: true, brandColor: "#00758f" },
  { number: 5, symbol: "Jv", name: "Java (Basic)", family: "Languages", projects: ["JavaMentor"], isBrand: true, brandColor: "#5382a1" },
  { number: 6, symbol: "Re", name: "React.js", family: "Frontend", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#61dafb" },
  { number: 7, symbol: "Ui", name: "Responsive UI", family: "Frontend", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: false },
  { number: 8, symbol: "Gs", name: "GSAP", family: "Frontend", projects: ["3D Cinematic Portfolio"], isBrand: true, brandColor: "#88ce02" },
  { number: 9, symbol: "Cv", name: "Canvas", family: "Frontend", projects: ["3D Cinematic Portfolio"], isBrand: false },
  { number: 10, symbol: "Nd", name: "Node.js", family: "Backend", projects: ["JavaMentor", "Attendance System"], isBrand: true, brandColor: "#339933" },
  { number: 11, symbol: "Ex", name: "Express.js", family: "Backend", projects: ["Attendance System"], isBrand: true, brandColor: "#000000" },
  { number: 12, symbol: "Ap", name: "REST APIs", family: "Backend", projects: ["Attendance System", "Charani HRM"], isBrand: false },
  { number: 13, symbol: "My", name: "MySQL", family: "Databases", projects: ["Attendance System"], isBrand: true, brandColor: "#4479a1" },
  { number: 14, symbol: "Fb", name: "Firebase", family: "Databases", projects: ["JavaMentor", "Attendance System"], isBrand: true, brandColor: "#ffca28" },
  { number: 15, symbol: "Gt", name: "Git", family: "Tools", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#f05032" },
  { number: 16, symbol: "Gh", name: "GitHub", family: "Tools", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#181717" },
  { number: 17, symbol: "Vc", name: "VS Code", family: "Tools", projects: ["JavaMentor", "Attendance System", "3D Cinematic Portfolio"], isBrand: true, brandColor: "#007acc" },
  { number: 18, symbol: "Pm", name: "Postman", family: "Tools", projects: ["Attendance System"], isBrand: true, brandColor: "#ff6c37" },
  { number: 19, symbol: "Gp", name: "ChatGPT", family: "AI & Concepts", projects: ["Prompt Engineering & Dev workflows"], isBrand: true, brandColor: "#10a37f" },
  { number: 20, symbol: "Cl", name: "Claude AI", family: "AI & Concepts", projects: ["Prompt Engineering & Code assistance"], isBrand: true, brandColor: "#d97706" },
  { number: 21, symbol: "Ag", name: "Antigravity AI", family: "AI & Concepts", projects: ["Agentic workflows & UI Engineering"], isBrand: true, brandColor: "#4285f4" },
];

export const SKILL_FAMILIES = ["All", "Languages", "Frontend", "Backend", "Databases", "Tools", "AI & Concepts"] as const;

export const PROJECTS: Project[] = [
  {
    id: "javamentor",
    index: "01",
    title: "JavaMentor",
    kicker: "Learning Platform · Full Stack",
    year: "2026",
    tech: ["React.js", "Node.js", "Firebase", "JavaScript"],
    description: "Built an learning platform for Java Full Stack Development with authentication, coding practice, interview preparation, and progress tracking.",
    features: [
      "Secure authentication & interactive coding practice arena",
      "Curated interview preparation modules with real-time tracking",
      "Scalable architecture with responsive UI & offline support",
      "Modular components following modern engineering standards",
    ],
    github: "https://github.com/Kagitha-Lokesh",
  },
  {
    id: "attendance-mgmt",
    index: "02",
    title: "Employee Attendance Management",
    kicker: "Enterprise HRM · REST API",
    year: "2026",
    tech: ["React.js", "Node.js", "Express.js", "Firebase"],
    description: "Developed a full-stack employee attendance management system with secure authentication, attendance tracking, and leave management.",
    features: [
      "Secure authentication, attendance logging & leave approvals",
      "Robust REST APIs with role-based access control",
      "Real-time Firebase database operations & logging",
      "Responsive admin dashboard with enterprise UI paradigms",
    ],
    github: "https://github.com/Kagitha-Lokesh",
  },
  {
    id: "3d-cinematic-portfolio",
    index: "03",
    title: "3D Cinematic Portfolio",
    kicker: "Interactive Canvas · Motion Engine",
    year: "2026",
    tech: ["React.js", "JavaScript", "GSAP", "Canvas"],
    description: "Developed a cinematic portfolio featuring scroll-driven animations, a custom frame-based rendering engine, and responsive desktop/mobile experiences.",
    features: [
      "Scroll-driven cinematic visual sequences & fluid motion",
      "Custom frame-based rendering engine on HTML5 Canvas",
      "Optimized canvas rendering & lightweight state engine",
      "Responsive desktop and mobile interactive architecture",
    ],
    github: "https://github.com/Kagitha-Lokesh",
  },
];

export const CERTIFICATIONS: Certification[] = [
  {
    id: "cert-1",
    index: "01",
    title: "Java Full Stack Development Certification",
    issuer: "BISTS Technologies",
    year: "2026",
  },
  {
    id: "cert-2",
    index: "02",
    title: "Java Full Stack Developer Internship Certification",
    issuer: "CHARANI INFOTECH PVT LTD",
    year: "2026",
  },
];

export const ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "ach-1",
    index: "01 / 05",
    platform: "Degree Honors",
    metricLabel: "B.Tech Cumulative GPA",
    caption: "SRI VASAVI INSTITUTE OF ENG & TECH",
    detail: "CSE with specialization in Artificial Intelligence & Machine Learning",
    value: 8,
    suffix: ".0 CGPA",
    brandColor: "#0d0d0d",
  },
  {
    id: "ach-2",
    index: "02 / 05",
    platform: "Full Stack Projects",
    metricLabel: "Production Grade Apps",
    caption: "COMPLETED ARCHITECTURES",
    detail: "JavaMentor, Attendance Management System & 3D Cinematic Portfolio",
    value: 3,
    suffix: " Built",
    brandColor: "#61dafb",
  },
  {
    id: "ach-3",
    index: "03 / 05",
    platform: "Industry Certifications",
    metricLabel: "Verified Credentials",
    caption: "BISTS & CHARANI INFOTECH",
    detail: "Java Full Stack Development & Developer Internship Certifications",
    value: 2,
    suffix: " Awarded",
    brandColor: "#f7df1e",
  },
  {
    id: "ach-4",
    index: "04 / 05",
    platform: "Industry Experience",
    metricLabel: "Enterprise Internship",
    caption: "CHARANI INFOTECH PVT LTD",
    detail: "HRM modules, role-based access, attendance & e-commerce platform APIs",
    value: 1,
    suffix: " Internship",
    brandColor: "#339933",
  },
  {
    id: "ach-5",
    index: "05 / 05",
    platform: "Graduation Year",
    metricLabel: "Target Completion",
    caption: "CLASS OF 2026",
    detail: "Ready for immediate high-impact Full Stack & Software Engineering roles",
    value: 2026,
    suffix: "",
    brandColor: "#0d0d0d",
  },
];
