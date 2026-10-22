/**
 * LOKI Offline Intelligence — Natural Response Composer (Phase 3)
 *
 * Transforms deterministic retrieval results from Phase 2 into natural,
 * context-grounded, readable portfolio answers.
 *
 * Guarantees:
 * - Direct answers without repetitive robotic greetings
 * - Purely grounded in verified portfolio data (zero hallucinations)
 * - Transparent boundary handling for unsupported / private topics
 * - Strict adherence to existing [[NAV_ACTION]] protocol for client UI buttons
 * - Zero network calls, zero runtime dependencies, pure deterministic logic
 */

import type { ContactDraft, NavAction, ValidSectionId } from "@/components/agent/types";
import type { ChatMessage } from "./llm";
import {
  RetrievalResult,
  RetrievedFact,
  IntentCategory,
} from "./offline-retrieval";
import { processOfflineContactFlow } from "./offline-contact";
import {
  PROFILE,
  PROJECTS,
  EXPERIENCE,
  EDUCATION,
  CERTIFICATIONS,
  ACHIEVEMENTS,
  FREELANCE,
  Project,
  SkillElement,
  ExperienceItem,
  EducationItem,
} from "../data";

// ---------------------------------------------------------------------------
// 1. Interfaces
// ---------------------------------------------------------------------------

export interface ComposedResponse {
  /** Clean answer text for display or evaluation */
  text: string;
  /** Primary classified intent */
  intent: IntentCategory;
  /** Supported navigation action if relevant to the response */
  navAction?: NavAction | null;
  /** Extracted contact draft if contact flow is complete */
  contactDraft?: ContactDraft | null;
  /** Complete output string including any serialized [[NAV_ACTION]] or [[CONTACT_DRAFT]] marker */
  rawOutput: string;
  /** Clarification text if query was ambiguous */
  clarificationRequest?: string;
  /** Contact flow guidance for Phase 4 integration */
  contactInstruction?: "ask_email" | "ready_to_draft" | "direct_contact_info";
}

// ---------------------------------------------------------------------------
// 2. Navigation Helper
// ---------------------------------------------------------------------------

function formatNavAction(section: ValidSectionId, label: string): string {
  return `\n\n[[NAV_ACTION]]{"section":"${section}","label":"${label}"}`;
}

// ---------------------------------------------------------------------------
// 3. Domain Specific Composers
// ---------------------------------------------------------------------------

function composeGreeting(query: string, history: readonly ChatMessage[] = []): { text: string; navAction?: NavAction } {
  const qLower = query.toLowerCase();

  if (qLower.includes("who are you") || qLower.includes("what can you do") || qLower.includes("help")) {
    return {
      text:
        "I'm LOKI, Lokesh Kagitha's AI assistant. I can answer questions about his software engineering experience, full-stack projects, core technical skills, education, and freelance work, or help you connect with him directly.",
    };
  }

  if (history.length > 0) {
    return {
      text: "Hello again! What else would you like to explore regarding Lokesh's projects, skills, or experience?",
    };
  }

  return {
    text:
      "Hey! I'm LOKI, Lokesh's AI assistant. What would you like to know about his projects, skills, or experience?",
  };
}

function composeContact(): { text: string; navAction: NavAction; contactInstruction: "direct_contact_info" } {
  const text = [
    "You can reach Lokesh Kagitha directly through the following channels:",
    `- **Email**: ${PROFILE.email}`,
    `- **Phone**: ${PROFILE.phone}`,
    `- **Location**: ${PROFILE.location}`,
    `- **LinkedIn**: ${PROFILE.linkedin}`,
    `- **GitHub**: ${PROFILE.github}`,
    "",
    "If you'd like to leave a message right here, tell me your email and what you'd like to discuss, and I can help you send it to him.",
  ].join("\n");

  return {
    text,
    navAction: { section: "contact", label: "Open Contact Form" },
    contactInstruction: "direct_contact_info",
  };
}

