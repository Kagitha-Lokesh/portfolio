/**
 * LOKI Offline Intelligence — Context-Aware Contact Flow (Phase 4)
 *
 * Preserves contact information across multi-turn conversations and asks only
 * for missing details when all remote LLM providers are offline.
 *
 * Guarantees:
 * - Conservative extraction of name, email, organization, and purpose from history
 * - Does not ask visitor to repeat previously supplied information
 * - Safe JSON serialization for [[CONTACT_DRAFT]] matching FormattedText.tsx parser
 * - Never sends email automatically (requires explicit user confirmation in UI)
 * - Zero external network calls or dependencies
 */

import type { ContactDraft, NavAction, ValidSectionId } from "@/components/agent/types";
import type { ChatMessage } from "./llm";
import { PROFILE } from "../data";

// ---------------------------------------------------------------------------
// 1. Interfaces & Types
// ---------------------------------------------------------------------------

export interface ExtractedContactDetails {
  name?: string;
  email?: string;
  organization?: string;
  purpose?: string;
  hasExplicitContactIntent: boolean;
}

export type ContactFlowStatus =
  | "complete_draft_ready"
  | "need_email"
  | "need_purpose"
  | "general_inquiry"
  | "not_contact_flow";

export interface ContactFlowResult {
  isContactFlow: boolean;
  status: ContactFlowStatus;
  extracted: ExtractedContactDetails;
  draft?: ContactDraft | null;
  responseMessage: string;
  navAction?: NavAction | null;
  rawOutput: string;
}

// ---------------------------------------------------------------------------
// 2. Extraction Patterns & Constants
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const STRICT_EMAIL_VALIDATION = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID_NAME_WORDS = new Set([
  "looking", "interested", "trying", "wondering", "reaching", "writing",
  "here", "happy", "glad", "recruiter", "manager", "engineer", "developer",
  "founder", "cto", "ceo", "hr", "from", "just", "checking", "contacting",
  "a", "an", "the", "someone", "hiring", "ready", "im", "i", "iam"
]);

const NON_ORG_WORDS = new Set([
  "portfolio", "website", "linkedin", "github", "scratch", "online",
  "india", "hyderabad", "andhra", "bangalore", "delhi", "mumbai", "us",
  "usa", "remote", "abroad", "here", "there", "today", "yesterday"
]);

// ---------------------------------------------------------------------------
// 3. Extraction Helpers
// ---------------------------------------------------------------------------

/**
 * Extract clean email address from string, supporting mailto links and brackets.
 */
export function extractEmail(text: string): string | undefined {
  if (!text) return undefined;

  // Handle markdown mailto: [email](mailto:email)
  const mailtoMatch = text.match(/\[([^\]]+)\]\(mailto:([^)]+)\)/i);
  if (mailtoMatch && STRICT_EMAIL_VALIDATION.test(mailtoMatch[2].trim())) {
    return mailtoMatch[2].trim().toLowerCase();
  }

  const match = text.match(EMAIL_REGEX);
  if (!match) return undefined;

  let candidate = match[0].trim();
  // Strip trailing punctuation
  candidate = candidate.replace(/[.,;:)>\]]+$/, "");

  if (STRICT_EMAIL_VALIDATION.test(candidate)) {
    return candidate.toLowerCase();
  }

  return undefined;
}

/**
 * Extract person's name using conservative grammatical patterns.
 */
