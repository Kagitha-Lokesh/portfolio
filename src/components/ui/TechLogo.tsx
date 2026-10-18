import React from "react";

export const BRAND_MAP: Record<string, { logo: string; color: string }> = {
  javascript: { logo: "/logos/javascript.svg", color: "#F7DF1E" },
  html5: { logo: "/logos/html5.svg", color: "#E34F26" },
  css3: { logo: "/logos/css3.svg", color: "#1572B6" },
  sql: { logo: "/logos/mysql.svg", color: "#4479A1" },
  mysql: { logo: "/logos/mysql.svg", color: "#4479A1" },
  java: { logo: "/logos/java.svg", color: "#5382A1" },
  "java (basic)": { logo: "/logos/java.svg", color: "#5382A1" },
  react: { logo: "/logos/react.svg", color: "#61DAFB" },
  "react.js": { logo: "/logos/react.svg", color: "#61DAFB" },
  nodejs: { logo: "/logos/nodejs.svg", color: "#339933" },
  "node.js": { logo: "/logos/nodejs.svg", color: "#339933" },
  express: { logo: "/logos/express.svg", color: "#000000" },
  "express.js": { logo: "/logos/express.svg", color: "#000000" },
  firebase: { logo: "/logos/firebase.svg", color: "#FFCA28" },
  git: { logo: "/logos/git.svg", color: "#F05032" },
  github: { logo: "/logos/github.svg", color: "#181717" },
  vscode: { logo: "/logos/vscode.svg", color: "#007ACC"},
  "vs code": { logo: "/logos/vscode.svg", color: "#007ACC" },
  postman: { logo: "/logos/postman.svg", color: "#FF6C37" },
  chatgpt: { logo: "/logos/chatgpt.svg", color: "#10A37F" },
  claude: { logo: "/logos/claude.svg", color: "#D97706" },
  "claude ai": { logo: "/logos/claude.svg", color: "#D97706" },
  antigravity: { logo: "/logos/antigravity.svg", color: "#4285F4" },
  "antigravity ai": { logo: "/logos/antigravity.svg", color: "#4285F4" },
  gsap: { logo: "/logos/gsap.svg", color: "#88CE02" },
  linkedin: { logo: "/logos/linkedin.svg", color: "#0A66C2" },
  leetcode: { logo: "/logos/leetcode.svg", color: "#FFA116" },
};

export const CONCEPT_MAP: Record<string, (size: number) => React.ReactNode> = {
  "responsive ui": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),
  canvas: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
      <path d="M2 2l7.586 7.586"></path>
      <circle cx="11" cy="11" r="2"></circle>
    </svg>
  ),
  "rest apis": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16"></path>
      <path d="M14 6l6 6-6 6"></path>
      <path d="M10 18l-6-6 6-6"></path>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  ai: (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z"></path>
      <circle cx="9" cy="10" r="1"></circle>
      <circle cx="15" cy="10" r="1"></circle>
      <line x1="10" y1="15" x2="14" y2="15"></line>
    </svg>
  ),
  "prompt engineering": (s) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17l6-6-6-6"></path>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  ),
};

export function isBrand(name: string): boolean {
  const key = name.toLowerCase().trim();
  return Boolean(BRAND_MAP[key]);
}

export function getBrandColor(name: string): string {
  const key = name.toLowerCase().trim();
  return BRAND_MAP[key]?.color || "#77756f";
}

interface TechLogoProps {
  name: string;
  size?: number;
  showGlow?: boolean;
  className?: string;
}

export function TechLogo({ name, size = 24, showGlow = false, className = "" }: TechLogoProps) {
  const key = name.toLowerCase().trim();
  const brand = BRAND_MAP[key];

  if (brand) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {showGlow && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-20 pointer-events-none transition-opacity duration-300"
            style={{ backgroundColor: brand.color }}
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo}
          alt={`${name} logo`}
          width={size}
          height={size}
          className="tech-logo-icon relative z-10 w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  const conceptRenderer = CONCEPT_MAP[key];
  if (conceptRenderer) {
    return (
      <div
        className={`relative inline-flex items-center justify-center text-[#0d0d0d] shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {conceptRenderer(size * 0.85)}
      </div>
    );
  }

  // Fallback geometric glyph
  return (
    <div
      className={`inline-flex items-center justify-center rounded border border-[#0d0d0d]/15 text-[10px] font-mono uppercase text-[#77756f] shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {name.slice(0, 2)}
    </div>
  );
}
