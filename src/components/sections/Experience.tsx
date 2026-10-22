"use client";

import React, { useEffect, useRef, useState } from "react";
import { TIMELINE, FREELANCE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";
import { openLokiContact } from "@/components/agent/LokiWidgetIntegration";

export function Experience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { scrollToTarget } = useScroll();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const el = sectionRef.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Start drawing when section enters middle of viewport
            const start = windowHeight * 0.7;
            const total = rect.height + windowHeight * 0.2;
            const current = start - rect.top;

            const progress = Math.min(1, Math.max(0, current / total));
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="section-padding relative">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-10 sm:mb-16">
          <SectionTag index="06" label="Trajectory" className="mb-2" />
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <SplitText
              text="Education & experience as one path"
              type="lines"
              accentText="."
              accentClassName="heading-accent ml-2"
            />
          </h2>
          <ScrollScrubParagraph
            text="A chronological timeline bridging foundational academics, specialized AI & ML engineering, and enterprise full-stack development."
            className="text-[#77756f] text-sm mt-3 max-w-xl"
          />
        </div>

        {/* Timeline Container with Dynamic Spine */}
        <div className="relative max-w-3xl mx-auto pl-4 sm:pl-10">
          {/* Background Pale Spine Line */}
          <div
            className="absolute left-[9px] sm:left-[19px] top-4 bottom-12 w-[2px] bg-[#0d0d0d]/10"
            aria-hidden="true"
          />

          {/* Active Ink Spine Line (draws with scroll progress) */}
          <div
            className="absolute left-[9px] sm:left-[19px] top-4 bottom-12 w-[2px] bg-[#0d0d0d] origin-top transition-transform duration-100 ease-out"
            style={{ transform: `scaleY(${scrollProgress})` }}
            aria-hidden="true"
          />

          {/* Timeline Stops */}
          <div className="space-y-10 sm:space-y-16">
            {TIMELINE.map((item, idx) => {
              // Calculate threshold when this stop should light up
              const stopThreshold = (idx + 0.5) / (TIMELINE.length + 1);
              const isLit = scrollProgress >= stopThreshold;

              return (
                <div
                  key={item.id}
                  className={`relative transition-all duration-500 ${
                    isLit ? "opacity-100 translate-x-0" : "opacity-50"
                  }`}
                >
                  {/* Stop Marker Node */}
                  <div
                    className={`absolute -left-[19px] sm:-left-[32px] top-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-400 ${
                      isLit
                        ? "border-[#0d0d0d] bg-[#0d0d0d] text-white shadow-md scale-110"
                        : "border-[#0d0d0d]/20 bg-[#f4f2ee] text-transparent"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Stop Card */}
                  <div className="card-base p-5 sm:p-8 ml-2 sm:ml-4 transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f4f2ee] text-[#0d0d0d] border border-[#0d0d0d]/10">
                        {item.year}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#77756f]">
                        {item.type === "experience"
                          ? "Industry Experience"
                          : item.type === "freelance"
                          ? "Freelance Project"
                          : "Academic Education"}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#0d0d0d] mt-2 mb-1 leading-snug break-words">
                      {item.title}
                    </h3>

                    <div className="font-medium text-sm text-[#77756f] mb-3">
                      {item.place}
                    </div>

                    <p className="text-sm text-[#3a3a3a] leading-relaxed">
                      {item.detail}
                    </p>

                    {item.type === "freelance" && (
                      <a
                        href={FREELANCE.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 px-3 py-2.5 min-h-[44px] font-mono text-xs text-[#0d0d0d] hover:text-[#3a3a3a] underline underline-offset-4 transition-colors"
                        aria-label="Visit Purnima Kalamkari live site (opens in new tab)"
                      >
                        Visit Live Site ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Ending Dashed Card: "Next — Your team?" */}
            <div className="relative pt-4">
              {/* Pulsing Marker */}
              <div
                className={`absolute -left-[19px] sm:-left-[32px] top-6 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-dashed border-[#0d0d0d] flex items-center justify-center ${
                  scrollProgress >= 0.85 ? "bg-[#0d0d0d] text-white" : "bg-transparent text-transparent"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d] animate-ping" />
              </div>

              <div className="rounded-[26px] border-2 border-dashed border-[#0d0d0d]/30 bg-white/50 p-5 sm:p-8 ml-2 sm:ml-4 transition-all duration-300 hover:border-[#0d0d0d] hover:bg-white">
                <div className="font-mono text-xs uppercase tracking-wider text-[#77756f] mb-2">
                  Up Next · 2026 &amp; Beyond
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0d0d0d] mb-2">
                  Next — Your team?
                </h3>
                <p className="text-sm text-[#3a3a3a] leading-relaxed max-w-lg mb-6">
                  Seeking an energetic, production-minded Full Stack Developer who communicates clearly and ships clean, high-performance software? Let&apos;s build together.
                </p>
                <button
                  onClick={() => openLokiContact()}
                  className="btn-primary w-full sm:w-auto min-h-[44px] justify-center text-xs"
                >
                  <span>Start a conversation</span>
                  <span className="text-[10px]">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
