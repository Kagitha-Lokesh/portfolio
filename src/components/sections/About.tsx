"use client";

import React, { useState, useEffect, useRef } from "react";
import { PROFILE, EDUCATION, EXPERIENCE } from "@/lib/data";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { ScrollScrubParagraph } from "@/components/ui/ScrollScrubParagraph";

export function About() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const [angle, setAngle] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const isVisibleRef = useRef(true);
  const physicsRef = useRef({
    angle: 0,
    velocity: 0,
    targetAngle: 0,
    lastTime: performance.now(),
    lastPointerX: 0,
  });

  // Spring physics for lanyard pendulum motion with battery-saving IntersectionObserver
  useEffect(() => {
    let animId: number;

    const sectionEl = sectionRef.current;
    if (sectionEl) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisibleRef.current = entry.isIntersecting;
            if (entry.isIntersecting) {
              physicsRef.current.lastTime = performance.now();
            }
          });
        },
        { threshold: 0.05 }
      );
      io.observe(sectionEl);
      // cleanup io in return
    }

    const updatePhysics = (now: number) => {
      if (isVisibleRef.current) {
        const dt = Math.min((now - physicsRef.current.lastTime) / 1000, 0.05);
        physicsRef.current.lastTime = now;

        // Subtle natural idle sway (period ~ 3.5s)
        const idleSway = Math.sin(now * 0.0018) * 1.5;

        // Spring constants
        const k = 18.0; // Spring stiffness
        const damping = 3.2; // Damping ratio

        const displacement = physicsRef.current.angle - idleSway;
        const springForce = -k * displacement;
        const dampingForce = -damping * physicsRef.current.velocity;
        const acceleration = springForce + dampingForce;

        physicsRef.current.velocity += acceleration * dt;
        physicsRef.current.angle += physicsRef.current.velocity * dt;

        setAngle(physicsRef.current.angle);
      } else {
        physicsRef.current.lastTime = now;
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);

    const handlePointerMove = (e: MouseEvent) => {
      const currentX = e.clientX;
      const deltaX = currentX - physicsRef.current.lastPointerX;
      physicsRef.current.lastPointerX = currentX;

      if (Math.abs(deltaX) > 0.5) {
        physicsRef.current.velocity += Math.max(-15, Math.min(15, deltaX * 0.4));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        physicsRef.current.lastPointerX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - physicsRef.current.lastPointerX;
        physicsRef.current.lastPointerX = currentX;

        if (Math.abs(deltaX) > 0.5) {
          physicsRef.current.velocity += Math.max(-15, Math.min(15, deltaX * 0.45));
        }
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsFlipped((prev) => !prev);
    }
  };

  const currentEdu = EDUCATION[0];
  const currentExp = EXPERIENCE[0];

  return (
    <section id="about" ref={sectionRef} className="section-padding relative overflow-hidden">
      <div className="content-container">
        {/* Section Heading Tag */}
        <div className="mb-8 sm:mb-12">
          <SectionTag index="01" label="About" className="mb-2" />
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
            <SplitText
              text="Engineering with purpose"
              type="lines"
              accentText="."
              accentClassName="heading-accent ml-2"
            />
          </h2>
        </div>

        {/* 3-Column Equal Height Grid: On mobile ID card (order-1) -> Bio (order-2) -> Facts (order-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] gap-8 items-stretch">
          {/* Left Column: Bio & Verbatim Summary - order-2 on mobile, order-1 on lg */}
          <div className="card-base p-6 sm:p-10 flex flex-col justify-between rv order-2 lg:order-1">
            <div>
              <span className="font-mono text-xs text-[#77756f] uppercase tracking-wider block mb-4">
                Profile Overview
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-[#0d0d0d] mb-4">
                Hi, I&apos;m {PROFILE.name}.
              </h3>
              <ScrollScrubParagraph
                text={PROFILE.resumeSummary}
                className="text-[#3a3a3a] text-base leading-relaxed mb-4"
              />
              <ScrollScrubParagraph
                text={PROFILE.shortLine}
                className="text-[#77756f] text-sm leading-relaxed"
              />
            </div>

            <div className="pt-6 sm:pt-8 mt-6 border-t border-[#0d0d0d]/10 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a
                href={PROFILE.resumePath}
                download="Lokesh_Kagitha_Resume.pdf"
                className="btn-primary min-h-[44px] text-xs px-4 py-2.5"
              >
                <span className="btn-roll">
                  <span className="btn-roll-inner" data-text="Download Résumé">Download Résumé</span>
                </span>
                <span className="arrow-move arrow-down text-[10px]">↓</span>
              </a>

              {PROFILE.github && (
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary min-h-[44px] text-xs px-4 py-2.5"
                >
                  <span className="btn-roll">
                    <span className="btn-roll-inner" data-text="GitHub">GitHub</span>
                  </span>
                  <span className="arrow-move arrow-diag text-[10px]">↗</span>
                </a>
              )}

              {PROFILE.linkedin && (
                <a
                  href={PROFILE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary min-h-[44px] text-xs px-4 py-2.5"
                >
                  <span className="btn-roll">
                    <span className="btn-roll-inner" data-text="LinkedIn">LinkedIn</span>
                  </span>
                  <span className="arrow-move arrow-diag text-[10px]">↗</span>
                </a>
              )}

              {PROFILE.instagram && (
                <a
                  href={PROFILE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary min-h-[44px] text-xs px-4 py-2.5"
                >
                  <span className="btn-roll">
                    <span className="btn-roll-inner" data-text="Instagram">Instagram</span>
                  </span>
                  <span className="arrow-move arrow-diag text-[10px]">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Centre Column: Hanging Lanyard ID Card - order-1 on mobile, order-2 on lg */}
          <div
            ref={cardContainerRef}
            className="flex flex-col items-center justify-start min-h-0 lg:min-h-[490px] py-2 rv order-1 lg:order-2 overflow-visible w-full"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {/* Lanyard Top Strap */}
            <div className="relative flex flex-col items-center z-20">
              {/* Lanyard Strap: 30x56px with scrolling vertical text */}
              <div
                className="w-[30px] h-[56px] bg-[#1a1a1a] rounded-t-sm shadow-md overflow-hidden relative flex items-center justify-center border-x border-[#333333]"
                style={{
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-70">
                  <span
                    className="font-mono text-[6px] tracking-widest text-[#f4f2ee] uppercase whitespace-nowrap rotate-90 select-none animate-pulse"
                  >
                    DEV ID · KL · 2026
                  </span>
                </div>
              </div>

              {/* Metallic Clip Clasp */}
              <div className="relative -mt-1 flex flex-col items-center">
                {/* Silver Metal Swivel Clasp */}
                <div
                  className="w-4 h-4 rounded-full border-2 border-[#b0b0b0] bg-gradient-to-b from-[#e0e0e0] to-[#8c8c8c] shadow-sm"
                  aria-hidden="true"
                />
                <div
                  className="w-2.5 h-3 bg-gradient-to-r from-[#d9d9d9] via-[#ffffff] to-[#a6a6a6] rounded-sm -mt-1 shadow"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Pendulum Swinging & Flipping Card Container */}
            <div
              className="relative -mt-1 cursor-pointer select-none max-w-full flex flex-col items-center"
              style={{
                transformOrigin: "top center",
                transform: `rotate(${angle}deg)`,
                perspective: "1000px",
              }}
              onMouseEnter={() => {
                if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  setIsFlipped(true);
                }
              }}
              onMouseLeave={() => {
                if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  setIsFlipped(false);
                }
              }}
              onClick={() => setIsFlipped((prev) => !prev)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="button"
              aria-pressed={isFlipped}
              aria-label={`Developer ID badge for ${PROFILE.name}. Press Enter or Space to flip card.`}
            >
              {/* Card Frame scaled so it never exceeds 100% - 2*gutter */}
              <div
                className="relative w-[300px] max-w-[calc(100vw-3rem)] h-[404px] rounded-[22px] transition-transform duration-700 shadow-2xl"
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* CARD FRONT */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[22px] bg-white border border-[#0d0d0d]/15 shadow-xl p-5 flex flex-col justify-between overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  {/* Top Notch Hole */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-[#f4f2ee] border border-[#0d0d0d]/15" />

                  {/* Black Top Header Band */}
                  <div className="mt-3 -mx-5 px-5 py-2.5 bg-[#0d0d0d] text-white flex items-center justify-between">
                    <span className="font-mono text-[9px] tracking-widest font-semibold">
                      DEVELOPER ID
                    </span>
                    <span className="font-mono text-[8px] text-[#a9a6a0]">
                      SEC-PASS
                    </span>
                  </div>

                  {/* Photo Head-to-shirt 128x156 in frame */}
                  <div className="flex flex-col items-center mt-3">
                    <div className="relative group w-[128px] h-[156px] rounded-xl p-1 bg-gradient-to-b from-[#e9e6e0] to-[#ffffff] border border-[#0d0d0d]/15 shadow-sm overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/portrait-bust.webp"
                        alt={`Portrait of ${PROFILE.name}`}
                        className="w-full h-full object-cover rounded-lg transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 rounded-lg pointer-events-none ring-1 ring-inset ring-black/5" />
                    </div>

                    <div className="mt-2.5 text-center">
                      <div className="font-bold text-sm text-[#0d0d0d] tracking-tight">
                        {PROFILE.name}
                      </div>
                      <div className="text-[11px] font-medium text-[#77756f]">
                        {PROFILE.role}
                      </div>
                    </div>
                  </div>

                  {/* ID Details Table */}
                  <div className="grid grid-cols-3 gap-1 text-[9px] font-mono border-t border-b border-[#0d0d0d]/10 py-1.5 px-1 bg-[#fbfbfa] rounded">
                    <div>
                      <span className="text-[#a9a6a0] block text-[7px] uppercase">
                        ID No.
                      </span>
                      <span className="font-semibold text-[#0d0d0d]">
                        {PROFILE.idNo}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#a9a6a0] block text-[7px] uppercase">
                        Dept.
                      </span>
                      <span className="font-semibold text-[#0d0d0d]">
                        {PROFILE.department}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#a9a6a0] block text-[7px] uppercase">
                        Valid Till
                      </span>
                      <span className="font-semibold text-[#0d0d0d]">
                        {PROFILE.validTill}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Barcode and Hologram Sticker */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Realistic Barcode */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-[2px] h-5">
                        {[2, 1, 3, 1, 1, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3].map(
                          (w, i) => (
                            <span
                              key={i}
                              className="bg-[#0d0d0d] h-full"
                              style={{ width: `${w}px` }}
                            />
                          )
                        )}
                      </div>
                      <span className="font-mono text-[7px] text-[#77756f] tracking-widest">
                        *LK-7032817065*
                      </span>
                    </div>

                    {/* Holographic Security Sticker */}
                    <div
                      className="w-8 h-8 rounded-full border border-[#0d0d0d]/20 flex items-center justify-center p-0.5"
                      style={{
                        background:
                          "radial-gradient(circle, #e5e5e5 0%, #a3a3a3 60%, #737373 100%)",
                      }}
                      title="Verified Identity"
                    >
                      <div className="w-full h-full rounded-full border border-white/50 flex items-center justify-center font-mono text-[7px] text-[#171717] font-bold">
                        KL
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD BACK */}
                <div
                  className="absolute inset-0 w-full h-full rounded-[22px] bg-[#0d0d0d] text-white border border-[#333333] shadow-xl p-5 flex flex-col justify-between overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  {/* Top Notch Hole */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-[#1a1a1a] border border-white/10" />

                  {/* Header */}
                  <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-[10px] tracking-widest font-semibold text-white">
                      WHAT I AM
                    </span>
                    <span className="font-mono text-[8px] text-[#a9a6a0]">
                      VERIFIED DOSSIER
                    </span>
                  </div>

                  {/* 4-5 Lines strictly from résumé */}
                  <div className="space-y-2 text-[11px] text-[#d6d3cd] leading-tight my-auto">
                    <p className="flex items-start gap-2">
                      <span className="text-[#a9a6a0] font-mono text-[9px] mt-0.5">
                        01
                      </span>
                      <span>
                        <strong className="text-white">Role:</strong> Full Stack Developer specializing in React.js, Node.js &amp; REST APIs.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#a9a6a0] font-mono text-[9px] mt-0.5">
                        02
                      </span>
                      <span>
                        <strong className="text-white">Education:</strong> B.Tech in CSE (AI &amp; ML) with an 8.0 CGPA from SVIET.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#a9a6a0] font-mono text-[9px] mt-0.5">
                        03
                      </span>
                      <span>
                        <strong className="text-white">Experience:</strong> Associate Software Engineer · Full Stack Developer at Charani Infotech building HRM &amp; e-commerce systems.
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-[#a9a6a0] font-mono text-[9px] mt-0.5">
                        04
                      </span>
                      <span>
                        <strong className="text-white">Key Works:</strong> JavaMentor platform, Attendance System &amp; Purnima Kalamkari.
                      </span>
                    </p>
                  </div>

                  {/* Bottom: Signature line and Contact note */}
                  <div className="border-t border-white/10 pt-2.5">
                    <div className="flex items-end justify-between mb-1">
                      <div>
                        <span className="font-mono text-[7px] text-[#a9a6a0] uppercase block">
                          Holder Signature
                        </span>
                        <span
                          className="text-sm text-white italic tracking-wide"
                          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                        >
                          Lokesh Kagitha
                        </span>
                      </div>
                      <div className="font-mono text-[8px] text-[#a9a6a0]">
                        Class of 2026
                      </div>
                    </div>
                    <div className="font-mono text-[8px] text-[#77756f] truncate">
                      If found, say hello · {PROFILE.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flip Hint */}
              <div className="text-center mt-3 font-mono text-[10px] text-[#a9a6a0] tracking-wide">
                <span>{isFlipped ? "Flip front ↺" : "Hover / tap to flip ↻"}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Facts & Verbatim Paraphrase Quote - order-3 on mobile and lg */}
          <div className="card-base p-6 sm:p-10 flex flex-col justify-between rv order-3 lg:order-3" style={{ "--i": 2 } as React.CSSProperties}>
            <div>
              <span className="font-mono text-xs text-[#77756f] uppercase tracking-wider block mb-4">
                Quick Facts
              </span>

              <div className="divide-y divide-[#0d0d0d]/10 text-sm">
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-[#77756f] font-mono text-xs uppercase">
                    Location
                  </span>
                  <span className="font-medium text-[#0d0d0d] sm:text-right">
                    {PROFILE.location}
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-[#77756f] font-mono text-xs uppercase">
                    Degree
                  </span>
                  <span className="font-medium text-[#0d0d0d] sm:text-right text-xs">
                    B.Tech CSE (AI &amp; ML) · 8.0 CGPA
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-[#77756f] font-mono text-xs uppercase">
                    Current Role
                  </span>
                  <span className="font-medium text-[#0d0d0d] sm:text-right text-xs">
                    Associate Software Engineer · Full Stack Developer
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 sm:gap-2">
                  <span className="text-[#77756f] font-mono text-xs uppercase">
                    Email
                  </span>
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className="font-medium text-[#0d0d0d] hover:underline sm:text-right text-xs break-all min-h-[44px] flex items-center py-2"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {PROFILE.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Paraphrased Quote drawn from résumé wording */}
            <div className="pt-6 mt-6 border-t border-[#0d0d0d]/10">
              <blockquote className="text-sm italic text-[#3a3a3a] leading-relaxed border-l-2 border-[#0d0d0d] pl-4">
                &ldquo;Dedicated to architecting scalable full-stack web applications, from modular React interfaces to resilient backend APIs and automated enterprise workflows.&rdquo;
              </blockquote>
              <div className="font-mono text-[10px] text-[#77756f] mt-2 pl-4">
                — Drawn from verified industry &amp; project engineering practice
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
