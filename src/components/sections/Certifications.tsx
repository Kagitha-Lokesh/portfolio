"use client";

import React from "react";
import { CERTIFICATIONS } from "@/lib/data";

export function Certifications() {
  return (
    <section
      id="certifications"
      className="w-full bg-white border-y border-[#0d0d0d]/10 py-24 sm:py-32 relative overflow-hidden"
    >
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-12 lg:gap-16 items-start">
          {/* Left Column: Sticky Heading and Count */}
          <div className="lg:sticky lg:top-28 rv">
            <div className="tag-mono mb-2">
              <span>04 — Credentials</span>
            </div>
            <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl mb-4">
              <span>Always learning</span>
              <span className="heading-accent ml-2">.</span>
            </h2>
            <div className="font-mono text-xs text-[#77756f] mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>02 Verified Industry Certifications</span>
            </div>
            <p className="text-sm text-[#77756f] mt-4 leading-relaxed max-w-sm">
              Demonstrated mastery across full stack enterprise architecture, Java frameworks, REST APIs, and database engineering.
            </p>
          </div>

          {/* Right Column: Ink-Flood Rows */}
          <div className="divide-y divide-[#0d0d0d]/10 border-y border-[#0d0d0d]/10 rv" style={{ "--i": 1 } as React.CSSProperties}>
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.id}
                tabIndex={0}
                className="group relative px-6 sm:px-8 py-8 sm:py-10 cursor-pointer overflow-hidden transition-colors duration-400 focus-visible:outline-none"
              >
                {/* Ink Flood Background (scaleX 0 -> 1 on hover/focus) */}
                <div
                  className="absolute inset-0 bg-[#0d0d0d] pointer-events-none scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 transition-transform duration-500 origin-left"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  aria-hidden="true"
                />

                {/* Content Container (z-10 on top of ink flood) */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-400 group-hover:text-white group-focus:text-white">
                  <div className="flex items-start sm:items-center gap-6">
                    <span className="font-mono text-xs sm:text-sm text-[#a9a6a0] group-hover:text-[#77756f] group-focus:text-[#77756f] transition-colors duration-300 mt-1 sm:mt-0">
                      {cert.index}
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d0d] group-hover:text-white group-focus:text-white transition-colors duration-300">
                        {cert.title}
                      </h3>
                      <div className="font-mono text-xs text-[#77756f] group-hover:text-[#a9a6a0] group-focus:text-[#a9a6a0] transition-colors duration-300 mt-1">
                        Issued by: {cert.issuer} {cert.year ? `· ${cert.year}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Sliding Arrow Icon */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#77756f] group-hover:text-white/80 group-focus:text-white/80 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
                      Verified
                    </span>
                    <div className="w-10 h-10 rounded-full border border-[#0d0d0d]/15 group-hover:border-white/30 group-focus:border-white/30 flex items-center justify-center text-base transform -translate-x-2 group-hover:translate-x-0 group-focus:translate-x-0 transition-transform duration-300">
                      ↗
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