function composeUnsupported(reason?: string): { text: string; navAction?: NavAction } {
  if (
    reason &&
    (reason.includes("benchmarks") ||
      reason.includes("revenue") ||
      reason.includes("performance benchmarks") ||
      reason.includes("traffic"))
  ) {
    return {
      text:
        "I don't have that detail in the portfolio information. Details regarding commercial revenue, unpublished traffic analytics, or server performance benchmarks are not part of Lokesh's public portfolio records, which does not include public third-party benchmarks. The portfolio documents verified architecture, engineering highlights, and technology stacks. For specific technical inquiries, please contact Lokesh directly.",
      navAction: { section: "contact", label: "Contact Lokesh Directly" },
    };
  }

  if (
    reason &&
    (reason.includes("Salary") || reason.includes("salary") || reason.includes("compensation"))
  ) {
    return {
      text:
        "Details regarding salary expectations, compensation, or pricing are not part of Lokesh's public portfolio. For compensation or career discussions, please get in touch with Lokesh directly.",
      navAction: { section: "contact", label: "Contact Lokesh Directly" },
    };
  }

  if (reason && reason.includes("private")) {
    return {
      text:
        "Personal private information is not published in Lokesh's portfolio. For professional inquiries, please get in touch with Lokesh directly.",
      navAction: { section: "contact", label: "Contact Lokesh Directly" },
    };
  }

  if (reason && reason.includes("verified portfolio skillset")) {
    return {
      text: `${reason}\n\nLokesh's core expertise is focused on full-stack web and cloud systems using JavaScript, TypeScript, React.js, Node.js, Express.js, Firebase, MySQL, and Python. If you have an inquiry about custom requirements, feel free to contact him.`,
      navAction: { section: "skills", label: "View Verified Skills" },
    };
  }

  return {
    text:
      "That information is not available in Lokesh's verified portfolio records. For specific questions or customized requirements, feel free to contact Lokesh directly.",
    navAction: { section: "contact", label: "Contact Lokesh" },
  };
}

function composeClarification(
  ambiguityReason?: string,
  suggestions: string[] = []
): { text: string; clarificationRequest: string } {
  const suggestionList =
    suggestions.length > 0
      ? suggestions.map((s) => `- ${s}`).join("\n")
      : [
          "- Purnima Kalamkari (Ecommerce Storefront & Admin)",
          "- JavaMentor (Full Stack Platform)",
          "- Employee Attendance Management (Enterprise HRM)",
          "- Charani Infotech (Work Experience)",
        ].join("\n");

  const intro = "Could you please clarify what you would like to explore?";
  const detail = ambiguityReason ? `\n*Note: ${ambiguityReason}*` : "";

  const text = [
    intro,
    detail,
    "",
    "Here are a few areas you can explore:",
    suggestionList,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    text,
    clarificationRequest: text,
  };
}

function composeProjectDetails(fact: RetrievedFact): string {
  if (fact.domain !== "projects" || !fact.data) {
    return "";
  }
  const p = fact.data as unknown as Project;
  if (!p || !Array.isArray(p.tech)) {
    return "";
  }
  const lines: string[] = [
    `### ${p.title} (${p.year})`,
    `*${p.kicker}*`,
    "",
    p.description || "",
    "",
    `**Tech Stack**: ${p.tech.join(", ")}`,
    "",
    "**Key Highlights**:",
    ...(p.features || []).map((f) => `- ${f}`),
  ];

  if (p.demo) {
    lines.push(`\n**Live Demo**: ${p.demo}`);
  }
  if (p.github) {
    lines.push(`**GitHub**: ${p.github}`);
  }

  return lines.join("\n");
}

