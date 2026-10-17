"use client";

import React, { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, AchievementItem } from "@/lib/data";

export function Achievements() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [scrollFraction, setScrollFraction] = useState(0);
  const [centerIndex, setCenterIndex] = useState(0);
  const [hasStartedCount, setHasStartedCount] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const rect = container.getBoundingClientRect();
      const containerHeight = container.offsetHeight;
      const windowHeight = window.innerHeight;

      // Calculate how far down we've scrolled inside the container
      const totalScrollable = containerHeight - windowHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const fraction = Math.min(1, Math.max(0, currentScroll / totalScrollable));
      setScrollFraction(fraction);

      if (fraction > 0.05 && !hasStartedCount) {
        setHasStartedCount(true);
      }

      // Horizontal travel distance
      const maxTranslate = track.scrollWidth - window.innerWidth + 80;
      const translateX = fraction * maxTranslate;
      track.style.transform = `translateX(-${translateX}px)`;

      // Determine card nearest viewport center
      const windowCenter = window.innerWidth / 2;
      let minDistance = Infinity;
      let closestIdx = 0;

      cardRefs.current.forEach((card, idx) => {
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(cardCenter - windowCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIdx = idx;
        }
      });

      setCenterIndex(closestIdx);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasStartedCount]);

  return (
    <div
      id="achievements"
      ref={containerRef}
      className="relative w-full"
      style={{
        height: "calc(100vh + 1600px)",
      }}
    >
      {/* Sticky Viewport Container */}
      <div className="sticky top-0 h-[100svh] w-full flex flex-col justify-between py-8 sm:py-12 overflow-hidden bg-[#f4f2ee]">
        {/* Header with Title and Thin Progress Bar */}
        <div className="content-container w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div>
              <div className="tag-mono mb-2">
                <span>06 — Benchmarks</span>
              </div>
              <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
                <span>Milestones &amp; verified honors</span>
                <span className="heading-accent ml-2">.</span>
              </h2>
            </div>

            <div className="font-mono text-xs text-[#77756f] flex items-center gap-3">
              <span>Scroll sideways</span>
              <span className="text-[#0d0d0d] font-bold">
                {String(centerIndex + 1).padStart(2, "0")} / {String(ACHIEVEMENTS.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full h-1 bg-[#0d0d0d]/10 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-[#0d0d0d] transition-all duration-75 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, scrollFraction * 100))}%` }}
            />
          </div>
        </div>

        {/* Sliding Horizontal Card Track */}
        <div className="my-auto w-full overflow-visible py-8">
          <div
            ref={trackRef}
            className="flex items-center gap-6 sm:gap-8 px-[clamp(18px,5vw,80px)] transition-transform duration-75 ease-out will-change-transform"
          >
            {ACHIEVEMENTS.map((item, idx) => {
              const isCenter = centerIndex === idx;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className={`shrink-0 rounded-[28px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-500 relative select-none ${
                    isCenter
                      ? "-translate-y-3 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.12)]"
                      : "translate-y-0 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.05)] border border-[#0d0d0d]/8"
                  }`}
                  style={{
                    width: "clamp(340px, 40vw, 540px)",
                    height: "clamp(260px, 36vh, 320px)",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {/* Soft Brand Glow behind top */}
                  <div
                    className={`absolute -top-10 -left-10 w-44 h-44 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
                      isCenter ? "opacity-30" : "opacity-15"
                    }`}
                    style={{ backgroundColor: item.brandColor }}
                  />

                  {/* Top Row: 72px Logo Tile + Index */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div
                      className="w-[72px] h-[72px] rounded-2xl bg-[#f4f2ee] border border-[#0d0d0d]/10 flex items-center justify-center p-3 shadow-inner"
                    >
                      <div className="font-mono text-xs font-bold text-[#0d0d0d] text-center leading-tight">
                        {item.platform}
                      </div>
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#a9a6a0]">
                      {item.index}
                    </span>
                  </div>

                  {/* Bottom Row: Details left, Giant Count-up Number right */}
                  <div className="relative z-10 flex items-end justify-between gap-4 pt-4 border-t border-[#0d0d0d]/10">
                    <div className="max-w-[55%]">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] block mb-1">
                        {item.caption}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-[#0d0d0d] tracking-tight leading-snug">
                        {item.metricLabel}
                      </h3>
                      <p className="text-xs text-[#77756f] mt-1 line-clamp-2">
                        {item.detail}
                      </p>
                    </div>

                    {/* Giant Number Counter */}
                    <div className="text-right">
                      <AnimatedCounter
                        value={item.value}
                        suffix={item.suffix}
                        trigger={hasStartedCount}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ending Card: "and counting →" */}
            <div
              className="shrink-0 rounded-[28px] border-2 border-dashed border-[#0d0d0d]/25 bg-white/40 p-8 flex flex-col justify-center items-center text-center select-none"
              style={{
                width: "clamp(260px, 25vw, 340px)",
                height: "clamp(260px, 36vh, 320px)",
              }}
            >
              <span className="text-2xl font-bold tracking-tight text-[#0d0d0d] mb-2">
                and counting
              </span>
              <span className="font-mono text-xl text-[#0d0d0d]">→</span>
              <span className="font-mono text-[11px] text-[#77756f] mt-4">
                Continuous growth in modern software engineering
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="content-container w-full flex items-center justify-between text-xs text-[#77756f] font-mono">
          <div>Verified Résumé Record</div>
          <div>Drag or Scroll to traverse</div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({
  value,
  suffix = "",
  trigger,
}: {
  value: number;
  suffix?: string;
  trigger: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTime: number | null = null;
    const duration = 1400; // 1.4s easeOutQuart

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      // easeOutQuart: 1 - (1 - progress)^4
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(ease * value);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [trigger, value]);

  return (
    <div className="flex items-baseline justify-end">
      <span className="font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tighter text-[#0d0d0d]">
        {displayValue}
      </span>
      {suffix && (
        <span className="font-mono text-sm sm:text-base font-semibold text-[#3a3a3a] ml-1">
          {suffix}
        </span>
      )}
    </div>
  );
}
