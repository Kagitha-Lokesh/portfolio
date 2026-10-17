"use client";

import React, { useState } from "react";
import { SKILL_ELEMENTS, SKILL_FAMILIES, SkillElement } from "@/lib/data";
import { TechLogo, isBrand, getBrandColor } from "@/components/ui/TechLogo";

export function Skills() {
  const [activeFamily, setActiveFamily] = useState<string>("All");
  const [selectedSkill, setSelectedSkill] = useState<SkillElement>(SKILL_ELEMENTS[0]);

  const filteredSkills = SKILL_ELEMENTS;

  return (
    <section id="skills" className="section-padding relative">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-10">
          <div className="tag-mono mb-2">
            <span>02 — Stack</span>
          </div>
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <span>The periodic table of my stack</span>
            <span className="heading-accent ml-2">.</span>
          </h2>
          <p className="text-[#77756f] text-sm mt-3 max-w-xl">
            Hover or focus on any element to inspect its ecosystem integration, production applications, and architecture credentials.
          </p>
        </div>

        {/* Family Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mb-8 rv">
          {SKILL_FAMILIES.map((family) => {
            const isActive = activeFamily === family;
            return (
              <button
                key={family}
                onClick={() => setActiveFamily(family)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono tracking-tight transition-all duration-200 focus-visible:outline-none ${
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

        {/* Main Section Content: Periodic Grid + Sticky Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          {/* Periodic Table Grid: 8 columns desktop, 4 mobile */}
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
            {filteredSkills.map((skill, idx) => {
              const cols = 8;
              const row = Math.floor(idx / cols);
              const col = idx % cols;
              const delay = (row + col) * 40;

              const isMatch = activeFamily === "All" || skill.family === activeFamily;
              const isSelected = selectedSkill.name === skill.name;

              return (
                <button
                  key={skill.name}
                  onClick={() => setSelectedSkill(skill)}
                  onMouseEnter={() => setSelectedSkill(skill)}
                  onFocus={() => setSelectedSkill(skill)}
                  className={`group relative aspect-square p-2 sm:p-2.5 rounded-xl text-left flex flex-col justify-between transition-all duration-300 focus-visible:outline-none ${
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
                    <span>{String(skill.number).padStart(2, "0")}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.brandColor || "#77756f" }} />
                  </div>

                  {/* Centre: Large 2-letter Symbol */}
                  <div className="my-auto text-center w-full">
                    <span className="font-bold text-lg sm:text-xl tracking-tight text-[#0d0d0d] group-hover:scale-110 inline-block transition-transform duration-200">
                      {skill.symbol}
                    </span>
                  </div>

                  {/* Bottom: Name */}
                  <div className="w-full truncate text-[10px] font-medium text-[#3a3a3a] text-center leading-tight">
                    {skill.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inspector Panel: Sticky 320px wide (desktop) or below grid (mobile) */}
          <aside
            className="card-base p-6 lg:sticky lg:top-24 flex flex-col items-center text-center transition-all duration-300 rv"
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