function composeProjects(
  query: string,
  facts: RetrievedFact[]
): { text: string; navAction: NavAction } {
  const norm = query.toLowerCase();

  // Tech filtering query on projects (e.g. "projects using MySQL", "what projects use Firebase")
  const matchedProjectsByTech = PROJECTS.filter((p) =>
    p.tech.some((t) => norm.includes(t.toLowerCase()))
  );
  if (
    matchedProjectsByTech.length > 0 &&
    !norm.includes("vs") &&
    !norm.includes("compare") &&
    (norm.includes("using") || norm.includes("with") || norm.includes("tech") || norm.includes("project") || norm.includes("built"))
  ) {
    const matchedTechs = Array.from(
      new Set(
        matchedProjectsByTech.flatMap((p) =>
          p.tech.filter((t) => norm.includes(t.toLowerCase()))
        )
      )
    ).join(", ");

    const text = [
      `Projects built using **${matchedTechs}**:`,
      "",
      ...matchedProjectsByTech.map(
        (p) => `- **${p.title}** (${p.year}): ${p.kicker}. Tech: ${p.tech.join(", ")}.\n  ${p.description}`
      ),
    ].join("\n");

    return {
      text,
      navAction: { section: "work", label: "View Projects in Portfolio" },
    };
  }

  // 1. Comparison of two projects
  if (norm.includes("compare")) {
    const projFacts = facts.filter((f) => f.domain === "projects");
    if (projFacts.length >= 2) {
      const p1 = projFacts[0].data as unknown as Project;
      const p2 = projFacts[1].data as unknown as Project;

      const text = [
        `### Comparing ${p1.title} vs. ${p2.title}`,
        "",
        `**1. ${p1.title} (${p1.year})**`,
        `- **Focus**: ${p1.kicker}`,
        `- **Tech**: ${p1.tech.join(", ")}`,
        `- **Architecture**: ${p1.description}`,
        "",
        `**2. ${p2.title} (${p2.year})**`,
        `- **Focus**: ${p2.kicker}`,
        `- **Tech**: ${p2.tech.join(", ")}`,
        `- **Architecture**: ${p2.description}`,
      ].join("\n");

      return {
        text,
        navAction: { section: "work", label: "View Projects in Portfolio" },
      };
    }
  }

  // 2. Best projects question (Evidence-based criteria rather than arbitrary universal ranking)
  if (norm.includes("best") || norm.includes("top project")) {
    const text = [
      "In Lokesh's portfolio, each project is engineered to demonstrate distinct full-stack and architectural criteria rather than an arbitrary universal ranking:",
      "",
      "- **Purnima Kalamkari** (Client Freelance): Commercial e-commerce deployment featuring a mobile-first storefront, JWT-secured admin dashboard, and WhatsApp ordering flow.",
      "- **JavaMentor** (Full-Stack Platform): Educational application with secure authentication, interactive coding practice arena, curated interview preparation, and offline support.",
      "- **Employee Attendance Management** (Enterprise HRM): Scalable role-based access control, secure RESTful APIs, and real-time attendance logging with Firebase.",
    ].join("\n");

    return {
      text,
      navAction: { section: "work", label: "View Projects in Portfolio" },
    };
  }

  // 3. Authentication in projects
  if (norm.includes("authentication") || norm.includes("auth")) {
    const text = [
      "Three of Lokesh's full-stack projects feature authentication systems:",
      "",
      "1. **JavaMentor**: Secure user authentication for student learning accounts and progress tracking.",
      "2. **Employee Attendance Management**: Role-based authentication and secure session management for enterprise HRM.",
      "3. **Purnima Kalamkari**: JWT-secured admin authentication for catalog and order management.",
    ].join("\n");

    return {
      text,
      navAction: { section: "work", label: "View Projects in Portfolio" },
    };
  }

  // 4. E-commerce project query
  if (norm.includes("ecommerce") || norm.includes("e-commerce") || norm.includes("storefront")) {
    const p = PROJECTS.find((proj) => proj.id === "purnima-kalamkari")!;
    const text = [
      `The project that involved e-commerce is **${p.title}** (${p.year}).`,
      "",
      `*${p.kicker}*`,
      "",
      p.description,
      "",
      `**Tech Stack**: ${p.tech.join(", ")}`,
      "",
      "**Key Highlights**:",
      ...p.features.map((f) => `- ${f}`),
    ].join("\n");

    return {
      text,
      navAction: { section: "freelance", label: "View Purnima Kalamkari" },
    };
  }

  // 5. Technologies used in specific projects (e.g. attendance management project)
  if (
    (norm.includes("technology") || norm.includes("technologies") || norm.includes("tech")) &&
    (norm.includes("attendance") || norm.includes("hrm"))
  ) {
    const p = PROJECTS.find((proj) => proj.id === "attendance-mgmt")!;
    const text = [
      `The **${p.title}** project was built using **${p.tech.join(", ")}**.`,
      "",
      p.description,
      "",
      "**Key Highlights**:",
      ...p.features.map((f) => `- ${f}`),
    ].join("\n");

    return {
      text,
      navAction: { section: "work", label: "View Attendance Project" },
    };
  }

  // 6. Utility of JavaMentor
  if (norm.includes("javamentor") && (norm.includes("useful") || norm.includes("why") || norm.includes("feature"))) {
    const p = PROJECTS.find((proj) => proj.id === "javamentor")!;
    const text = [
      `**${p.title}** is useful as a comprehensive learning platform for Java Full Stack Development. Key practical features include:`,
      "",
      ...p.features.map((f) => `- ${f}`),
      "",
      `**Tech Stack**: ${p.tech.join(", ")}`,
    ].join("\n");

    return {
      text,
      navAction: { section: "work", label: "View JavaMentor" },
    };
  }

  // 7. Specific named project
  const projectFact = facts.find(
    (f) => f.domain === "projects" && f.score >= 30 && f.data && "tech" in (f.data as object)
  );
  if (projectFact) {
    return {
      text: composeProjectDetails(projectFact),
      navAction: { section: "work", label: "View Projects in Portfolio" },
    };
  }

  // 8. Project overview list
  const lines = [
    `Lokesh has designed and built ${PROJECTS.length} production-grade full-stack projects:`,
    "",
    ...PROJECTS.map(
      (p) =>
        `- **${p.title}** (${p.year}): ${p.kicker}. Tech: ${p.tech.join(", ")}. ${p.description}`
    ),
  ];

  return {
    text: lines.join("\n"),
    navAction: { section: "work", label: "View Projects in Portfolio" },
  };
}

