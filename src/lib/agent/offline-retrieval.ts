/**
 * LOKI Offline Intelligence — Retrieval Engine & Intent Classification (Phase 2)
 *
 * Deterministic, server-side retrieval and classification grounded exclusively
 * in verified portfolio data from src/lib/data.ts.
 *
 * Features:
 * - Zero external network calls or third-party AI dependencies
 * - Normalized tokenization with domain-specific aliases & compound matching
 * - Multi-intent taxonomy with explicit guardrails for unsupported queries
 * - Context-aware follow-up and anaphora resolution across conversation history
 * - Calibrated confidence scoring and ranking
 */

import {
  PROFILE,
  EDUCATION,
  EXPERIENCE,
  PROJECTS,
  SKILL_ELEMENTS,
  CERTIFICATIONS,
  ACHIEVEMENTS,
  FREELANCE,
  Project,
  EducationItem,
  ExperienceItem,
  SkillElement,
  Certification,
  AchievementItem,
  FreelanceCaseStudy,
  Profile,
} from "../data";
import type { ChatMessage } from "./llm";

// ---------------------------------------------------------------------------
// 1. Core Type Definitions
// ---------------------------------------------------------------------------

export type IntentCategory =
  | "greeting"
  | "profile"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "certifications"
  | "freelance"
  | "achievements"
  | "contact"
  | "followup"
  | "clarification"
  | "unsupported";

export type KnowledgeDomain =
  | "profile"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "certifications"
  | "freelance"
  | "achievements"
  | "contact"
  | "meta";

export interface RetrievedFact {
  domain: KnowledgeDomain;
  id: string;
  title: string;
  subtitle?: string;
  score: number;
  matchedTerms: string[];
  summary: string;
  data: Record<string, unknown>;
}

export interface ResolvedSubject {
  domain: KnowledgeDomain;
  id: string;
  title: string;
  confidence: number;
  source:
    | "pronoun_resolution"
    | "ordinal_reference"
    | "topic_continuation"
    | "exact_mention"
    | "alternate_reference";
}

export interface RetrievalResult {
  intent: IntentCategory;
  confidence: number; // 0.0 to 1.0
  facts: RetrievedFact[];
  resolvedSubject?: ResolvedSubject;
  ambiguityReason?: string;
  unsupportedReason?: string;
  suggestedClarifications?: string[];
  normalizedQuery: string;
  tokens: string[];
}

interface SearchableRecord {
  domain: KnowledgeDomain;
  id: string;
  title: string;
  subtitle?: string;
  aliases: string[];
  searchableText: string;
  summary: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 2. Normalization & Lexicon Maps
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below",
  "to", "from", "up", "down", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "can", "could", "will", "would",
  "shall", "should", "may", "might", "must", "and", "or", "but", "so", "if",
  "what", "which", "who", "whom", "this", "that", "these", "those", "am", "it",
  "its", "tell", "me", "show", "give", "please", "know", "how", "where", "when",
  "why", "there", "here", "any", "all", "some", "details", "information", "info"
]);

// Keep critical short technical tokens from being removed
const PRESERVED_SHORT_TOKENS = new Set([
  "ai", "ml", "ui", "ux", "db", "js", "ts", "go", "c", "c++", "git", "sql", "api", "aws", "hrm", "jwt"
]);

// Normalization alias mappings (spelling variants, plurals, abbreviations)
const TOKEN_ALIASES: Record<string, string> = {
  "reactjs": "react",
  "react.js": "react",
  "nodejs": "node",
  "node.js": "node",
  "expressjs": "express",
  "express.js": "express",
  "golang": "go",
  "aiml": "ai",
  "internships": "internship",
  "intern": "internship",
  "jobs": "job",
  "companies": "company",
  "certifications": "certification",
  "certificates": "certification",
  "certs": "certification",
  "degrees": "degree",
  "colleges": "college",
  "universities": "college",
  "schools": "school",
  "technologies": "tech",
  "skills": "skill",
  "projects": "project",
  "applications": "project",
  "application": "project",
  "apps": "project",
  "developed": "built",
  "created": "built",
  "ecommerce": "ecommerce",
  "e-commerce": "ecommerce",
  "storefront": "ecommerce",
  "authentication": "authentication",
  "auth": "authentication",
  "languages": "languages",
  "language": "languages",
  "programming": "languages",
  "relational": "mysql",
  "nosql": "firebase",
  "strengths": "skills",
  "specialties": "skills",
  "achievements": "achievement",
  "awards": "achievement",
  "qualifications": "education",
  "contacts": "contact",
  "emails": "email",
  "phones": "phone",
};

// Known unlisted technical topics & sensitive queries to protect against hallucinations
const UNLISTED_TECH_TOPICS = [
  "rust", "solidity", "blockchain", "web3", "crypto", "smart contract", "ethereum",
  "angular", "vue", "vuejs", "svelte", "swift", "kotlin", "flutter", "react native",
  "c#", ".net", "dotnet", "php", "laravel", "ruby", "rails", "cobol", "fortran",
  "django", "spring boot", "springboot", "kubernetes", "k8s", "terraform", "ansible"
];

