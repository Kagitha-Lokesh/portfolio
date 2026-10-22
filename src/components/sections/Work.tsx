"use client";

import React, { useState } from "react";
import { PROJECTS, Project } from "@/lib/data";
import { TechLogo } from "@/components/ui/TechLogo";
import { useScroll } from "@/lib/scroll";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";

export function Work() {
  const [activeProjectId, setActiveProjectId] = useState<string>(PROJECTS[0].id);
  const { scrollToTarget } = useScroll();

  const handleMobileToggle = (projectId: string) => {
    if (activeProjectId === projectId) {
      setActiveProjectId("");
    } else {
      setActiveProjectId(projectId);
      setTimeout(() => {
        scrollToTarget(`#work-panel-${projectId}`, -80);
      }, 150);
    }
  };

  return (
    <section id="work" className="section-padding relative">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-8 sm:mb-12">
          <SectionTag index="03" label="Selected Work" className="mb-2" />
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <SplitText
              text="Things I've built"
              type="lines"
              accentText="."
              accentClassName="heading-accent ml-2"
            />
          </h2>
          <ScrollScrubParagraph
            text="Full-stack platforms and interactive web applications engineered with modular architecture, resilient APIs, and responsive design systems."
            className="text-[#77756f] text-sm mt-3 max-w-xl"
          />
        </div>

        {/* Desktop: Horizontal Accordion Gallery (≥1024px untouched) */}
        <div className="hidden lg:flex gap-4 h-[min(78svh,620px)] w-full items-stretch">
          {PROJECTS.map((project) => {
            const isOpen = activeProjectId === project.id;

            return (
              <div
                key={project.id}
                onMouseEnter={() => setActiveProjectId(project.id)}
                onFocus={() => setActiveProjectId(project.id)}
                onClick={() => setActiveProjectId(project.id)}
                className={`work-panel relative rounded-[26px] overflow-hidden transition-all duration-700 cursor-pointer ${
                  isOpen
                    ? "flex-[8] bg-white border border-[#0d0d0d]/10 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.08)] cursor-default"
                    : "flex-[1] bg-white/70 hover:bg-white border border-[#0d0d0d]/10 hover:border-[#0d0d0d]/25 shadow-sm"
                }`}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                tabIndex={0}
                role="region"
                aria-label={`Project: ${project.title}`}
              >
                {!isOpen ? (
                  // Closed Spine View
                  <div className="h-full w-full p-6 flex flex-col justify-between items-center select-none">
                    <span className="font-mono text-xs font-semibold text-[#a9a6a0]">
                      {project.index}
                    </span>

                    {/* Vertical Title */}
                    <div className="my-auto [writing-mode:vertical-rl] rotate-180">
                      <span className="work-spine-title font-bold text-base tracking-tight text-[#0d0d0d] whitespace-nowrap inline-block">
                        {project.title}
                      </span>
                    </div>

                    {/* Plus Icon that rotates on hover */}
                    <div className="work-spine-plus w-8 h-8 rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-sm font-mono text-[#0d0d0d]">
                      +
                    </div>
                  </div>
                ) : (
                  // Open Full Panel View: Left content, Right illustrative mini-UI
                  <div className="h-full w-full p-8 lg:p-10 grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-8 items-center overflow-hidden animate-in fade-in duration-500">
                    {/* Left Column: Description, Features, Tech, CTA */}
                    <div className="flex flex-col justify-between h-full py-1">
                      <div>
                        {/* Kicker + Index */}
                        <div className="flex items-center gap-3 font-mono text-xs text-[#77756f] uppercase tracking-wider mb-3">
                          <span className="font-bold text-[#0d0d0d]">{project.index}</span>
                          <span>—</span>
                          <span>{project.kicker}</span>
                          <span className="ml-auto text-[#a9a6a0]">{project.year}</span>
                        </div>

                        {/* Title */}
                        <h3 className="heading-display text-2xl lg:text-3xl mb-4 text-[#0d0d0d]">
                          {project.title}
                        </h3>

                        {/* Résumé Description */}
                        <p className="text-[#3a3a3a] text-sm leading-relaxed mb-6">
                          {project.description}
                        </p>

                        {/* 2-Column Feature List from Résumé */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                          {project.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2 text-xs text-[#3a3a3a] leading-snug">
                              <span className="text-[#0d0d0d] font-mono mt-0.5">•</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tech Stack Chips + GitHub Button */}
                      <div className="pt-6 border-t border-[#0d0d0d]/10 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {project.tech.map((t) => (
                            <span
                              key={t}
                              className="tech-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/10 text-xs font-medium text-[#0d0d0d]"
                            >
                              <TechLogo name={t} size={14} />
                              <span>{t}</span>
                            </span>
                          ))}
                        </div>

                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-xs shrink-0"
                            aria-label={`View ${project.title} on GitHub (opens in new tab)`}
                          >
                            <span className="btn-roll">
                              <span className="btn-roll-inner" data-text="View on GitHub">View on GitHub</span>
                            </span>
                            <span className="arrow-move arrow-diag text-[10px]">↗</span>
                          </a>
                        )}
                        {project.demo && (
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-xs shrink-0"
                            aria-label="Visit Purnima Kalamkari live site (opens in new tab)"
                          >
                            <span className="btn-roll">
                              <span className="btn-roll-inner" data-text="Visit Live Site">Visit Live Site</span>
                            </span>
                            <span className="arrow-move arrow-diag text-[10px]">↗</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Illustrative Mini-UI in Pure CSS/Grayscale */}
                    <div className="h-full w-full rounded-2xl bg-[#f4f2ee] border border-[#0d0d0d]/10 p-5 flex flex-col justify-between overflow-hidden shadow-inner relative [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] transition-all duration-500">
                      <IllustrativeUI projectId={project.id} />
                      <div className="absolute bottom-3 right-4 font-mono text-[10px] text-[#3a3a3a] tracking-wider uppercase bg-white/95 px-2 py-0.5 rounded border border-[#0d0d0d]/15 shadow-sm font-semibold">
                        Illustrative UI
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical Accordion (<1024px) using CSS Grid 0fr -> 1fr animation */}
        <div className="lg:hidden flex flex-col gap-4">
          {PROJECTS.map((project) => {
            const isOpen = activeProjectId === project.id;

            return (
              <div
                key={project.id}
                id={`work-panel-${project.id}`}
                className="card-base overflow-hidden border border-[#0d0d0d]/10 scroll-mt-20"
              >
                {/* Header Toggle (min 44px) */}
                <button
                  onClick={() => handleMobileToggle(project.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left focus-visible:outline-none min-h-[56px]"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono text-xs text-[#a9a6a0]">
                      {project.index}
                    </span>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-[#0d0d0d]">
                        {project.title}
                      </h3>
                      <div className="font-mono text-[11px] text-[#77756f]">
                        {project.kicker}
                      </div>
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-sm font-mono shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45 bg-[#0d0d0d] text-white" : "text-[#0d0d0d]"}`}>
                    +
                  </div>
                </button>

                {/* Collapsible Content with CSS grid-template-rows animation (never unmounted) */}
                <div
                  className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-2 border-t border-[#0d0d0d]/10 space-y-4">
                      <p className="text-sm text-[#3a3a3a] leading-relaxed">
                        {project.description}
                      </p>

                      <div className="space-y-2">
                        {project.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2 text-xs text-[#3a3a3a]">
                            <span className="text-[#0d0d0d] font-mono mt-0.5">•</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-[#f4f2ee] p-3 sm:p-4 border border-[#0d0d0d]/10 relative min-h-[200px] overflow-hidden">
                        <IllustrativeUI projectId={project.id} />
                        <div className="absolute bottom-2 right-3 font-mono text-[10px] text-[#3a3a3a] tracking-wider uppercase bg-white/95 px-2 py-0.5 rounded border border-[#0d0d0d]/15 font-semibold shadow-sm">
                          Illustrative UI
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        {project.tech.map((t) => (
                          <span
                            key={t}
                            className="tech-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/10 text-[11px] font-medium text-[#0d0d0d]"
                          >
                            <TechLogo name={t} size={12} />
                            <span>{t}</span>
                          </span>
                        ))}
                      </div>

                      {project.github && (
                        <div className="pt-2">
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary w-full min-h-[48px] justify-center text-xs"
                          >
                            <span className="btn-roll">
                              <span className="btn-roll-inner" data-text="View on GitHub">View on GitHub</span>
                            </span>
                            <span className="arrow-move arrow-diag text-[10px]">↗</span>
                          </a>
                        </div>
                      )}
                      {project.demo && (
                        <div className="pt-2">
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary w-full min-h-[48px] justify-center text-xs"
                            aria-label="Visit Purnima Kalamkari live site (opens in new tab)"
                          >
                            <span className="btn-roll">
                              <span className="btn-roll-inner" data-text="Visit Live Site">Visit Live Site</span>
                            </span>
                            <span className="arrow-move arrow-diag text-[10px]">↗</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IllustrativeUI({ projectId }: { projectId: string }) {
  if (projectId === "javamentor") {
    return (
      <div className="w-full h-full flex flex-col justify-between text-[#0d0d0d] font-mono text-xs select-none">
        {/* Editor Title Bar */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#0d0d0d]/15 text-[11px]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3a3a3a] shrink-0" />
            <span className="font-semibold truncate">JavaMentor IDE</span>
            <span className="text-[#77756f] hidden sm:inline">· Module 04</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#0d0d0d] text-white text-[10px] shrink-0">
            Run ▶
          </span>
        </div>

        {/* Code Lines with horizontal scrollable pre block */}
        <div className="my-3 text-[10px] sm:text-[11px] bg-white/60 p-2.5 sm:p-3 rounded-lg border border-[#0d0d0d]/10 overflow-x-auto max-w-full">
          <div className="space-y-1 font-mono whitespace-pre sm:whitespace-normal">
            <div className="text-[#77756f]">1  public class FullStackEngine &#123;</div>
            <div className="pl-3 sm:pl-4 text-[#0d0d0d]">2    @Autowired private AuthService auth;</div>
            <div className="pl-3 sm:pl-4 text-[#0d0d0d]">3    public CompletableFuture&lt;User&gt; executeTask() &#123;</div>
            <div className="pl-6 sm:pl-8 text-[#3a3a3a]">4      return CompletableFuture.supplyAsync(() -&gt; &#123;</div>
            {/* Grayscale comment instead of green to adhere to white/black/gray rule */}
            <div className="pl-9 sm:pl-12 text-[#77756f] italic">5        // Auth, coding practice &amp; progress verified</div>
            <div className="pl-9 sm:pl-12 text-[#0d0d0d]">6        return auth.trackProgress(userId);</div>
            <div className="pl-6 sm:pl-8 text-[#3a3a3a]">7      &#125;);</div>
            <div className="pl-3 sm:pl-4 text-[#0d0d0d]">8    &#125;</div>
            <div className="text-[#77756f]">9  &#125;</div>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#0d0d0d]/10 flex items-center justify-between text-[9px] sm:text-[10px]">
          <span className="text-[#3a3a3a]">✔ Tests: 12 Passed · 0 Errors</span>
          <span className="font-bold text-[#0d0d0d]">Progress: 100%</span>
        </div>
      </div>
    );
  }

  if (projectId === "attendance-mgmt") {
    return (
      <div className="w-full h-full flex flex-col justify-between text-[#0d0d0d] font-mono text-xs select-none">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#0d0d0d]/15 text-[11px]">
          <span className="font-semibold truncate">HRM Attendance Portal</span>
          <span className="text-[#77756f] text-[10px] shrink-0">Live Sync</span>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 my-2.5">
          <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-[#0d0d0d]/10 text-center sm:text-left">
            <span className="text-[8px] sm:text-[9px] text-[#77756f] block uppercase">Present</span>
            <span className="text-sm sm:text-base font-bold text-[#0d0d0d]">138</span>
          </div>
          <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-[#0d0d0d]/10 text-center sm:text-left">
            <span className="text-[8px] sm:text-[9px] text-[#77756f] block uppercase">On Leave</span>
            <span className="text-sm sm:text-base font-bold text-[#3a3a3a]">04</span>
          </div>
          <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-[#0d0d0d]/10 text-center sm:text-left">
            <span className="text-[8px] sm:text-[9px] text-[#77756f] block uppercase">Pending</span>
            <span className="text-sm sm:text-base font-bold text-[#77756f]">02</span>
          </div>
        </div>

        {/* Employee Table Mock */}
        <div className="bg-white/70 rounded-lg p-2 sm:p-2.5 border border-[#0d0d0d]/10 divide-y divide-[#0d0d0d]/10 text-[9px] sm:text-[10px] overflow-hidden">
          <div className="pb-1 flex justify-between font-semibold text-[#77756f]">
            <span>EMPLOYEE</span>
            <span className="hidden sm:inline">CHECK-IN</span>
            <span>STATUS</span>
          </div>
          <div className="py-1.5 flex justify-between items-center text-[#3a3a3a]">
            <span className="truncate pr-2">Lokesh K. (Associate SE)</span>
            <span className="hidden sm:inline text-[9px]">09:02 AM</span>
            <span className="px-1.5 py-0.5 rounded bg-[#0d0d0d] text-white text-[8px] sm:text-[9px] shrink-0">Verified</span>
          </div>
          <div className="py-1.5 flex justify-between items-center text-[#3a3a3a]">
            <span className="truncate pr-2">Dev Team (HRM)</span>
            <span className="hidden sm:inline text-[9px]">09:15 AM</span>
            <span className="px-1.5 py-0.5 rounded bg-[#f4f2ee] border border-[#0d0d0d]/10 text-[8px] sm:text-[9px] shrink-0">Logged</span>
          </div>
        </div>
      </div>
    );
  }

  if (projectId === "purnima-kalamkari") {
    return (
      <div className="w-full h-full flex flex-col justify-between text-[#0d0d0d] font-mono text-xs select-none min-w-0">
        {/* Storefront Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#0d0d0d]/15 text-[11px] gap-2">
          <span className="font-semibold truncate min-w-0">Purnima Kalamkari</span>
          <span className="text-[#77756f] text-[10px] shrink-0">Storefront</span>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 my-2.5">
          {["Sarees", "Kurtis", "Dupattas"].map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 rounded-full border border-[#0d0d0d]/20 text-[9px] sm:text-[10px] font-mono text-[#3a3a3a] bg-white"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Product Tiles */}
        <div className="flex-1 grid grid-cols-2 gap-1.5 sm:gap-2 min-h-0">
          {[
            { name: "Kalamkari Saree", tag: "Free Size" },
            { name: "Block Print Kurti", tag: "S – XXL" },
          ].map((product) => (
            <div
              key={product.name}
              className="bg-white rounded-lg border border-[#0d0d0d]/10 p-2 sm:p-2.5 flex flex-col justify-between min-w-0"
            >
              <div className="w-full aspect-[4/3] rounded bg-[#f4f2ee] border border-[#0d0d0d]/10 mb-1.5" />
              <div className="font-medium text-[9px] sm:text-[10px] text-[#0d0d0d] truncate">{product.name}</div>
              <div className="text-[8px] sm:text-[9px] text-[#77756f] mt-0.5">{product.tag}</div>
            </div>
          ))}
        </div>

        {/* Bottom Bar: WhatsApp Order */}
        <div className="mt-2 pt-2 border-t border-[#0d0d0d]/10 flex items-center justify-between gap-2">
          <span className="text-[9px] sm:text-[10px] text-[#77756f] truncate">Order on WhatsApp</span>
          <span className="shrink-0 px-2 py-1 rounded-full bg-[#0d0d0d] text-white text-[8px] sm:text-[9px] font-medium">Chat ↗</span>
        </div>
      </div>
    );
  }

  // Fallback for any unknown project id
  return (
    <div className="w-full h-full flex items-center justify-center text-[#77756f] font-mono text-xs select-none">
      <span>Preview</span>
    </div>
  );
}
