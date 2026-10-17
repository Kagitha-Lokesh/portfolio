"use client";

import React, { useState } from "react";
import { PROFILE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";

export function Contact() {
  const [copied, setCopied] = useState(false);
  const { scrollToTarget } = useScroll();

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  const line1 = "Let's build";
  const line2 = "something together.";

  return (
    <footer id="contact" className="section-padding pb-12 relative overflow-hidden bg-white border-t border-[#0d0d0d]/10">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="tag-mono mb-4">
          <span>07 — Contact</span>
        </div>

        {/* Huge Interactive Bouncing Letters Heading */}
        <div className="mb-14 select-none">
          <h2 className="heading-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05]">
            <div className="block">
              {line1.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block transition-transform duration-300 hover:-translate-y-3 hover:text-[#77756f] cursor-default"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
            <div className="block">
              {line2.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block transition-transform duration-300 hover:-translate-y-3 hover:text-[#77756f] cursor-default"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </h2>
        </div>

        {/* Main Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-12 items-end mb-20">
          <div className="space-y-8">
            {/* Large Underlined Email + Copy Chip */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${PROFILE.email}`}
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#0d0d0d] underline underline-offset-8 decoration-[#0d0d0d]/30 hover:decoration-[#0d0d0d] transition-colors"
              >
                {PROFILE.email}
              </a>

              <button
                onClick={handleCopyEmail}
                className="px-4 py-2 rounded-full border border-[#0d0d0d]/20 hover:border-[#0d0d0d] bg-[#f4f2ee] hover:bg-[#0d0d0d] hover:text-white text-xs font-mono transition-all duration-200 focus-visible:outline-none"
                aria-label="Copy email address"
              >
                <span aria-live="polite">
                  {copied ? "Copied ✓" : "Copy email ⎘"}
                </span>
              </button>
            </div>

            {/* Phone, GitHub, LinkedIn Links */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 text-sm font-medium">
              <a
                href={PROFILE.phoneHref}
                className="flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors"
              >
                <span className="font-mono text-xs text-[#a9a6a0]">TEL:</span>
                <span>{PROFILE.phone}</span>
              </a>

              {PROFILE.github && (
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors"
                >
                  <span className="font-mono text-xs text-[#a9a6a0]">GH:</span>
                  <span>github.com/Kagitha-Lokesh</span>
                  <span className="text-xs">↗</span>
                </a>
              )}

              {PROFILE.linkedin && (
                <a
                  href={PROFILE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors"
                >
                  <span className="font-mono text-xs text-[#a9a6a0]">IN:</span>
                  <span>linkedin.com/in/lokesh-kagitha</span>
                  <span className="text-xs">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Circular Slowly Spinning "Say Hello" Badge */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 self-center lg:self-end shrink-0">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full animate-spin"
              style={{ animationDuration: "20s", animationTimingFunction: "linear" }}
              aria-hidden="true"
            >
              <defs>
                <path
                  id="circlePath"
                  d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                />
              </defs>
              <text fontSize="9.2" letterSpacing="2.5" className="font-mono uppercase fill-[#0d0d0d]">
                <textPath href="#circlePath">
                  · SAY HELLO · GET IN TOUCH · LET&apos;S BUILD
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-[#0d0d0d]">
              LK
            </div>
          </div>
        </div>

        {/* Bottom Footer Line */}
        <div className="pt-8 border-t border-[#0d0d0d]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#77756f] font-mono">
          <div>
            © {new Date().getFullYear()} {PROFILE.name}. All verified content from source résumé.
          </div>

          <div className="flex items-center gap-6">
            <span>Built with Next.js 15 &amp; Tailwind</span>
            <button
              onClick={() => scrollToTarget("#hero")}
              className="text-[#0d0d0d] hover:underline font-semibold"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
