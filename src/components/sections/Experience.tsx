"use client";

import React, { useEffect, useRef, useState } from "react";
import { TIMELINE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";

export function Experience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { scrollToTarget } = useScroll();

  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start drawing when section enters middle of viewport
      const start = windowHeight * 0.7;
      const total = rect.height + windowHeight * 0.2;
      const current = start - rect.top;

      const progress = Math.min(1, Math.max(0, current / total));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="experience" ref={sectionRef} className="section-padding relative">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-16">
          <div className="tag-mono mb-2">
            <span>05 — Trajectory</span>
          </div>
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <span>Education &amp; experience as one path</span>
            <span className="heading-accent ml-2">.</span>
          </h2>
          <p className="text-[#77756f] text-sm mt-3 max-w-xl">
            A chronological timeline bridging foundational academics, specialized AI &amp; ML engineering, and enterprise full-stack development.
          </p>
        </div>

        {/* Timeline Container with Dynamic Spine */}
        <div className="relative max-w-3xl mx-auto pl-6 sm:pl-10">
          {/* Background Pale Spine Line */}
          <div
            className="absolute left-[11px] sm:left-[19px] top-4 bottom-12 w-[2px] bg-[#0d0d0d]/10"
            aria-hidden="true"
          />

          {/* Active Ink Spine Line (draws with scroll progress) */}
          <div
            className="absolute left-[11px] sm:left-[19px] top-4 bottom-12 w-[2px] bg-[#0d0d0d] origin-top transition-transform duration-100 ease-out"
            style={{ transform: `scaleY(${scrollProgress})` }}
            aria-hidden="true"
          />

          {/* Timeline Stops */}
          <div className="space-y-12 sm:space-y-16">
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
                    className={`absolute -left-[24px] sm:-left-[32px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-400 ${
                      isLit
                        ? "border-[#0d0d0d] bg-[#0d0d0d] text-white shadow-md scale-110"
                        : "border-[#0d0d0d]/20 bg-[#f4f2ee] text-transparent"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Stop Card */}
                  <div className="card-base p-6 sm:p-8 ml-4 transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f4f2ee] text-[#0d0d0d] border border-[#0d0d0d]/10">
                        {item.year}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#77756f]">
                        {item.type === "experience" ? "Industry Experience" : "Academic Education"}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d0d] mt-2 mb-1">
                      {item.title}
                    </h3>

                    <div className="font-medium text-sm text-[#77756f] mb-3">
                      {item.place}
                    </div>

                    <p className="text-sm text-[#3a3a3a] leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Ending Dashed Card: "Next — Your team?" */}
            <div className="relative pt-4">
              {/* Pulsing Marker */}
              <div
                className={`absolute -left-[24px] sm:-left-[32px] top-6 w-6 h-6 rounded-full border-2 border-dashed border-[#0d0d0d] flex items-center justify-center ${
                  scrollProgress >= 0.85 ? "bg-[#0d0d0d] text-white" : "bg-transparent text-transparent"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-ping" />
              </div>

              <div className="rounded-[26px] border-2 border-dashed border-[#0d0d0d]/30 bg-white/50 p-8 ml-4 transition-all duration-300 hover:border-[#0d0d0d] hover:bg-white">
                <div className="font-mono text-xs uppercase tracking-wider text-[#77756f] mb-2">
                  Up Next · 2026 &amp; Beyond
                </div>
                <h3 className="text-2xl font-bold text-[#0d0d0d] mb-2">
                  Next — Your team?
                </h3>
                <p className="text-sm text-[#3a3a3a] leading-relaxed max-w-lg mb-6">
                  Seeking an energetic, production-minded Full Stack Developer who communicates clearly and ships clean, high-performance software? Let&apos;s build together.
                </p>
                <button
                  onClick={() => scrollToTarget("#contact")}
                  className="btn-primary text-xs"
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