function composeSkills(
  query: string,
  facts: RetrievedFact[]
): { text: string; navAction: NavAction } {
  const norm = query.toLowerCase();

  // 1. Frontend vs Backend question
  if (
    norm.includes("frontend or backend") ||
    norm.includes("front end or back end") ||
    (norm.includes("frontend") && norm.includes("backend"))
  ) {
    const text = [
      "Lokesh is a **Full Stack Developer** with verified experience spanning both frontend and backend development:",
      "",
      "- **Frontend Engineering**: React.js, JavaScript, HTML5 Canvas, GSAP, Responsive UI, Tailwind CSS.",
      "- **Backend Architecture**: Node.js, Express.js, RESTful APIs, session management.",
      "- **Databases**: MySQL (relational database) and Firebase (NoSQL / Realtime cloud database).",
      "",
      "He builds complete web applications from database schemas and API endpoints to interactive, accessible user interfaces.",
    ].join("\n");

    return {
      text,
      navAction: { section: "skills", label: "View Skills Section" },
    };
  }

  // 2. Programming languages question
  if (
    norm.includes("programming language") ||
    norm.includes("languages") ||
    norm.includes("which language")
  ) {
    const text = [
      "Lokesh's verified programming languages include:",
      "",
      "- **JavaScript**: Primary language for full-stack web engineering (React, Node.js, Canvas, GSAP).",
      "- **SQL**: Relational database querying, joins, and schema management (MySQL).",
      "- **HTML5 & CSS3**: Semantic structure, responsive layouts, and modern CSS.",
      "- **Java (Basic)**: Object-oriented programming principles and foundations.",
      "- **Python (Basic)**: Foundational scripting and data handling.",
    ].join("\n");

    return {
      text,
      navAction: { section: "skills", label: "View Languages" },
    };
  }

  // 3. Database experience question
  if (norm.includes("database") || norm.includes("db experience") || norm.includes("sql experience")) {
    const text = [
      "Yes, Lokesh has verified database experience across two distinct paradigms:",
      "",
      "- **MySQL (Relational Database)**: Schema design, SQL querying, and relational data persistence (utilized in *Purnima Kalamkari*).",
      "- **Firebase (NoSQL / Realtime Database)**: Document storage, real-time logging, and authentication data (utilized in *JavaMentor* and *Employee Attendance Management*).",
    ].join("\n");

    return {
      text,
      navAction: { section: "skills", label: "View Database Skills" },
    };
  }

  // 4. Tools question
  if (norm.includes("tool") || norm.includes("tools")) {
    const text = [
      "Lokesh actively works with the following development tools and platforms:",
      "",
      "- **Git & GitHub**: Distributed version control, branch management, and collaborative development.",
      "- **VS Code**: Primary integrated development environment.",
      "- **Postman**: API development, endpoint testing, and payload validation.",
      "- **Cloudinary**: Cloud asset and media management.",
      "- **Cloudflare**: DNS, edge delivery, and web optimization.",
    ].join("\n");

    return {
      text,
      navAction: { section: "skills", label: "View Tools" },
    };
  }

  // 5. Specific single skill query (e.g. MySQL, React, Firebase)
  const specificSkillFact = facts.find((f) => f.domain === "skills" && f.score >= 25);
  if (specificSkillFact) {
    const s = specificSkillFact.data as unknown as SkillElement;
    const text = [
      `Yes, **${s.name}** is one of Lokesh's verified technical skills in the **${s.family}** category.`,
      "",
      s.projects.length > 0
        ? `He has applied ${s.name} across portfolio projects including: **${s.projects.join(", ")}**.`
        : `He utilizes ${s.name} as part of his core ${s.family} toolchain.`,
    ].join("\n");

    return {
      text,
      navAction: { section: "skills", label: "View Skills Section" },
    };
  }

  // 6. General skills summary grouped by category
  const text = [
    "Here is an overview of Lokesh Kagitha's technical skills and proficiencies:",
    "",
    "- **Languages**: JavaScript, HTML5, CSS3, SQL, Java (Basic)",
    "- **Frontend**: React.js, Responsive UI, GSAP, HTML5 Canvas",
    "- **Backend**: Node.js, Express.js, REST APIs",
    "- **Databases**: MySQL, Firebase",
    "- **Tools & Platforms**: Git, GitHub, VS Code, Postman",
    "- **AI & Applied Engineering**: ChatGPT, Claude AI, Antigravity AI (Dev workflows & Prompt Engineering)",
  ].join("\n");

  return {
    text,
    navAction: { section: "skills", label: "View Interactive Skills" },
  };
}