const PRIVATE_OR_SENSITIVE_TOPICS = [
  "salary", "ctc", "compensation", "earn", "income", "hourly rate", "pricing",
  "revenue", "sales", "profit", "conversion rate", "traffic analytics", "user metrics",
  "latency benchmark", "throughput", "benchmarks", "requests per second",
  "home address", "house", "personal life", "marital", "married", "girlfriend",
  "wife", "relationship", "age", "religion", "caste", "parents", "family"
];

// ---------------------------------------------------------------------------
// 3. Searchable Knowledge Index Builder
// ---------------------------------------------------------------------------

function buildSearchableIndex(): SearchableRecord[] {
  const records: SearchableRecord[] = [];

  // Profile
  records.push({
    domain: "profile",
    id: "profile:main",
    title: PROFILE.name,
    subtitle: `${PROFILE.role} · ${PROFILE.location}`,
    aliases: [
      "profile", "about", "bio", "background",
      "summary", "developer", "full stack developer", "who is", "who is lokesh"
    ],
    searchableText: `${PROFILE.name} ${PROFILE.firstName} ${PROFILE.lastName} ${PROFILE.role} ${PROFILE.location} ${PROFILE.resumeSummary} ${PROFILE.shortLine} ${PROFILE.department} ${PROFILE.cgpa} ${PROFILE.validTill} ${PROFILE.github} ${PROFILE.linkedin}`,
    summary: `${PROFILE.name} is a ${PROFILE.role} based in ${PROFILE.location}. ${PROFILE.resumeSummary} (${PROFILE.department}, CGPA: ${PROFILE.cgpa}).`,
    data: PROFILE as unknown as Record<string, unknown>,
  });

  // Projects
  for (const p of PROJECTS) {
    const techStr = p.tech.join(" ");
    const featStr = p.features.join(" ");
    const aliases = [
      p.title.toLowerCase(),
      p.id.toLowerCase(),
      `project ${p.index}`,
      p.index === "01" ? "first project" :
      p.index === "02" ? "second project" :
      p.index === "03" ? "third project" : "fourth project",
    ];

    if (p.id === "purnima-kalamkari") {
      aliases.push("kalamkari", "purnima", "ecommerce project", "ecommerce", "e-commerce", "storefront", "whatsapp store", "whatsapp ordering", "jwt admin");
    } else if (p.id === "javamentor") {
      aliases.push("java mentor", "learning platform", "coding arena", "interview prep", "coding practice", "interactive coding");
    } else if (p.id === "attendance-mgmt") {
      aliases.push("attendance", "attendance system", "attendance management", "attendance project", "hrm project", "leave management", "attendance management project");
    } else if (p.id === "3d-cinematic-portfolio") {
      aliases.push("3d portfolio", "cinematic portfolio", "canvas portfolio", "gsap portfolio", "motion portfolio");
    }

    records.push({
      domain: "projects",
      id: `project:${p.id}`,
      title: p.title,
      subtitle: `${p.kicker} (${p.year})`,
      aliases,
      searchableText: `${p.title} ${p.kicker} ${p.year} ${p.description} ${techStr} ${featStr}`,
      summary: `${p.title} (${p.year}) — ${p.kicker}. ${p.description} Tech: ${p.tech.join(", ")}.`,
      data: p as unknown as Record<string, unknown>,
    });
  }

  // Work Experience
  for (const exp of EXPERIENCE) {
    const bulletsStr = exp.bullets.join(" ");
    records.push({
      domain: "experience",
      id: `exp:${exp.id}`,
      title: exp.company,
      subtitle: `${exp.role} (${exp.period})`,
      aliases: [
        exp.company.toLowerCase(),
        "charani",
        "charani infotech",
        "associate software engineer",
        "internship",
        "work experience",
        "work",
        "works",
        "working",
        "job",
        "employment",
        "current company",
      ],
      searchableText: `${exp.company} ${exp.role} ${exp.period} ${exp.location} ${bulletsStr}`,
      summary: `${exp.role} at ${exp.company} (${exp.period}, ${exp.location}). Contributions: ${bulletsStr}`,
      data: exp as unknown as Record<string, unknown>,
    });
  }

  // Education
  for (const edu of EDUCATION) {
    const aliases = [
      edu.institution.toLowerCase(),
      edu.degree.toLowerCase(),
    ];
    if (edu.id === "edu-1") {
      aliases.push("vasavi", "sviet", "btech", "b.tech", "college", "engineering college", "degree", "aiml", "cgpa", "gpa");
    } else if (edu.id === "edu-2") {
      aliases.push("sri chaitanya", "chaitanya", "intermediate", "junior college", "12th");
    } else if (edu.id === "edu-3") {
      aliases.push("sahayamatha", "high school", "school", "secondary school", "10th");
    }

    records.push({
      domain: "education",
      id: `edu:${edu.id}`,
      title: edu.institution,
      subtitle: `${edu.degree} (${edu.period})`,
      aliases,
      searchableText: `${edu.institution} ${edu.degree} ${edu.period} ${edu.location} ${edu.cgpa || ""}`,
      summary: `${edu.degree} from ${edu.institution} (${edu.period}, ${edu.location})${edu.cgpa ? ` with CGPA ${edu.cgpa}` : ""}.`,
      data: edu as unknown as Record<string, unknown>,
    });
  }

  // Skills
  for (const s of SKILL_ELEMENTS) {
    const aliases = [s.name.toLowerCase(), s.symbol.toLowerCase()];
    if (s.name.includes(".")) {
      aliases.push(s.name.replace(".", "").toLowerCase());
    }
    if (s.family === "Databases") {
      aliases.push("database", "databases", "db");
    } else if (s.family === "Languages") {
      aliases.push("programming language", "programming languages");
    } else if (s.family === "Frontend") {
      aliases.push("frontend", "front-end", "ui");
    } else if (s.family === "Backend") {
      aliases.push("backend", "back-end", "api");
    } else if (s.family === "Tools") {
      aliases.push("tool", "tools", "platform");
    }
    records.push({
      domain: "skills",
      id: `skill:${s.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: s.name,
      subtitle: `${s.family} Skill`,
      aliases,
      searchableText: `${s.name} ${s.symbol} ${s.family} ${s.projects.join(" ")}`,
      summary: `${s.name} (${s.family}): Used across projects including ${s.projects.join(", ")}.`,
      data: s as unknown as Record<string, unknown>,
    });
  }

  // Certifications
  for (const cert of CERTIFICATIONS) {
    records.push({
      domain: "certifications",
      id: `cert:${cert.id}`,
      title: cert.title,
      subtitle: `Issued by ${cert.issuer} (${cert.year || "2026"})`,
      aliases: [
        cert.title.toLowerCase(),
        cert.issuer.toLowerCase(),
        "certification",
        "certificate",
        cert.id === "cert-1" ? "bists" : "charani certificate"
      ],
      searchableText: `${cert.title} ${cert.issuer} ${cert.year || ""}`,
      summary: `${cert.title} awarded by ${cert.issuer}${cert.year ? ` in ${cert.year}` : ""}.`,
      data: cert as unknown as Record<string, unknown>,
    });
  }

  // Freelance
  records.push({
    domain: "freelance",
    id: "freelance:purnima",
    title: FREELANCE.client,
    subtitle: `${FREELANCE.role} (${FREELANCE.period})`,
    aliases: [
      "freelance", "freelance work", "freelancing", "purnima kalamkari", "kalamkari client",
      "ecommerce storefront", "whatsapp ordering"
    ],
    searchableText: `${FREELANCE.client} ${FREELANCE.role} ${FREELANCE.period} ${FREELANCE.overview} ${FREELANCE.challenge} ${FREELANCE.tagline} ${FREELANCE.stack.join(" ")} ${FREELANCE.facts.map(f => `${f.label} ${f.value}`).join(" ")}`,
    summary: `${FREELANCE.role} for ${FREELANCE.client} (${FREELANCE.period}): ${FREELANCE.overview} Tech: ${FREELANCE.stack.join(", ")}. Live: ${FREELANCE.liveUrl}`,
    data: FREELANCE as unknown as Record<string, unknown>,
  });

  // Achievements
  for (const ach of ACHIEVEMENTS) {
    records.push({
      domain: "achievements",
      id: `ach:${ach.id}`,
      title: ach.metricLabel,
      subtitle: `${ach.value}${ach.suffix || ""} (${ach.caption})`,
      aliases: [
        ach.metricLabel.toLowerCase(),
        ach.caption.toLowerCase(),
        ach.platform.toLowerCase(),
        "achievement",
        "milestone",
        "highlight"
      ],
      searchableText: `${ach.metricLabel} ${ach.caption} ${ach.detail} ${ach.platform} ${ach.value} ${ach.suffix || ""}`,
      summary: `${ach.metricLabel}: ${ach.value}${ach.suffix || ""} — ${ach.caption} (${ach.detail}).`,
      data: ach as unknown as Record<string, unknown>,
    });
  }

  return records;
}

// Module-level memoized index
let SEARCHABLE_INDEX: SearchableRecord[] | null = null;
function getSearchableIndex(): SearchableRecord[] {
  if (!SEARCHABLE_INDEX) {
    SEARCHABLE_INDEX = buildSearchableIndex();
  }
  return SEARCHABLE_INDEX;
}

// ---------------------------------------------------------------------------
// 4. Natural Language Normalization & Tokenization
// ---------------------------------------------------------------------------

/**
 * Dependency-free text normalization:
 * - Lowercases text
 * - Normalizes punctuation and whitespace while preserving tech dots and symbols (.js, c++)
 */
export function normalizeText(input: string): string {
  if (!input) return "";

  return input
    .toLowerCase()
    .replace(/[’']/g, "") // remove apostrophes (e.g. lokesh's -> lokeshs)
    .replace(/([a-z0-9])\/(?=[a-z0-9])/g, "$1 ") // replace slashes between words
    .replace(/[^\w\s.+#-]/g, " ") // retain word chars, periods, pluses, hashes, dashes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenize string into meaningful clean tokens, resolving common aliases and stripping non-essential stop words.
 */
export function tokenize(normalized: string): string[] {
  if (!normalized) return [];

  const rawWords = normalized.split(/\s+/).filter(Boolean);
  const result: string[] = [];

  for (const raw of rawWords) {
    // Clean trailing dots unless it's a known extension/tech like .js
    let word = raw;
    if (word.endsWith(".") && !word.endsWith(".js")) {
      word = word.slice(0, -1);
    }

    if (!word) continue;

    // Apply token alias mappings
    const mapped = TOKEN_ALIASES[word] || word;

    // If it's a stop word and not an essential technical acronym, skip
    if (STOP_WORDS.has(mapped) && !PRESERVED_SHORT_TOKENS.has(mapped)) {
      continue;
    }

    result.push(mapped);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 5. Context & History Subject Resolution
// ---------------------------------------------------------------------------

const PROJECT_ORDINAL_MAP: Record<string, string> = {
  "first": "project:purnima-kalamkari",
  "1st": "project:purnima-kalamkari",
  "second": "project:javamentor",
  "2nd": "project:javamentor",
  "third": "project:attendance-mgmt",
  "3rd": "project:attendance-mgmt",
  "fourth": "project:3d-cinematic-portfolio",
  "4th": "project:3d-cinematic-portfolio",
  "last": "project:3d-cinematic-portfolio",
  "final": "project:3d-cinematic-portfolio",
};

/**
 * Resolve pronoun or context references using validated conversation history.
 * History is treated strictly as read-only.
 */
export function resolveConversationSubject(
  query: string,
  history: readonly ChatMessage[] = []
): ResolvedSubject | undefined {
  const normQuery = normalizeText(query);

  // 1. Ordinal reference resolution (e.g. "what is the first project?", "tell me about the 2nd one", "the last project")
  for (const [ord, projId] of Object.entries(PROJECT_ORDINAL_MAP)) {
    if (
      new RegExp(`\\b${ord}\\b`).test(normQuery) &&
      (normQuery.includes("project") || normQuery.includes("one") || normQuery.includes("app"))
    ) {
      const match = getSearchableIndex().find((r) => r.id === projId);
      if (match) {
        return {
          domain: match.domain,
          id: match.id,
          title: match.title,
          confidence: 0.95,
          source: "ordinal_reference",
        };
      }
    }
  }

  // 1b. Comparisons ("compare", "vs") should never be resolved to a single entity
  if (/\b(compare|vs|versus|difference between)\b/i.test(normQuery)) {
    return undefined;
  }

  // 1c. Topic change guard: If user explicitly asks about education, skills, experience, certifications, contact:
  // A new topic takes precedence over an old topic from history!
  const isExplicitTopicChange =
    /\b(education|college|university|degree|cgpa|gpa|school|certifications?|certificates?|certified|skills?|tech stack|technologies|database|languages?|experience|company|charani|job|internship|contact|reach|email|phone|hire|achievements?|milestones?)\b/i.test(
      normQuery
    ) &&
    !normQuery.includes("in it") &&
    !normQuery.includes("used in it") &&
    !normQuery.includes("tech in it");

  if (isExplicitTopicChange) {
    return undefined;
  }

  // 1d. If query has a continuation or return reference AND explicitly mentions a project (e.g. "Back to Purnima Kalamkari: why did he build it?"), that explicit project takes precedence over history!
  const hasContinuationOrReturn =
    /\b(back to|return to|what about|how about|why did he build it|tell me about it)\b/i.test(normQuery) ||
    normQuery.includes("why") ||
    normQuery.includes("in it");

  if (hasContinuationOrReturn) {
    const explicitlyMentionedProject = PROJECTS.find((p) => {
      const titleLower = p.title.toLowerCase();
      const idLower = p.id.toLowerCase();
      return (
        normQuery.includes(titleLower) ||
        normQuery.includes(idLower) ||
        (p.id === "purnima-kalamkari" && (normQuery.includes("purnima") || normQuery.includes("kalamkari"))) ||
        (p.id === "3d-cinematic-portfolio" &&
          (normQuery.includes("3d portfolio") ||
            normQuery.includes("cinematic") ||
            normQuery.includes("3d cinematic"))) ||
        (p.id === "attendance-mgmt" && (normQuery.includes("attendance") || normQuery.includes("hrm"))) ||
        (p.id === "javamentor" && normQuery.includes("javamentor"))
      );
    });

    if (explicitlyMentionedProject) {
      return {
        domain: "projects",
        id: `project:${explicitlyMentionedProject.id}`,
        title: explicitlyMentionedProject.title,
        confidence: 0.95,
        source: "exact_mention",
      };
    }
  }

  // 1d. "The other one" / alternate reference resolution
  const isOtherRef = /\b(the other one|other one|other project|what about the other)\b/i.test(normQuery);
  if (isOtherRef && history.length > 0) {
    const recentTurns = history.slice(-6).reverse();
    let currentSubjectId: string | undefined;
    for (const turn of recentTurns) {
      const turnNorm = normalizeText(turn.content);
      const proj = PROJECTS.find(
        (p) =>
          turnNorm.includes(p.title.toLowerCase()) ||
          turnNorm.includes(p.id.toLowerCase()) ||
          (p.id === "purnima-kalamkari" && (turnNorm.includes("purnima") || turnNorm.includes("kalamkari"))) ||
          (p.id === "3d-cinematic-portfolio" &&
            (turnNorm.includes("3d portfolio") || turnNorm.includes("cinematic"))) ||
          (p.id === "attendance-mgmt" && (turnNorm.includes("attendance") || turnNorm.includes("hrm"))) ||
          (p.id === "javamentor" && turnNorm.includes("javamentor"))
      );
      if (proj) {
        currentSubjectId = proj.id;
        break;
      }
    }

    for (const turn of recentTurns) {
      const turnNorm = normalizeText(turn.content);
      const otherProj = PROJECTS.find(
        (p) =>
          p.id !== currentSubjectId &&
          (turnNorm.includes(p.title.toLowerCase()) ||
            turnNorm.includes(p.id.toLowerCase()) ||
            (p.id === "purnima-kalamkari" && (turnNorm.includes("purnima") || turnNorm.includes("kalamkari"))) ||
            (p.id === "3d-cinematic-portfolio" &&
              (turnNorm.includes("3d portfolio") || turnNorm.includes("cinematic"))) ||
            (p.id === "attendance-mgmt" && (turnNorm.includes("attendance") || turnNorm.includes("hrm"))) ||
            (p.id === "javamentor" && turnNorm.includes("javamentor")))
      );
      if (otherProj) {
        return {
          domain: "projects",
          id: `project:${otherProj.id}`,
          title: otherProj.title,
          confidence: 0.92,
          source: "alternate_reference",
        };
      }
    }
  }

  // 2. Pronoun, demonstrative & continuation reference resolution ("it", "that", "this", "that project", "tell me more", etc.)
  const hasPronounRef =
    /\b(it|its|that|this|that project|this project|that app|this app|the project|tell me more|how does it work|how was it built|why|what else|features of it|technologies used in it|tech stack of it)\b/i.test(
      normQuery
    );

  if (!hasPronounRef) {
    return undefined;
  }

  // Scan recent history in reverse order (up to last 6 turns)
  const recentTurns = history.slice(-6).reverse();

  // Multi-entity ambiguity guard: If recent history mentions multiple projects equally and query asks ambiguous "it" or "which is better":
  if (recentTurns.length > 0) {
    const latestTurn = recentTurns[0];
    const latestNorm = normalizeText(latestTurn.content);
    const mentionedProjects = PROJECTS.filter(
      (p) => latestNorm.includes(p.title.toLowerCase()) || latestNorm.includes(p.id.toLowerCase())
    );
    if (
      mentionedProjects.length >= 2 &&
      /\b(it|that|this|which is better|which one|tell me more about it)\b/i.test(normQuery) &&
      !normQuery.includes("first") &&
      !normQuery.includes("second") &&
      !normQuery.includes("both")
    ) {
      return undefined; // Let classifyIntent return "clarification"
    }
  }

  for (const turn of recentTurns) {
    const turnNorm = normalizeText(turn.content);

    // Check projects first
    for (const proj of PROJECTS) {
      if (turnNorm.includes(proj.title.toLowerCase()) || turnNorm.includes(proj.id.toLowerCase())) {
        return {
          domain: "projects",
          id: `project:${proj.id}`,
          title: proj.title,
          confidence: 0.9,
          source: "pronoun_resolution",
        };
      }
    }

    // Check experience (Charani)
    if (turnNorm.includes("charani") || turnNorm.includes("associate software engineer")) {
      return {
        domain: "experience",
        id: "exp:exp-1",
        title: "CHARANI INFOTECH PVT LTD",
        confidence: 0.88,
        source: "pronoun_resolution",
      };
    }

    // Check freelance
    if (turnNorm.includes("purnima") || turnNorm.includes("kalamkari")) {
      return {
        domain: "freelance",
        id: "freelance:purnima",
        title: FREELANCE.client,
        confidence: 0.88,
        source: "pronoun_resolution",
      };
    }

    // Check education
    if (turnNorm.includes("vasavi") || turnNorm.includes("sviet") || turnNorm.includes("btech")) {
      return {
        domain: "education",
        id: "edu:edu-1",
        title: "SRI VASAVI INSTITUTE OF ENGINEERING & TECHNOLOGY",
        confidence: 0.85,
        source: "pronoun_resolution",
      };
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// 6. Intent Classification & Guardrail Rules
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;

export function classifyIntent(
  normalizedQuery: string,
  tokens: string[],
  resolvedSubject?: ResolvedSubject,
  history?: readonly ChatMessage[]
): { intent: IntentCategory; reason?: string } {
  // 0. Email present in query -> Direct contact flow
  if (EMAIL_REGEX.test(normalizedQuery)) {
    return { intent: "contact" };
  }

  // 0b. Awaiting contact details check
  const lastAssistantTurn = history
    ? [...history].reverse().find((m) => m.role === "assistant")
    : undefined;
  const isAwaitingEmail =
    lastAssistantTurn &&
    /\b(email address|best email|share your email)\b/i.test(lastAssistantTurn.content);

  if (isAwaitingEmail && !/\b(nevermind|cancel|forget it|tell me about)\b/i.test(normalizedQuery)) {
    return { intent: "contact" };
  }

  // Guardrail 1: Sensitive, Private, Commercial Metrics, or Benchmark queries
  for (const sensitive of PRIVATE_OR_SENSITIVE_TOPICS) {
    if (new RegExp(`\\b${sensitive}\\b`, "i").test(normalizedQuery)) {
      let reasonCategory = "private";
      if (/salary|ctc|compensation|earn|income|hourly rate|pricing/i.test(sensitive)) {
        reasonCategory = "compensation";
      } else if (
        /revenue|sales|profit|conversion rate|traffic analytics|user metrics|benchmark|throughput|requests per second/i.test(
          sensitive
        )
      ) {
        reasonCategory = "benchmarks_or_revenue";
      }
      return {
        intent: "unsupported",
        reason:
          reasonCategory === "benchmarks_or_revenue"
            ? `Inquiry regarding "${sensitive}" requests unpublished commercial revenue, traffic, or performance benchmarks.`
            : reasonCategory === "compensation"
            ? `Inquiry regarding "${sensitive}" requests salary expectations or compensation data.`
            : `Inquiry regarding "${sensitive}" requests private or unlisted personal data.`,
      };
    }
  }

  // Guardrail 2: Explicit queries for unlisted technical competencies
  for (const unlisted of UNLISTED_TECH_TOPICS) {
    const rx = new RegExp(`\\b${unlisted.replace("+", "\\+")}\\b`, "i");
    if (rx.test(normalizedQuery)) {
      return {
        intent: "unsupported",
        reason: `Technology "${unlisted}" is not part of Lokesh's verified portfolio skillset.`,
      };
    }
  }

  // 1. Greetings & Meta questions
  const isGreeting =
    /^(hi|hello|hey|hola|good morning|good afternoon|good evening|greetings)\b/i.test(normalizedQuery) ||
    /^(who are you|what are you|what can you do|help me|tell me what you can do)\b/i.test(normalizedQuery);

  if (isGreeting && tokens.length <= 4 && !normalizedQuery.includes("project") && !normalizedQuery.includes("skill")) {
    return { intent: "greeting" };
  }

  // 1b. Career interest / professional strengths inquiries belong to profile/skills, not contact draft:
  const isCareerInquiry =
    /\b(career goals?|career interests?|professional strengths?|looking for (a |any )?(job|role)|what (role|job) is he (seeking|looking for)|why hire|why should i hire)\b/i.test(
      normalizedQuery
    );
  if (isCareerInquiry) {
    return { intent: "profile" };
  }

  // 2. Direct Contact Request
  const isContact =
    /\b(contact|reach|hire|email|phone|call|message|touch|collaborate|connect with lokesh|talk to lokesh|discuss (a |an )?(role|job|opportunity)|opportunity with lokesh|schedule an interview|interview lokesh)\b/i.test(
      normalizedQuery
    ) ||
    (/\b(i am|im|my name is)\s+.*\b(discuss|opportunity|role|hire|work with|interview)\b/i.test(normalizedQuery));

  if (isContact && !normalizedQuery.includes("project")) {
    return { intent: "contact" };
  }

  // 3. Follow-up with resolved subject
  if (resolvedSubject) {
    return { intent: "followup" };
  }

  // 4. Ambiguous follow-up without resolved subject
  const hasAmbiguousPronoun =
    /\b(tell me more about it|what about that|how does it work|features of it|technologies used in it|which is better|which one is better|compare those two)\b/i.test(
      normalizedQuery
    ) && tokens.length <= 6;

  if (hasAmbiguousPronoun) {
    return {
      intent: "clarification",
      reason: "Query references a subject or comparison but recent conversation does not supply a clear subject.",
    };
  }

  // 5. Domain-specific intent classification
  if (
    normalizedQuery.includes("project") ||
    normalizedQuery.includes("built") ||
    normalizedQuery.includes("app") ||
    normalizedQuery.includes("application") ||
    normalizedQuery.includes("developed") ||
    normalizedQuery.includes("created") ||
    normalizedQuery.includes("javamentor") ||
    normalizedQuery.includes("attendance") ||
    normalizedQuery.includes("cinematic") ||
    normalizedQuery.includes("purnima") ||
    normalizedQuery.includes("kalamkari") ||
    normalizedQuery.includes("ecommerce") ||
    normalizedQuery.includes("e-commerce") ||
    normalizedQuery.includes("storefront") ||
    normalizedQuery.includes("authentication") ||
    normalizedQuery.includes("compare")
  ) {
    return { intent: "projects" };
  }

  if (
    normalizedQuery.includes("freelance") ||
    normalizedQuery.includes("client")
  ) {
    return { intent: "freelance" };
  }

  if (
    normalizedQuery.includes("skill") ||
    normalizedQuery.includes("tech") ||
    normalizedQuery.includes("stack") ||
    normalizedQuery.includes("programming") ||
    normalizedQuery.includes("languages") ||
    normalizedQuery.includes("react") ||
    normalizedQuery.includes("node") ||
    normalizedQuery.includes("javascript") ||
    normalizedQuery.includes("database") ||
    normalizedQuery.includes("mysql") ||
    normalizedQuery.includes("firebase") ||
    normalizedQuery.includes("frontend") ||
    normalizedQuery.includes("backend") ||
    normalizedQuery.includes("tools") ||
    normalizedQuery.includes("toolchain")
  ) {
    return { intent: "skills" };
  }

  if (
    normalizedQuery.includes("experience") ||
    normalizedQuery.includes("job") ||
    normalizedQuery.includes("internship") ||
    normalizedQuery.includes("charani") ||
    normalizedQuery.includes("company") ||
    /\bwork(s|ing)?\b/i.test(normalizedQuery) ||
    normalizedQuery.includes("employment")
  ) {
    return { intent: "experience" };
  }

  if (
    normalizedQuery.includes("education") ||
    normalizedQuery.includes("college") ||
    normalizedQuery.includes("university") ||
    normalizedQuery.includes("degree") ||
    normalizedQuery.includes("qualification") ||
    normalizedQuery.includes("study") ||
    normalizedQuery.includes("btech") ||
    normalizedQuery.includes("cgpa") ||
    normalizedQuery.includes("gpa") ||
    normalizedQuery.includes("school") ||
    normalizedQuery.includes("vasavi")
  ) {
    return { intent: "education" };
  }

  if (
    normalizedQuery.includes("certification") ||
    normalizedQuery.includes("certificate") ||
    normalizedQuery.includes("certified") ||
    normalizedQuery.includes("bists")
  ) {
    return { intent: "certifications" };
  }

  if (
    normalizedQuery.includes("achievement") ||
    normalizedQuery.includes("milestone") ||
    normalizedQuery.includes("highlight") ||
    normalizedQuery.includes("award") ||
    normalizedQuery.includes("stats")
  ) {
    return { intent: "achievements" };
  }

  if (
    normalizedQuery.includes("who is lokesh") ||
    normalizedQuery.includes("about lokesh") ||
    normalizedQuery.includes("bio") ||
    normalizedQuery.includes("background") ||
    normalizedQuery.includes("summary") ||
    normalizedQuery.includes("where does he live") ||
    normalizedQuery.includes("location")
  ) {
    return { intent: "profile" };
  }

  // Default fallback classification based on retrieval score
  return { intent: "profile" };
}