export function extractName(text: string): string | undefined {
  if (!text) return undefined;

  // Pattern 1: "My name is <Name>"
  const myNameMatch = text.match(/\bmy name is\s+([A-Za-z][A-Za-z.\s'-]{1,35})/i);
  if (myNameMatch) {
    const candidate = cleanExtractedName(myNameMatch[1]);
    if (isValidNameCandidate(candidate)) return candidate;
  }

  // Pattern 2: "I'm <Name>" or "I am <Name>"
  const imMatch = text.match(/\b(?:i am|i'm|im)\s+([A-Za-z][A-Za-z.\s'-]{1,35})/i);
  if (imMatch) {
    const candidate = cleanExtractedName(imMatch[1]);
    if (isValidNameCandidate(candidate)) return candidate;
  }

  // Pattern 3: "This is <Name>"
  const thisIsMatch = text.match(/\bthis is\s+([A-Za-z][A-Za-z.\s'-]{1,35})/i);
  if (thisIsMatch) {
    const candidate = cleanExtractedName(thisIsMatch[1]);
    if (isValidNameCandidate(candidate)) return candidate;
  }

  // Pattern 4: "Name: <Name>"
  const labelMatch = text.match(/\bname\s*:\s*([A-Za-z][A-Za-z.\s'-]{1,35})/i);
  if (labelMatch) {
    const candidate = cleanExtractedName(labelMatch[1]);
    if (isValidNameCandidate(candidate)) return candidate;
  }

  return undefined;
}

function cleanExtractedName(raw: string): string {
  // Stop name capture before prepositions, conjunctions, or clause punctuation
  const stopIndex = raw.search(/\b(from|at|with|and|who|reaching|contacting|regarding|to|for|is)\b|[,;:\n]/i);
  let cleaned = stopIndex !== -1 ? raw.slice(0, stopIndex) : raw;
  cleaned = cleaned.replace(/\.$/, "").trim().replace(/\s+/g, " ");
  return cleaned;
}

function isValidNameCandidate(name: string): boolean {
  if (!name || name.length < 2 || name.length > 40) return false;

  const parts = name.split(/\s+/);
  // Ensure none of the name parts are common invalid words
  for (const p of parts) {
    if (INVALID_NAME_WORDS.has(p.toLowerCase())) {
      return false;
    }
  }

  // Must contain alphabetic characters
  return /^[A-Za-z][A-Za-z.\s'-]+$/.test(name);
}

/**
 * Extract organization or company name if explicitly stated.
 */
export function extractOrganization(text: string): string | undefined {
  if (!text) return undefined;

  // If text contains email addresses, strip them before extracting organization
  // so that phrases like "reach me at name@domain.com" do not falsely extract the email prefix as an organization
  const textWithoutEmail = text
    .replace(EMAIL_REGEX, "")
    .replace(/\b(?:at|reach me at|email at)\s*$/i, "")
    .trim();

  // Patterns: "from <Org>", "at <Org>", "representing <Org>"
  const orgMatch = textWithoutEmail.match(/\b(?:from|at|representing|with)\s+([A-Za-z0-9][A-Za-z0-9.&'\s-]{1,40})/i);
  if (!orgMatch) return undefined;

  let candidate = orgMatch[1].trim();
  // Cut off at punctuation or clause transitions
  const stopIndex = candidate.search(/\b(and|who|i|we|my|to|regarding|for|looking|reviewed|want|would)\b|[,.;:\n]/i);
  if (stopIndex !== -1) {
    candidate = candidate.slice(0, stopIndex).trim();
  }

  candidate = candidate.replace(/\s+/g, " ");
  if (candidate.length < 2 || candidate.length > 40) return undefined;

  // Check all words in candidate against invalid org words
  const words = candidate.toLowerCase().split(/\s+/);
  for (const w of words) {
    if (NON_ORG_WORDS.has(w) || INVALID_NAME_WORDS.has(w)) {
      return undefined;
    }
  }

  return candidate;
}

/**
 * Extract purpose of contact from visitor message.
 */
export function extractPurpose(text: string): string | undefined {
  if (!text) return undefined;

  // If the visitor explicitly stated intent:
  const purposeMatch = text.match(
    /\b(?:want to|would like to|looking to|interested in|regarding|about|to discuss|reaching out to)\s+([^.?!;\n]+)/i
  );

  if (purposeMatch) {
    const raw = purposeMatch[1].trim().replace(/\s+/g, " ");
    if (raw.length >= 6) {
      return raw.slice(0, 300);
    }
  }

  // If the message is long and informative (e.g. > 15 chars) and contains contact words
  if (
    text.length >= 15 &&
    /\b(opportunity|role|hire|project|interview|discuss|collab|work|freelance|consult|connect)\b/i.test(text)
  ) {
    // Clean out greeting & email from the text to form message summary
    return text
      .replace(EMAIL_REGEX, "")
      .replace(/\b(?:i am|i'm|my name is)\s+[A-Za-z.\s'-]+(?:from\s+[A-Za-z0-9.\s'-]+)?/i, "")
      .replace(/^[,\s.-]+/, "")
      .trim()
      .slice(0, 300);
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// 4. Multi-Turn Conversation History Extractor
// ---------------------------------------------------------------------------

/**
 * Scan entire conversation history to extract contact details chronologically.
 * Later turns safely override earlier turns (e.g. email corrections).
 *
 * @param history Full conversation history (treated strictly as read-only).
 * @param currentQuery Latest user message.
 */
export function extractContactContext(
  history: readonly ChatMessage[] = [],
  currentQuery: string
): ExtractedContactDetails {
  let name: string | undefined;
  let email: string | undefined;
  let organization: string | undefined;
  let purpose: string | undefined;
  let hasExplicitContactIntent = false;

  // Combine history user turns + current query in order
  const userTurns: string[] = [];
  for (const msg of history) {
    if (msg.role === "user" && msg.content) {
      userTurns.push(msg.content);
    }
  }
  userTurns.push(currentQuery);

  for (const turn of userTurns) {
    // Check contact intent keywords
    if (
      /\b(contact|reach|hire|email|phone|call|message|touch|collaborate|connect with lokesh|talk to lokesh|send|discuss a (role|job|opportunity))\b/i.test(
        turn
      )
    ) {
      hasExplicitContactIntent = true;
    }

    // Name extraction (first valid name stands unless updated)
    const foundName = extractName(turn);
    if (foundName) {
      name = foundName;
    }

    // Email extraction (later turns override earlier for corrections!)
    const foundEmail = extractEmail(turn);
    if (foundEmail) {
      email = foundEmail;
      hasExplicitContactIntent = true;
    }

    // Organization extraction
    const foundOrg = extractOrganization(turn);
    if (foundOrg) {
      organization = foundOrg;
    }

    // Purpose extraction
    const foundPurpose = extractPurpose(turn);
    if (foundPurpose) {
      purpose = foundPurpose;
    }
  }

  return {
    name,
    email,
    organization,
    purpose,
    hasExplicitContactIntent,
  };
}

// ---------------------------------------------------------------------------
// 5. Contact Flow Decision Engine
// ---------------------------------------------------------------------------

/**
 * Format serialized [[CONTACT_DRAFT]] marker safely with standard JSON encoding.
 */
export function formatContactDraft(draft: ContactDraft): string {
  const jsonStr = JSON.stringify({
    name: draft.name.trim(),
    email: draft.email.trim(),
    message: draft.message.trim(),
  });
  return `\n\n[[CONTACT_DRAFT]]${jsonStr}`;
}

/**
 * Process offline contact request using conversation memory.
 * Asks only for missing information and prepares draft when ready.
 */
export function processOfflineContactFlow(
  currentQuery: string,
  history: readonly ChatMessage[] = []
): ContactFlowResult {
  const extracted = extractContactContext(history, currentQuery);

  // Check if visitor explicitly changed subject or cancelled
  const isCancellation =
    /\b(nevermind|cancel|forget it|dont send|dont contact|tell me about his projects instead|change of mind)\b/i.test(
      currentQuery
    );

  if (isCancellation) {
    return {
      isContactFlow: false,
      status: "not_contact_flow",
      extracted,
      draft: null,
      responseMessage: "No problem! What else would you like to explore about Lokesh's work?",
      rawOutput: "No problem! What else would you like to explore about Lokesh's work?",
    };
  }

  // 1. If we have both Email and Purpose/Details -> Draft is complete!
  if (extracted.email) {
    const visitorName = extracted.name || "Portfolio Visitor";
    const orgSuffix = extracted.organization ? ` from ${extracted.organization}` : "";

    // Build authentic, comprehensive message text
    let messageBody = extracted.purpose || "";
    if (!messageBody || messageBody.length < 10) {
      messageBody = `Hi Lokesh, I'm ${visitorName}${orgSuffix} and I'd like to get in touch regarding an opportunity.`;
    } else if (extracted.organization && !messageBody.includes(extracted.organization)) {
      messageBody = `I'm ${visitorName} from ${extracted.organization}. ${messageBody}`;
    }

    const draft: ContactDraft = {
      name: visitorName,
      email: extracted.email,
      message: messageBody,
    };

    const draftMarker = formatContactDraft(draft);
    const greeting = extracted.name ? `Thanks, ${extracted.name}!` : "Thanks!";
    const responseMessage = [
      `${greeting} I have prepared an editable contact draft below with your details and message.`,
      "",
      "Please review the information or make any changes you'd like, then click **'Send to Lokesh'** to submit it.",
    ].join("\n");

    const rawOutput = `${responseMessage}${draftMarker}`;

    return {
      isContactFlow: true,
      status: "complete_draft_ready",
      extracted,
      draft,
      responseMessage,
      navAction: null,
      rawOutput,
    };
  }

  // 2. If we have Name/Organization/Purpose, but MISSING Email:
  if (extracted.name || extracted.organization || extracted.purpose) {
    const greeting = extracted.name ? `Nice to connect, ${extracted.name}!` : "I can certainly help you connect with Lokesh.";
    const orgReference = extracted.organization ? ` regarding ${extracted.organization}` : "";

    const responseMessage = [
      `${greeting} I can help prepare an editable message for Lokesh${orgReference}.`,
      "",
      "What is the best **email address** for him to reply to?",
      "",
      `*(You can also reach Lokesh directly via email at ${PROFILE.email} or by phone at ${PROFILE.phone}.)*`,
    ].join("\n");

    return {
      isContactFlow: true,
      status: "need_email",
      extracted,
      draft: null,
      responseMessage,
      navAction: { section: "contact", label: "Open Contact Form" },
      rawOutput: responseMessage,
    };
  }

  // 3. General contact inquiry (No name, no email, no purpose yet)
  const generalResponse = [
    "I'd be glad to help you get in touch with Lokesh Kagitha.",
    "",
    "Could you share your **name**, **email address**, and a brief note about what you'd like to discuss? I will set up an editable draft for you to review and send.",
    "",
    `You can also reach him directly via email at **${extracted.email || "kagithalokesh8@gmail.com"}** or by phone at **+91 7032817065**.`,
  ].join("\n");

  return {
    isContactFlow: true,
    status: "general_inquiry",
    extracted,
    draft: null,
    responseMessage: generalResponse,
    navAction: { section: "contact", label: "Open Contact Form" },
    rawOutput: generalResponse,
  };
}