function composeExperience(): { text: string; navAction: NavAction } {
  const exp = EXPERIENCE[0];
  const text = [
    `### ${exp.role}`,
    `**${exp.company}** · ${exp.location} (${exp.period})`,
    "",
    "**Core Responsibilities & Technical Contributions**:",
    ...exp.bullets.map((b) => `- ${b}`),
  ].join("\n");

  return {
    text,
    navAction: { section: "experience", label: "View Experience Timeline" },
  };
}

function composeEducation(query: string): { text: string; navAction: NavAction } {
  const norm = query.toLowerCase();

  if (norm.includes("cgpa") || norm.includes("gpa") || norm.includes("grade")) {
    const btech = EDUCATION[0];
    const text = `Lokesh completed his **${btech.degree}** from ${btech.institution} with a cumulative **CGPA of ${btech.cgpa} / 10**.`;
    return {
      text,
      navAction: { section: "about", label: "View Education Details" },
    };
  }

  const lines = [
    "Here is Lokesh Kagitha's educational background (he has completed his B.Tech):",
    "",
    ...EDUCATION.map(
      (e) =>
        `- **${e.degree}**\n  ${e.institution} (${e.period}, ${e.location})${e.cgpa ? ` — **CGPA: ${e.cgpa}**` : ""}`
    ),
  ];

  return {
    text: lines.join("\n"),
    navAction: { section: "about", label: "View Education Details" },
  };
}

function composeCertifications(): { text: string; navAction: NavAction } {
  const lines = [
    "Lokesh holds the following verified industry certifications:",
    "",
    ...CERTIFICATIONS.map(
      (c) => `- **${c.title}** — Awarded by ${c.issuer}${c.year ? ` (${c.year})` : ""}`
    ),
  ];

  return {
    text: lines.join("\n"),
    navAction: { section: "certifications", label: "View Certifications" },
  };
}

function composeFreelance(): { text: string; navAction: NavAction } {
  const text = [
    `### Freelance Case Study: ${FREELANCE.client} (${FREELANCE.period})`,
    `*${FREELANCE.role}*`,
    "",
    `**Overview**: ${FREELANCE.overview}`,
    "",
    `**Challenge Solved**: ${FREELANCE.challenge}`,
    "",
    "**What Was Built**:",
    ...FREELANCE.built.flatMap((g) => [
      `*${g.group}*:`,
      ...g.points.map((pt) => `  - ${pt}`),
    ]),
    "",
    `**Tech Stack**: ${FREELANCE.stack.join(", ")}`,
    "",
    `**Live URL**: ${FREELANCE.liveUrl}`,
  ].join("\n");

  return {
    text,
    navAction: { section: "freelance", label: "View Freelance Case Study" },
  };
}

