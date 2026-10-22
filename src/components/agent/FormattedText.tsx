"use client";

import React from "react";
import { ContactDraft, NavAction, ValidSectionId } from "./types";

interface FormattedTextProps {
  content: string;
}

const VALID_SECTIONS: ValidSectionId[] = [
  "work",
  "skills",
  "experience",
  "freelance",
  "certifications",
  "about",
  "contact",
];

// Regex to detect URLs (http or https only)
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function stripInternalMarkers(raw: string): string {
  // Strip complete or partial [[CONTACT_DRAFT]] and [[NAV_ACTION]] tokens cleanly
  return raw
    .replace(/\[\[CONTACT_DRAFT\]\][\s\S]*?(?=(\[\[NAV_ACTION|$))/g, "")
    .replace(/\[\[NAV_ACTION\]\][\s\S]*?(?=(\[\[CONTACT_DRAFT|$))/g, "")
    .replace(/\[\[CONTACT_DRAFT[\s\S]*$/, "")
    .replace(/\[\[NAV_ACTION[\s\S]*$/, "")
    .trim();
}

export function extractContactDraft(raw: string): ContactDraft | null {
  const match = raw.match(/\[\[CONTACT_DRAFT\]\](\{[\s\S]*?\})/);
  if (!match || !match[1]) return null;
  const jsonStr = match[1];

  // Try direct strict JSON parse first
  try {
    const parsed = JSON.parse(jsonStr);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.message === "string"
    ) {
      return {
        name: parsed.name.trim(),
        email: parsed.email.trim(),
        message: parsed.message.trim(),
      };
    }
  } catch {
    // LLMs may emit unescaped literal newlines/tabs inside JSON string literals.
    // Fallback: regex extraction of the three required fields
    const nameMatch = jsonStr.match(/"name"\s*:\s*"([^"]+)"/);
    const emailMatch = jsonStr.match(/"email"\s*:\s*"([^"]+)"/);
    const messageMatch = jsonStr.match(/"message"\s*:\s*"([\s\S]*?)"\s*}/);
    if (nameMatch && emailMatch && messageMatch) {
      return {
        name: nameMatch[1].trim(),
        email: emailMatch[1].trim(),
        message: messageMatch[1].replace(/\\n/g, "\n").trim(),
      };
    }
  }
  return null;
}

export function extractNavAction(raw: string): NavAction | null {
  const match = raw.match(/\[\[NAV_ACTION\]\](\{[\s\S]*?\})/);
  if (!match || !match[1]) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.section === "string" &&
      typeof parsed.label === "string"
    ) {
      const sectionLower = parsed.section.toLowerCase() as ValidSectionId;
      if (VALID_SECTIONS.includes(sectionLower)) {
        return {
          section: sectionLower,
          label: parsed.label.trim().slice(0, 50),
        };
      }
    }
  } catch {
    // Incomplete JSON during streaming
  }
  return null;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ content }) => {
  const cleanContent = stripInternalMarkers(content);

  if (!cleanContent) {
    return null;
  }

  // Split content by paragraphs
  const paragraphs = cleanContent.split(/\n\n+/);

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-[#0d0d0d]">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");
        return (
          <p key={pIdx} className="break-words">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderLine(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

function renderLine(line: string): React.ReactNode[] {
  // Split line by backticks for inline code, asterisks for bold, then URLs
  const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="font-mono text-[11px] bg-[#f4f2ee] px-1 py-0.5 rounded border border-[#0d0d0d]/10 text-[#0d0d0d]"
        >
          {codeText}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-[#0d0d0d]">
          {boldText}
        </strong>
      );
    }

    // Check for safe http: / https: URLs only
    const subParts = part.split(URL_REGEX);
    return (
      <React.Fragment key={index}>
        {subParts.map((sub, sIdx) => {
          if (sub.match(/^https?:\/\//)) {
            return (
              <a
                key={sIdx}
                href={sub}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[#77756f] transition-colors break-all font-medium"
              >
                {sub}
              </a>
            );
          }
          return sub;
        })}
      </React.Fragment>
    );
  });
}
