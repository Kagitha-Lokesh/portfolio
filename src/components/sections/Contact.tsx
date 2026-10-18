"use client";

import React, { useState, useEffect, useRef } from "react";
import { PROFILE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";
import { SectionTag } from "@/components/ui/SectionTag";

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [touchHopActive, setTouchHopActive] = useState(false);
  const headingRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(hover: none) or (pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isTouch || prefersReduced) return;

    const el = headingRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTouchHopActive(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.25 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const line1 = "Let's build";
  const line2 = "something together.";

  return (
    <footer
      id="contact"
      className="section-padding pb-[calc(2rem+var(--sab))] relative overflow-hidden bg-white border-t border-[#0d0d0d]/10"
    >
      <div className="content-container">
        {/* Section Heading Tag */}
        <SectionTag index="07" label="Contact" className="mb-3 sm:mb-4" />

        {/* Interactive Letters Heading with clamp sizing & hover/touch hop */}
        <div ref={headingRef} className="mb-10 sm:mb-14 select-none">
          <h2
            className="heading-display tracking-tight leading-[1.08] text-[#0d0d0d]"
            style={{ fontSize: "clamp(2rem, 7.5vw, 6rem)" }}
            aria-label="Let's build something together."
          >
            <div className="block">
              {line1.split("").map((char, i) => (
                <span
                  key={i}
                  className={`hop-char inline-block transition-transform duration-300 cursor-default ${
                    touchHopActive ? "touch-hop" : ""
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    animationDelay: `${i * 35}ms`,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
            <div className="block">
              {line2.split("").map((char, i) => (
                <span
                  key={i}
                  className={`hop-char inline-block transition-transform duration-300 cursor-default ${
                    touchHopActive ? "touch-hop" : ""
                  }`}
                  style={{
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    animationDelay: `${(line1.length + i) * 35}ms`,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>
          </h2>
        </div>

        {/* Main Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-8 lg:gap-12 items-end mb-16 sm:mb-20">
          <div className="space-y-6 sm:space-y-8">
            {/* Large Underlined Email + Copy Chip */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <a
                href={`mailto:${PROFILE.email}`}
                className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#0d0d0d] underline underline-offset-8 decoration-[#0d0d0d]/30 hover:decoration-[#0d0d0d] transition-colors break-all min-h-[44px] flex items-center py-2"
                style={{ overflowWrap: "anywhere" }}
              >
                {PROFILE.email}
              </a>

              <button
                onClick={handleCopyEmail}
                className="self-start sm:self-auto min-h-[44px] px-4 py-2.5 rounded-full border border-[#0d0d0d]/20 hover:border-[#0d0d0d] bg-[#f4f2ee] hover:bg-[#0d0d0d] hover:text-white text-xs font-mono transition-all duration-200 focus-visible:outline-none flex items-center justify-center shrink-0"
                aria-label="Copy email address"
              >
                <span aria-live="polite">
                  {copied ? "Copied ✓" : "Copy email ⎘"}
                </span>
              </button>
            </div>

            {/* Phone, GitHub, LinkedIn Links with min 48px tap height */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-6 lg:gap-8 pt-2 text-sm font-medium">
              <a
                href={PROFILE.phoneHref}
                className="min-h-[48px] flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors py-1"
              >
                <span className="font-mono text-xs text-[#a9a6a0]">TEL:</span>
                <span>{PROFILE.phone}</span>
              </a>

              {PROFILE.github && (
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw min-h-[48px] flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors py-1"
                >
                  <span className="font-mono text-xs text-[#a9a6a0]">GH:</span>
                  <span className="truncate">github.com/Kagitha-Lokesh</span>
                  <span className="arrow-move arrow-diag text-xs">↗</span>
                </a>
              )}

              {PROFILE.linkedin && (
                <a
                  href={PROFILE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw min-h-[48px] flex items-center gap-2 text-[#0d0d0d] hover:text-[#77756f] transition-colors py-1"
                >
                  <span className="font-mono text-xs text-[#a9a6a0]">IN:</span>
                  <span className="truncate">linkedin.com/in/lokesh-kagitha</span>
                  <span className="arrow-move arrow-diag text-xs">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Circular Slowly Spinning Badge: scaled to 96px on mobile, never overlapping text */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 self-start sm:self-center lg:self-end shrink-0 my-2">
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
              KL
            </div>
          </div>
        </div>

        {/* Bottom Footer Line: Stacked on mobile with safe-area bottom padding */}
        <div className="pt-6 sm:pt-8 border-t border-[#0d0d0d]/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-[#77756f] font-mono text-center sm:text-left">
          <div className="leading-relaxed">
            © {new Date().getFullYear()} {PROFILE.name}. All verified content from source résumé.
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline">Built with Next.js 15 &amp; Tailwind</span>
            <button
              onClick={() => scrollToTarget("#hero")}
              className="link-draw min-h-[44px] px-2 py-2 text-[#0d0d0d] font-semibold flex items-center gap-1"
            >
              <span>Back to top</span>
              <span className="arrow-move arrow-down rotate-180 text-xs">↓</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (hover: hover) and (pointer: fine) {
          .hop-char:hover {
            transform: translateY(-0.75rem);
            color: #77756f;
          }
        }
        @keyframes touchHopKeyframe {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-0.75rem);
            color: #77756f;
          }
        }
        :global(.touch-hop) {
          animation: touchHopKeyframe 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </footer>
  );
}