function composeAchievements(): { text: string; navAction: NavAction } {
  const text = [
    "Here are Lokesh Kagitha's key milestones and verified achievements:",
    "",
    ...ACHIEVEMENTS.map(
      (a) =>
        `- **${a.metricLabel}**: ${a.value}${a.suffix || ""} (${a.caption} — ${a.detail})`
    ),
  ].join("\n");

  return {
    text,
    navAction: { section: "about", label: "View Milestones" },
  };
}

function composeProfile(query: string = ""): { text: string; navAction: NavAction } {
  const norm = query.toLowerCase();

  // Career strengths & professional interests
  if (norm.includes("strength") || norm.includes("interest") || norm.includes("goal") || norm.includes("why hire") || norm.includes("career")) {
    const text = [
      "Lokesh's core professional strengths and career interests center on **Full-Stack Web Development** and **Scalable Web Systems**:",
      "",
      "- **Full-Stack Architecture**: End-to-end engineering from relational & NoSQL databases and Express REST APIs to dynamic React frontends.",
      "- **Modern Motion & Interactive UIs**: Crafting responsive, performant user interfaces with React.js, GSAP, and HTML5 Canvas.",
      "- **Algorithmic Foundations**: 500+ LeetCode problems solved demonstrating disciplined problem-solving and clean code practices.",
      "- **Production Delivery**: 100% on-time delivery on commercial freelance projects (e.g. Purnima Kalamkari).",
      "- **Professional Role**: Currently working as an Associate Software Engineer at Charani Infotech Pvt Ltd (Hyderabad).",
    ].join("\n");

    return {
      text,
      navAction: { section: "about", label: "About Lokesh" },
    };
  }

  const text = [
    `**${PROFILE.name}** is a **${PROFILE.role}** based in ${PROFILE.location}.`,
    "",
    `${PROFILE.resumeSummary}`,
    "",
    `- **Current Role**: Associate Software Engineer at Charani Infotech Pvt Ltd (Hyderabad)`,
    `- **Education**: Completed B.Tech in CSE (AI & ML) from Sri Vasavi Institute of Engineering & Technology (CGPA: ${PROFILE.cgpa})`,
    `- **Focus**: ${PROFILE.shortLine}`,
    `- **GitHub**: ${PROFILE.github}`,
    `- **LinkedIn**: ${PROFILE.linkedin}`,
  ].join("\n");

  return {
    text,
    navAction: { section: "about", label: "About Lokesh" },
  };
}

