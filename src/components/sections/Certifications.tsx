"use client";

import React from "react";
import { CERTIFICATIONS } from "@/lib/data";

export function Certifications() {
  return (
    <section
      id="certifications"
      className="w-full bg-white border-y border-[#0d0d0d]/10 py-16 sm:py-24 lg:py-32 relative overflow-hidden"
    >
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-8 lg:gap-16 items-start">
          {/* Left Column: Normal block on mobile, Sticky on >=1024px */}
          <div className="lg:sticky lg:top-28 rv mb-4 lg:mb-0">
            <div className="tag-mono mb-2">
              <span>04 — Credentials</span>
            </div>
            <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
              <span>Always learning</span>
              <span className="heading-accent ml-2">.</span>
            </h2>
            <div className="font-mono text-xs text-[#77756f] mt-3 sm:mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>02 Verified Industry Certifications</span>
            </div>
            <p className="text-sm text-[#77756f] mt-3 sm:mt-4 leading-relaxed max-w-sm">
              Demonstrated mastery across full stack enterprise architecture, Java frameworks, REST APIs, and database engineering.
            </p>
          </div>

          {/* Right Column: Ink-Flood Rows (min 64px tall, active/focus on touch) */}
          <div className="divide-y divide-[#0d0d0d]/10 border-y border-[#0d0d0d]/10 rv" style={{ "--i": 1 } as React.CSSProperties}>
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.id}
                tabIndex={0}
                role="button"
                className="cert-row group relative px-4 sm:px-8 py-6 sm:py-10 min-h-[64px] cursor-pointer overflow-hidden transition-colors duration-300 focus-visible:outline-none"
              >
                {/* Ink Flood Background */}
                <div
                  className="cert-flood absolute inset-0 bg-[#0d0d0d] pointer-events-none scale-x-0 transition-transform duration-500 origin-left"
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  aria-hidden="true"
                />

                {/* Content Container */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors duration-300">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <span className="cert-text font-mono text-xs sm:text-sm text-[#a9a6a0] transition-colors duration-300 mt-1 sm:mt-0">
                      {cert.index}
                    </span>
                    <div>
                      <h3 className="cert-text text-lg sm:text-2xl font-bold tracking-tight text-[#0d0d0d] transition-colors duration-300 leading-snug">
                        {cert.title}
                      </h3>
                      <div className="cert-sub font-mono text-xs text-[#77756f] transition-colors duration-300 mt-1">
                        Issued by: {cert.issuer} {cert.year ? `· ${cert.year}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Sliding Arrow Icon with label visible on touch */}
                  <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <span className="cert-verified text-xs font-mono uppercase tracking-wider text-[#77756f] transition-all duration-300">
                      Verified
                    </span>
                    <div className="cert-arrow w-10 h-10 rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-base transition-all duration-300">
                      ↗
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Desktop Hover state */
        @media (hover: hover) and (pointer: fine) {
          .cert-verified {
            opacity: 0;
            transform: translateX(4px);
          }
          .cert-arrow {
            transform: translateX(-4px);
          }
          .cert-row:hover .cert-flood,
          .cert-row:focus-visible .cert-flood {
            transform: scaleX(1);
          }
          .cert-row:hover .cert-text,
          .cert-row:focus-visible .cert-text {
            color: #ffffff !important;
          }
          .cert-row:hover .cert-sub,
          .cert-row:focus-visible .cert-sub {
            color: #a9a6a0 !important;
          }
          .cert-row:hover .cert-verified,
          .cert-row:focus-visible .cert-verified {
            opacity: 1;
            transform: translateX(0);
            color: rgba(255, 255, 255, 0.8) !important;
          }
          .cert-row:hover .cert-arrow,
          .cert-row:focus-visible .cert-arrow {
            border-color: rgba(255, 255, 255, 0.3) !important;
            color: #ffffff !important;
            transform: translateX(0);
          }
        }

        /* Touch / coarse device state: label is always visible, tap gives ink flood */
        @media (hover: none) or (pointer: coarse) {
          .cert-verified {
            opacity: 1 !important;
            transform: none !important;
          }
          .cert-row:active .cert-flood {
            transform: scaleX(1);
          }
          .cert-row:active .cert-text {
            color: #ffffff !important;
          }
          .cert-row:active .cert-sub {
            color: #a9a6a0 !important;
          }
          .cert-row:active .cert-verified {
            color: rgba(255, 255, 255, 0.8) !important;
          }
          .cert-row:active .cert-arrow {
            border-color: rgba(255, 255, 255, 0.3) !important;
            color: #ffffff !important;
          }
        }
      `}</style>
    </section>
  );
}
