"use client";

import React from "react";
import { CERTIFICATIONS } from "@/lib/data";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";

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
            <SectionTag index="05" label="Credentials" className="mb-2" />
            <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
              <SplitText
                text="Always learning"
                type="lines"
                accentText="."
                accentClassName="heading-accent ml-2"
              />
            </h2>
            <div className="font-mono text-xs text-[#77756f] mt-3 sm:mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>02 Verified Industry Certifications</span>
            </div>
            <ScrollScrubParagraph
              text="Demonstrated mastery across full stack enterprise architecture, Java frameworks, REST APIs, and database engineering."
              className="text-sm text-[#77756f] mt-3 sm:mt-4 leading-relaxed max-w-sm"
            />
          </div>

          {/* Right Column: Ink-Flood Rows (min 64px tall, active/focus on touch) */}
          <div className="divide-y divide-[#0d0d0d]/10 border-y border-[#0d0d0d]/10 rv" style={{ "--i": 1 } as React.CSSProperties}>
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.id}
                tabIndex={0}
                role="button"
                className="cert-row group px-4 sm:px-8 py-6 sm:py-10 min-h-[64px] focus-visible:outline-none"
              >
                {/* Ink Flood Background */}
                <div
                  className="cert-flood"
                  aria-hidden="true"
                  
                />

                {/* Content Container */}
                <div className="cert-content flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <span className="cert-num font-mono text-xs sm:text-sm text-[#a9a6a0] mt-1 sm:mt-0">
                      {cert.index}
                    </span>
                    <div>
                      <h3 className="cert-title text-lg sm:text-2xl font-bold tracking-tight text-[#0d0d0d] leading-snug">
                        {cert.title}
                      </h3>
                      <div className="cert-sub font-mono text-xs text-[#77756f] mt-1">
                        Issued by: {cert.issuer} {cert.year ? `· ${cert.year}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Sliding Arrow Icon with label visible on touch */}
                  <div className="flex items-center gap-2 self-end sm:self-center mt-2 sm:mt-0">
                    <span className="cert-verified text-xs font-mono uppercase tracking-wider text-[#77756f]">
                      Verified
                    </span>
                    <div className="cert-arrow w-10 h-10 rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-base">
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