function composeFollowup(
  retrieval: RetrievalResult,
  history: readonly ChatMessage[] = []
): { text: string; navAction?: NavAction; clarificationRequest?: string } {
  const subject = retrieval.resolvedSubject;
  if (!subject) {
    return composeClarification(retrieval.ambiguityReason);
  }

  const norm = retrieval.normalizedQuery.toLowerCase();

  // Honest limitations: unverified benchmarks, metrics, testimonials, or active user numbers
  if (
    norm.includes("benchmark") ||
    norm.includes("performance metric") ||
    norm.includes("testimonial") ||
    norm.includes("how many users") ||
    norm.includes("active users") ||
    norm.includes("revenue")
  ) {
    return {
      text: `I don't have that detail in the portfolio information available to me. The portfolio documents **${subject.title}**'s architecture, feature highlights, and verified tech stack, but does not include public third-party benchmarks or client metrics.`,
      navAction: { section: "work", label: `View ${subject.title}` },
    };
  }

  // 1. Follow-up on a Project
  if (subject.domain === "projects") {
    const projFact = retrieval.facts.find((f) => f.id === subject.id) || retrieval.facts[0];
    if (projFact) {
      // Direct answer if user specifically asks what technologies were used in it
      if (norm.includes("tech") || norm.includes("technology") || norm.includes("technologies") || norm.includes("stack")) {
        const p = projFact.data as unknown as Project;
        return {
          text: `**${p.title}** was built using **${p.tech.join(", ")}**.\n\n${p.description}`,
          navAction: { section: "work", label: `View ${subject.title}` },
        };
      }

      // Deep dive if user asks "Tell me more" or "How does it work?"
      if (norm.includes("tell me more") || norm.includes("how does it work") || norm.includes("how was it built")) {
        const p = projFact.data as unknown as Project;
        const text = [
          `### Deep Dive: ${p.title} (${p.year})`,
          `*${p.kicker}*`,
          "",
          p.description,
          "",
          `**Tech Stack**: ${p.tech.join(", ")}`,
          "",
          "**Core Features & Highlights**:",
          ...p.features.map((f) => `- ${f}`),
          "",
          p.github ? `**Source Code**: ${p.github}` : "",
          p.demo ? `**Live Demo**: ${p.demo}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        return {
          text,
          navAction: { section: "work", label: `View ${subject.title}` },
        };
      }

      return {
        text: composeProjectDetails(projFact),
        navAction: { section: "work", label: `View ${subject.title}` },
      };
    }
  }

  // 2. Follow-up on Experience
  if (subject.domain === "experience") {
    return composeExperience();
  }

  // 3. Follow-up on Freelance
  if (subject.domain === "freelance") {
    return composeFreelance();
  }

  // 4. Follow-up on Education
  if (subject.domain === "education") {
    return composeEducation(retrieval.normalizedQuery);
  }

  return composeProfile(retrieval.normalizedQuery);
}

// ---------------------------------------------------------------------------
// 4. Main Export: composeOfflineResponse
// ---------------------------------------------------------------------------

/**
 * Compose a natural, context-grounded response from Phase 2 retrieval output.
 *
 * @param query The latest visitor message.
 * @param retrieval Structured result from retrievePortfolioFacts().
 * @param history Conversation history up to this point (strictly read-only).
 * @returns Structured ComposedResponse adhering to the application's contract.
 */
export function composeOfflineResponse(
  query: string,
  retrieval: RetrievalResult,
  history: readonly ChatMessage[] = []
): ComposedResponse {
  let text = "";
  let navAction: NavAction | undefined | null = null;
  let clarificationRequest: string | undefined;
  let contactInstruction: "ask_email" | "ready_to_draft" | "direct_contact_info" | undefined;

  let contactDraft: ContactDraft | undefined | null = null;
  let customRawOutput: string | undefined;

  switch (retrieval.intent) {
    case "greeting": {
      const res = composeGreeting(query, history);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "contact": {
      const contactRes = processOfflineContactFlow(query, history);
      text = contactRes.responseMessage;
      navAction = contactRes.navAction;
      contactDraft = contactRes.draft;
      customRawOutput = contactRes.rawOutput;
      contactInstruction =
        contactRes.status === "complete_draft_ready"
          ? "ready_to_draft"
          : contactRes.status === "need_email"
          ? "ask_email"
          : "direct_contact_info";
      break;
    }

    case "unsupported": {
      const res = composeUnsupported(retrieval.unsupportedReason);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "clarification": {
      const res = composeClarification(
        retrieval.ambiguityReason,
        retrieval.suggestedClarifications
      );
      text = res.text;
      clarificationRequest = res.clarificationRequest;
      break;
    }

    case "projects": {
      const res = composeProjects(query, retrieval.facts);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "skills": {
      const res = composeSkills(query, retrieval.facts);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "experience": {
      const res = composeExperience();
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "education": {
      const res = composeEducation(query);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "certifications": {
      const res = composeCertifications();
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "freelance": {
      const res = composeFreelance();
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "achievements": {
      const res = composeAchievements();
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "profile": {
      const res = composeProfile(query);
      text = res.text;
      navAction = res.navAction;
      break;
    }

    case "followup": {
      const res = composeFollowup(retrieval, history);
      text = res.text;
      navAction = res.navAction;
      clarificationRequest = res.clarificationRequest;
      break;
    }

    default: {
      const res = composeProfile(query);
      text = res.text;
      navAction = res.navAction;
      break;
    }
  }

  // Format rawOutput: use customRawOutput (e.g. from contact flow) or append navAction
  let rawOutput = customRawOutput;
  if (!rawOutput) {
    rawOutput = navAction
      ? `${text}${formatNavAction(navAction.section, navAction.label)}`
      : text;
  }

  return {
    text,
    intent: retrieval.intent,
    navAction,
    contactDraft,
    rawOutput,
    clarificationRequest,
    contactInstruction,
  };
}