// ---------------------------------------------------------------------------
// 7. Retrieval Scoring Engine
// ---------------------------------------------------------------------------

function scoreRecord(
  record: SearchableRecord,
  normalizedQuery: string,
  tokens: string[],
  intent: IntentCategory,
  resolvedSubject?: ResolvedSubject
): { score: number; matchedTerms: string[] } {
  let score = 0;
  const matchedTerms: string[] = [];

  // Boost for resolved subject match
  if (resolvedSubject && record.id === resolvedSubject.id) {
    score += 50;
    matchedTerms.push(`resolved_subject:${resolvedSubject.title}`);
  }

  // Exact alias match in query (highest confidence signal)
  for (const alias of record.aliases) {
    if (alias.length > 2 && normalizedQuery.includes(alias)) {
      score += 35;
      matchedTerms.push(`alias:${alias}`);
      break;
    }
  }

  // Domain alignment bonus
  if (
    (intent === "projects" && record.domain === "projects") ||
    (intent === "experience" && record.domain === "experience") ||
    (intent === "education" && record.domain === "education") ||
    (intent === "skills" && record.domain === "skills") ||
    (intent === "certifications" && record.domain === "certifications") ||
    (intent === "freelance" && record.domain === "freelance") ||
    (intent === "achievements" && record.domain === "achievements") ||
    (intent === "profile" && record.domain === "profile")
  ) {
    score += 15;
    matchedTerms.push(`domain:${record.domain}`);
  }

  // Token overlap scoring
  const recordSearchLower = record.searchableText.toLowerCase();
  for (const token of tokens) {
    if (token.length <= 1 && !PRESERVED_SHORT_TOKENS.has(token)) continue;

    const tokenRegex = new RegExp(`\\b${token.replace("+", "\\+")}\\b`, "i");
    if (tokenRegex.test(recordSearchLower)) {
      score += 6;
      matchedTerms.push(token);
    }
  }

  // Title match bonus
  if (new RegExp(`\\b${record.title.toLowerCase()}\\b`, "i").test(normalizedQuery)) {
    score += 25;
    matchedTerms.push(`title:${record.title}`);
  }

  return { score, matchedTerms };
}

