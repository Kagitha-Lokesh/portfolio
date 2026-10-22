"use client";

import React from "react";
import { FREELANCE } from "@/lib/data";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";

export function Freelance() {
  return (
    <section id="freelance" className="section-padding relative scroll-mt-20">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-8 sm:mb-12">
          <SectionTag index="04" label="Freelance" className="mb-2" />
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <SplitText
              text="Client work, shipped"
              type="lines"
              accentText="."
              accentClassName="heading-accent ml-2"
            />
          </h2>
          <ScrollScrubParagraph
            text="A complete ecommerce solution built for a handcrafted heritage brand — from customer storefront to owner admin dashboard, designed mobile-first and shipped to production."
            className="text-[#77756f] text-sm mt-3 max-w-xl"
          />
        </div>

        {/* Case Study Card */}
        <div className="card-base p-5 sm:p-8 rv" style={{ "--i": 0 } as React.CSSProperties}>

          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-[#0d0d0d]/10 mb-6">
            <div className="min-w-0">
              <div className="font-mono text-xs text-[#77756f] uppercase tracking-wider mb-1">
                Freelance &middot; {FREELANCE.period}
              </div>
              <h3 className="heading-display text-2xl sm:text-3xl text-[#0d0d0d] break-words">
                {FREELANCE.client}
              </h3>
              <div className="font-mono text-xs text-[#a9a6a0] mt-1">{FREELANCE.role}</div>
              <div className="text-xs text-[#77756f] mt-0.5 italic">{FREELANCE.tagline}</div>
            </div>
            <a
              href={FREELANCE.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs shrink-0 w-full lg:w-auto min-h-[48px] lg:min-h-[44px] justify-center"
              aria-label="Visit Purnima Kalamkari live site (opens in new tab)"
            >
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Visit Live Site">Visit Live Site</span>
              </span>
              <span className="arrow-move arrow-diag text-[10px]">↗</span>
            </a>
          </div>

          {/* Overview + Challenge — two columns on desktop */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-6 border-b border-[#0d0d0d]/10 mb-6 rv"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-2">
                Overview
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed break-words">{FREELANCE.overview}</p>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-2">
                Challenge
              </div>
              <p className="text-sm text-[#3a3a3a] leading-relaxed break-words">{FREELANCE.challenge}</p>
            </div>
          </div>

          {/* What I Built — two columns on desktop */}
          <div
            className="pb-6 border-b border-[#0d0d0d]/10 mb-6 rv"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-4">
              What I Built
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {FREELANCE.built.map((group) => (
                <div key={group.group} className="min-w-0">
                  <div className="font-mono text-xs font-semibold text-[#0d0d0d] mb-2">
                    {group.group}
                  </div>
                  <ul className="space-y-2">
                    {group.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#3a3a3a] leading-snug min-w-0">
                        <span className="text-[#0d0d0d] font-mono mt-0.5 shrink-0">•</span>
                        <span className="break-words min-w-0">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Facts Grid — 2 cols on mobile, 4 on md+ */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-6 border-b border-[#0d0d0d]/10 mb-6 rv"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            {FREELANCE.facts.map((fact) => (
              <div
                key={fact.label}
                className="bg-[#f4f2ee] rounded-xl p-3 sm:p-4 border border-[#0d0d0d]/10 min-w-0"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-1">
                  {fact.label}
                </div>
                <div className="font-bold text-sm text-[#0d0d0d] break-words leading-snug">{fact.value}</div>
              </div>
            ))}
          </div>

          {/* Stack Chips + Palette Swatches */}
          <div
            className="rv"
            style={{ "--i": 4 } as React.CSSProperties}
          >
            {/* Stack chips */}
            <div className="mb-6">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-3">
                Tech Stack
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FREELANCE.stack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex px-2.5 py-1 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/10 font-mono text-[11px] text-[#0d0d0d] break-words"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Brand Palette — content-only, client brand colours shown as data */}
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] mb-3">
                Client Brand Palette
              </div>
              <div className="grid grid-cols-4 gap-2">
                {FREELANCE.palette.map((swatch) => (
                  <div key={swatch.hex} className="flex flex-col items-center gap-1.5 min-w-0">
                    <div
                      className="w-full aspect-square rounded-xl border border-[#0d0d0d]/10 shadow-sm"
                      style={{ backgroundColor: swatch.hex }}
                      aria-label={`${swatch.name}: ${swatch.hex}`}
                    />
                    <div className="text-center min-w-0 w-full">
                      <div className="font-mono text-[10px] text-[#0d0d0d] font-medium truncate">
                        {swatch.name}
                      </div>
                      <div
                        className="font-mono text-[#77756f] leading-tight"
                        style={{ fontSize: "10px" }}
                      >
                        {swatch.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
