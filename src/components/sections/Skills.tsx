"use client";

import React, { useState, useEffect, useRef } from "react";
import { SKILL_ELEMENTS, SKILL_FAMILIES, SkillElement } from "@/lib/data";
import { TechLogo, isBrand, getBrandColor } from "@/components/ui/TechLogo";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";

export function Skills() {
  const [activeFamily, setActiveFamily] = useState<string>("All");
  const [selectedSkill, setSelectedSkill] = useState<SkillElement>(SKILL_ELEMENTS[0]);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const [colCount, setColCount] = useState(8);
  const inspectorRef = useRef<HTMLDivElement | null>(null);

  // Compute actual column count for diagonal wave animation delay
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w >= 1024) setColCount(8);
      else if (w >= 768) setColCount(6);
      else setColCount(4);
    };

    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Dismiss mobile inspector on click outside
  useEffect(() => {
    if (!isMobileInspectorOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        inspectorRef.current &&
        !inspectorRef.current.contains(target) &&
        !target.closest("[data-skill-tile]")
      ) {
        setIsMobileInspectorOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isMobileInspectorOpen]);

  const handleSkillSelect = (skill: SkillElement) => {
    if (selectedSkill.name === skill.name && isMobileInspectorOpen) {
      setIsMobileInspectorOpen(false);
    } else {
      setSelectedSkill(skill);
      setIsMobileInspectorOpen(true);
    }
  };

  const filteredSkills = SKILL_ELEMENTS;

  return (
    <section id="skills" className="section-padding relative">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-8 sm:mb-10">
          <SectionTag index="02" label="Stack" className="mb-2" />
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <SplitText
              text="The periodic table of my stack"
              type="lines"
              accentText="."
              accentClassName="heading-accent ml-2"
            />
          </h2>
          <ScrollScrubParagraph
            text="Hover or tap on any element to inspect its ecosystem integration, production applications, and architecture credentials."
            className="text-[#77756f] text-sm mt-3 max-w-xl"
          />
        </div>

        {/* Family Filter Chips: Single horizontally scrollable row on mobile with 44px targets */}
        <div className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x items-center gap-2 mb-6 sm:mb-8 pb-2 sm:pb-0 sm:flex-wrap rv">
          {SKILL_FAMILIES.map((family) => {
            const isActive = activeFamily === family;
            return (
              <button
                key={family}
                onClick={() => setActiveFamily(family)}
                className={`min-h-[44px] shrink-0 snap-start px-4 py-2 rounded-full text-xs font-mono tracking-tight transition-all duration-200 focus-visible:outline-none ${
                  isActive
                    ? "bg-[#0d0d0d] text-white shadow-sm"
                    : "bg-white text-[#77756f] hover:text-[#0d0d0d] border border-[#0d0d0d]/10 hover:border-[#0d0d0d]/30"
                }`}
              >
                {family}
              </button>
            );
          })}
        </div>

        {/* Mobile Sticky / Floating Inspector Strip pinned under filter chips */}
        {isMobileInspectorOpen && (
          <div
            ref={inspectorRef}
            className="lg:hidden card-base p-4 mb-6 relative animate-in fade-in slide-in-from-top-2 duration-200 border-2 border-[#0d0d0d] shadow-xl z-30"
          >
            <button
              onClick={() => setIsMobileInspectorOpen(false)}
              className="absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-[#77756f] hover:text-[#0d0d0d] focus-visible:outline-none"
              aria-label="Dismiss inspector"
            >
              ✕
            </button>
            <div className="flex items-center gap-3.5 pr-8">
              <div className="w-[72px] h-[72px] shrink-0 flex items-center justify-center bg-[#f4f2ee] rounded-xl p-2 border border-[#0d0d0d]/10">
                <TechLogo name={selectedSkill.name} size={50} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#77756f]">[{selectedSkill.symbol}]</span>
                  <h3 className="text-base font-bold text-[#0d0d0d] truncate">{selectedSkill.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/10 text-[#3a3a3a] shrink-0">
                    {selectedSkill.family}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedSkill.projects.map((proj, pIdx) => (
                    <span
                      key={pIdx}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-[#f4f2ee] text-[10px] font-medium text-[#0d0d0d]"
                    >
                      {proj}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Section Content: Periodic Grid + Sticky Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          {/* Periodic Table Grid: 4 cols at <640, 6 at md, 8 at lg */}
          <div className="skills-grid grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
            {filteredSkills.map((skill, idx) => {
              const row = Math.floor(idx / colCount);
              const col = idx % colCount;
              const delay = (row + col) * 40;

              const isMatch = activeFamily === "All" || skill.family === activeFamily;
              const isSelected = selectedSkill.name === skill.name;

              return (
                <button
                  key={skill.name}
                  data-skill-tile="true"
                  onClick={() => handleSkillSelect(skill)}
                  onMouseEnter={() => {
                    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                      setSelectedSkill(skill);
                    }
                  }}
                  onFocus={() => setSelectedSkill(skill)}
                  className={`skill-tile group relative aspect-square p-1.5 sm:p-2.5 rounded-xl text-left flex flex-col justify-between transition-all duration-300 focus-visible:outline-none ${
                    isSelected
                      ? "bg-white shadow-[0_12px_28px_-6px_rgba(0,0,0,0.12)] border-2 border-[#0d0d0d] scale-105 z-20"
                      : "bg-white/80 hover:bg-white border border-[#0d0d0d]/10 hover:border-[#0d0d0d]/30 hover:scale-102 hover:shadow-md"
                  } ${!isMatch ? "opacity-25 grayscale hover:opacity-80 hover:grayscale-0" : "opacity-100"}`}
                  style={{
                    animationDelay: `${delay}ms`,
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  aria-label={`${skill.name} (${skill.symbol}) - ${skill.family}`}
                >
                  {/* Top row: atomic number + family indicator */}
                  <div className="flex items-center justify-between w-full font-mono text-[9px] text-[#77756f]">
                    <span className="skill-atomic">{String(skill.number).padStart(2, "0")}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.brandColor || "#77756f" }} />
                  </div>

                  {/* Centre: Large 2-letter Symbol */}
                  <div className="my-auto text-center w-full">
                    <span className="skill-symbol font-bold text-base sm:text-xl tracking-tight text-[#0d0d0d] group-hover:scale-110 inline-block transition-transform duration-200">
                      {skill.symbol}
                    </span>
                  </div>

                  {/* Bottom: Name with fluid clamp and 2-line clamp */}
                  <div
                    title={skill.name}
                    className="w-full text-center leading-tight line-clamp-2 font-medium text-[#3a3a3a]"
                    style={{ fontSize: "clamp(8px, 2.2vw, 11px)" }}
                  >
                    {skill.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspector Panel: ≥1024px sticky 320px right panel */}
          <aside
            className="hidden lg:flex card-base p-6 lg:sticky lg:top-24 flex-col items-center text-center transition-all duration-300 rv"
            aria-label="Skill Inspector"
          >
            <div className="w-full flex items-center justify-between border-b border-[#0d0d0d]/10 pb-3 mb-6">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#77756f]">
                Element Inspector
              </span>
              <span className="font-mono text-xs font-semibold text-[#0d0d0d]">
                No. {String(selectedSkill.number).padStart(2, "0")}
              </span>
            </div>

            {/* 150px Brand Logo with Pop Animation & Soft Glow */}
            <div className="relative my-2 flex items-center justify-center h-[170px]">
              <div
                key={selectedSkill.name}
                className="animate-in fade-in zoom-in-95 duration-300 relative flex items-center justify-center"
              >
                <TechLogo
                  name={selectedSkill.name}
                  size={150}
                  showGlow={true}
                  className="transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Skill Details */}
            <div className="mt-4 w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="font-mono text-xs text-[#77756f]">
                  [{selectedSkill.symbol}]
                </span>
                <h3 className="text-xl font-bold tracking-tight text-[#0d0d0d]">
                  {selectedSkill.name}
                </h3>
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/10 font-mono text-[11px] text-[#3a3a3a] mb-5">
                {selectedSkill.family}
              </div>

              <div className="text-left w-full border-t border-[#0d0d0d]/10 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] block mb-2">
                  Implemented in:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.projects.map((proj, pIdx) => (
                    <span
                      key={pIdx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#f4f2ee] text-[11px] font-medium text-[#0d0d0d]"
                    >
                      {proj}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-left w-full text-[11px] text-[#77756f] border-t border-[#0d0d0d]/10 pt-3">
                <span className="block font-medium text-[#3a3a3a]">
                  {isBrand(selectedSkill.name)
                    ? "Official Industry Standard Tool"
                    : "Core Engineering Domain Skill"}
                </span>
                <span className="text-[10px] text-[#a9a6a0]">
                  Verified in active production projects &amp; academic coursework.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