// ---------------------------------------------------------------------------
// 8. Main Public Export: retrievePortfolioFacts
// ---------------------------------------------------------------------------

/**
 * Perform deterministic, context-aware retrieval and classification over portfolio knowledge.
 *
 * @param query Latest visitor message.
 * @param history Conversation history up to this point (never mutated).
 * @returns Typed RetrievalResult suitable for Phase 3 response composition.
 */
export async function retrievePortfolioFacts(
  query: string,
  history: readonly ChatMessage[] = []
): Promise<RetrievalResult> {
  const normalizedQuery = normalizeText(query);
  const tokens = tokenize(normalizedQuery);

  // 1. Resolve context / pronouns from history
  const resolvedSubject = resolveConversationSubject(query, history);

  // 2. Classify intent with guardrails
  const { intent, reason } = classifyIntent(normalizedQuery, tokens, resolvedSubject, history);

  // Handle unsupported queries immediately without inventing facts
  if (intent === "unsupported") {
    return {
      intent: "unsupported",
      confidence: 1.0,
      facts: [],
      unsupportedReason: reason || "This inquiry asks for unlisted or unsupported information.",
      normalizedQuery,
      tokens,
    };
  }

  // Handle ambiguous queries requiring clarification
  if (intent === "clarification") {
    return {
      intent: "clarification",
      confidence: 0.9,
      facts: [],
      ambiguityReason: reason || "Could you clarify which project, skill, or experience you are referring to?",
      suggestedClarifications: [
        "Purnima Kalamkari (Ecommerce Storefront)",
        "JavaMentor (Full Stack Platform)",
        "Employee Attendance Management (Enterprise HRM)",
        "3D Cinematic Portfolio (Canvas & GSAP)",
        "Charani Infotech (Work Experience)",
      ],
      normalizedQuery,
      tokens,
    };
  }

  // Handle greetings
  if (intent === "greeting") {
    const profileRecord = getSearchableIndex().find((r) => r.id === "profile:main");
    return {
      intent: "greeting",
      confidence: 1.0,
      facts: profileRecord
        ? [
            {
              domain: profileRecord.domain,
              id: profileRecord.id,
              title: profileRecord.title,
              subtitle: profileRecord.subtitle,
              score: 50,
              matchedTerms: ["greeting"],
              summary: profileRecord.summary,
              data: profileRecord.data,
            },
          ]
        : [],
      normalizedQuery,
      tokens,
    };
  }

  // Handle contact intent
  if (intent === "contact") {
    const profileRecord = getSearchableIndex().find((r) => r.id === "profile:main");
    return {
      intent: "contact",
      confidence: 1.0,
      facts: profileRecord
        ? [
            {
              domain: profileRecord.domain,
              id: profileRecord.id,
              title: "Contact Lokesh Kagitha",
              subtitle: `${PROFILE.email} · ${PROFILE.location}`,
              score: 50,
              matchedTerms: ["contact"],
              summary: `Lokesh Kagitha can be reached via email at ${PROFILE.email} or by phone at ${PROFILE.phone}.`,
              data: { email: PROFILE.email, phone: PROFILE.phone, location: PROFILE.location },
            },
          ]
        : [],
      normalizedQuery,
      tokens,
    };
  }

  // 3. Search and score all records
  const index = getSearchableIndex();
  const scoredRecords: RetrievedFact[] = [];

  for (const record of index) {
    const { score, matchedTerms } = scoreRecord(
      record,
      normalizedQuery,
      tokens,
      intent,
      resolvedSubject
    );

    if (score >= 15) {
      scoredRecords.push({
        domain: record.domain,
        id: record.id,
        title: record.title,
        subtitle: record.subtitle,
        score,
        matchedTerms,
        summary: record.summary,
        data: record.data,
      });
    }
  }

  // Rank by score descending
  scoredRecords.sort((a, b) => b.score - a.score);

  // Take top relevant facts (max 5)
  const topFacts = scoredRecords.slice(0, 5);

  // Compute confidence level
  let confidence = 0.5;
  if (topFacts.length > 0) {
    const highestScore = topFacts[0].score;
    if (highestScore >= 45) {
      confidence = 0.95;
    } else if (highestScore >= 30) {
      confidence = 0.85;
    } else if (highestScore >= 20) {
      confidence = 0.7;
    } else {
      confidence = 0.55;
    }
  } else {
    // If no records matched the query and it wasn't a recognized domain, mark unsupported
    return {
      intent: "unsupported",
      confidence: 0.8,
      facts: [],
      unsupportedReason: "No relevant records matching your question were found in Lokesh's verified portfolio data.",
      normalizedQuery,
      tokens,
    };
  }

  return {
    intent,
    confidence,
    facts: topFacts,
    resolvedSubject,
    normalizedQuery,
    tokens,
  };
}
