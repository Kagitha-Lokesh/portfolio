"use client";

import React, { useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, AchievementItem } from "@/lib/data";

export function Achievements() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [wrapperHeight, setWrapperHeight] = useState<string>("auto");
  const [centerIndex, setCenterIndex] = useState(0);
  const [hasStartedCount, setHasStartedCount] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const currentCenterIndexRef = useRef(0);
  const hasStartedCountRef = useRef(false);
  const showSwipeHintRef = useRef(true);

  // 1. ResizeObserver to dynamically derive wrapper height from REAL content travel + 100svh
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    motionQuery.addEventListener("change", handleMotionChange);

    const updateMeasurements = () => {
      if (motionQuery.matches) {
        setWrapperHeight("auto");
        return;
      }
      const track = trackRef.current;
      if (!track) return;
      const viewportWidth = window.innerWidth;
      const travel = Math.max(0, track.scrollWidth - viewportWidth + 60);
      setWrapperHeight(`calc(${travel}px + 100svh)`);
    };

    updateMeasurements();

    const ro = new ResizeObserver(updateMeasurements);
    if (trackRef.current) {
      ro.observe(trackRef.current);
    }
    window.addEventListener("resize", updateMeasurements);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      ro.disconnect();
      window.removeEventListener("resize", updateMeasurements);
    };
  }, []);

  // 2. High performance single rAF scroll listener with direct DOM transform
  useEffect(() => {
    if (isReducedMotion) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const container = containerRef.current;
          const track = trackRef.current;
          if (!container || !track) {
            ticking = false;
            return;
          }

          const rect = container.getBoundingClientRect();
          const containerHeight = container.offsetHeight;
          const windowHeight = window.innerHeight;

          const totalScrollable = containerHeight - windowHeight;
          if (totalScrollable <= 0) {
            ticking = false;
            return;
          }

          const currentScroll = -rect.top;
          const fraction = Math.min(1, Math.max(0, currentScroll / totalScrollable));

          // Hide swipe hint after first interaction
          if (fraction > 0.02 && showSwipeHintRef.current) {
            showSwipeHintRef.current = false;
            setShowSwipeHint(false);
          }

          // Trigger counter once passed threshold
          if (fraction > 0.05 && !hasStartedCountRef.current) {
            hasStartedCountRef.current = true;
            setHasStartedCount(true);
          }

          // Write transform directly to track without triggering React re-render
          const maxTranslate = Math.max(0, track.scrollWidth - window.innerWidth + 60);
          const translateX = fraction * maxTranslate;
          track.style.transform = `translate3d(-${translateX}px, 0, 0)`;

          // Write progress bar directly
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${fraction * 100}%`;
          }

          // Calculate center card index
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

          if (closestIdx !== currentCenterIndexRef.current) {
            currentCenterIndexRef.current = closestIdx;
            setCenterIndex(closestIdx);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isReducedMotion]);

  // Reduced motion: fallback to vertical list
  if (isReducedMotion) {
    return (
      <section id="achievements" className="section-padding bg-[#f4f2ee]">
        <div className="content-container">
          <div className="mb-10">
            <div className="tag-mono mb-2">
              <span>06 — Benchmarks</span>
            </div>
            <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl">
              <span>Milestones &amp; verified honors</span>
              <span className="heading-accent ml-2">.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ACHIEVEMENTS.map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] bg-white p-6 border border-[#0d0d0d]/10 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f4f2ee] border border-[#0d0d0d]/10 flex items-center justify-center p-2 font-mono text-xs font-bold">
                    {item.platform}
                  </div>
                  <span className="font-mono text-xs text-[#a9a6a0]">{item.index}</span>
                </div>

                <div className="flex items-end justify-between gap-4 pt-4 border-t border-[#0d0d0d]/10">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#77756f] block">
                      {item.caption}
                    </span>
                    <h3 className="font-bold text-base text-[#0d0d0d]">{item.metricLabel}</h3>
                    <p className="text-xs text-[#77756f] mt-1">{item.detail}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-3xl text-[#0d0d0d]">
                      {item.value}
                      {item.suffix && <span className="text-sm ml-0.5">{item.suffix}</span>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      id="achievements"
      ref={containerRef}
      className="relative w-full"
      style={{
        height: wrapperHeight,
      }}
    >
      {/* Sticky Viewport Container using 100svh */}
      <div className="sticky top-0 h-[100svh] w-full flex flex-col justify-between py-4 sm:py-8 lg:py-12 overflow-hidden bg-[#f4f2ee]">
        {/* Header with Title and Thin Progress Bar */}
        <div className="content-container w-full shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div>
              <div className="tag-mono mb-1 sm:mb-2 text-[10px] sm:text-xs">
                <span>06 — Benchmarks</span>
              </div>
              <h2 className="heading-display text-2xl sm:text-4xl md:text-5xl leading-tight">
                <span>Milestones &amp; verified honors</span>
                <span className="heading-accent ml-1.5 sm:ml-2">.</span>
              </h2>
            </div>

            <div className="font-mono text-[11px] sm:text-xs text-[#77756f] flex items-center gap-2 sm:gap-3">
              {showSwipeHint && (
                <span className="text-[#0d0d0d] animate-pulse hidden sm:inline">
                  Swipe up to explore →
                </span>
              )}
              <span className="text-[#77756f] hidden sm:inline">Scroll sideways</span>
              <span className="text-[#0d0d0d] font-bold">
                {String(centerIndex + 1).padStart(2, "0")} / {String(ACHIEVEMENTS.length).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full h-1 bg-[#0d0d0d]/10 rounded-full overflow-hidden mt-1 sm:mt-3">
            <div
              ref={progressBarRef}
              className="h-full bg-[#0d0d0d] rounded-full will-change-[width]"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* Sliding Horizontal Card Track */}
        <div className="my-auto w-full overflow-visible py-2 sm:py-6">
          <div
            ref={trackRef}
            className="flex items-center gap-4 sm:gap-8 px-[clamp(16px,4vw,80px)] will-change-transform"
          >
            {ACHIEVEMENTS.map((item, idx) => {
              const isCenter = centerIndex === idx;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  className={`shrink-0 rounded-[24px] sm:rounded-[28px] bg-white p-5 sm:p-8 flex flex-col justify-between transition-all duration-300 relative select-none ${
                    isCenter
                      ? "-translate-y-1 sm:-translate-y-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] border-2 border-[#0d0d0d]"
                      : "translate-y-0 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-[#0d0d0d]/10"
                  }`}
                  style={{
                    width: "min(84vw, 480px)",
                    height: "clamp(240px, 34svh, 310px)",
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

                  {/* Top Row: 56-72px Logo Tile + Index */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div
                      className="w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] rounded-xl sm:rounded-2xl bg-[#f4f2ee] border border-[#0d0d0d]/10 flex items-center justify-center p-2.5 sm:p-3 shadow-inner"
                    >
                      <div className="font-mono text-[11px] sm:text-xs font-bold text-[#0d0d0d] text-center leading-tight">
                        {item.platform}
                      </div>
                    </div>

                    <span className="font-mono text-xs font-semibold text-[#a9a6a0]">
                      {item.index}
                    </span>
                  </div>

                  {/* Bottom Row: Details left, Giant Count-up Number right */}
                  <div className="relative z-10 flex items-end justify-between gap-3 pt-3 sm:pt-4 border-t border-[#0d0d0d]/10">
                    <div className="max-w-[55%]">
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-[#77756f] block mb-0.5 sm:mb-1">
                        {item.caption}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-[#0d0d0d] tracking-tight leading-snug">
                        {item.metricLabel}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#77756f] mt-0.5 sm:mt-1 line-clamp-2">
                        {item.detail}
                      </p>
                    </div>

                    {/* Giant Number Counter with clamp typography */}
                    <div className="text-right shrink-0">
                      <AnimatedCounter
                        value={item.value}
                        suffix={item.suffix}
                        trigger={hasStartedCount}
                        isReducedMotion={isReducedMotion}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Ending Card: "and counting →" */}
            <div
              className="shrink-0 rounded-[24px] sm:rounded-[28px] border-2 border-dashed border-[#0d0d0d]/25 bg-white/40 p-6 sm:p-8 flex flex-col justify-center items-center text-center select-none"
              style={{
                width: "min(65vw, 320px)",
                height: "clamp(240px, 34svh, 310px)",
              }}
            >
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0d0d0d] mb-1.5 sm:mb-2">
                and counting
              </span>
              <span className="font-mono text-lg sm:text-xl text-[#0d0d0d]">→</span>
              <span className="font-mono text-[10px] sm:text-[11px] text-[#77756f] mt-3 sm:mt-4">
                Continuous growth in modern software engineering
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="content-container w-full flex items-center justify-between text-[11px] sm:text-xs text-[#77756f] font-mono shrink-0">
          <div>Verified Résumé Record</div>
          <div>Swipe up to explore</div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({
  value,
  suffix = "",
  trigger,
  isReducedMotion = false,
}: {
  value: number;
  suffix?: string;
  trigger: boolean;
  isReducedMotion?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(isReducedMotion ? value : 0);

  useEffect(() => {
    if (isReducedMotion) {
      setDisplayValue(value);
      return;
    }
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
  }, [trigger, value, isReducedMotion]);

  return (
    <div className="flex items-baseline justify-end">
      <span
        className="font-bold tracking-tighter text-[#0d0d0d]"
        style={{ fontSize: "clamp(1.75rem, 6vw, 3.5rem)", lineHeight: 1 }}
      >
        {displayValue}
      </span>
      {suffix && (
        <span className="font-mono text-xs sm:text-base font-semibold text-[#3a3a3a] ml-1">
          {suffix}
        </span>
      )}
    </div>
  );
}
