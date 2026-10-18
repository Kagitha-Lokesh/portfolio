"use client";

import React, { useEffect, useRef, useState } from "react";
import { ENABLE_MOTION_FX } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface SectionTagProps {
  index: string;
  label: string;
  className?: string;
}

export function SectionTag({ index, label, className = "" }: SectionTagProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const [displayIndex, setDisplayIndex] = useState(index);
  const [isSettled, setIsSettled] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (prefersReduced || !ENABLE_MOTION_FX) {
      setDisplayIndex(index);
      setIsSettled(true);
      return;
    }

    const el = containerRef.current;
    if (!el || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setDisplayIndex(index);
      setIsSettled(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, prefersReduced]);

  useEffect(() => {
    if (!isInView || prefersReduced || !ENABLE_MOTION_FX) {
      if (prefersReduced || !ENABLE_MOTION_FX) {
        setDisplayIndex(index);
        setIsSettled(true);
      }
      return;
    }

    const duration = 400; // 400ms digit scramble
    const startTime = performance.now();
    const digits = "0123456789";
    const len = index.length;

    let rafId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (progress < 1) {
        // Generate random digits
        let scramble = "";
        for (let i = 0; i < len; i++) {
          // If past certain progress, settle the first digit earlier
          if (progress > (i + 1) / (len + 1)) {
            scramble += index[i];
          } else {
            scramble += digits[Math.floor(Math.random() * digits.length)];
          }
        }
        setDisplayIndex(scramble);
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayIndex(index);
        setIsSettled(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isInView, index, prefersReduced]);

  const fullText = `${index} — ${label}`;

  return (
    <div
      ref={containerRef}
      className={`tag-mono ${className}`}
      aria-label={fullText}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <span className="font-mono tabular-nums tracking-normal font-semibold text-[#0d0d0d]">
          {displayIndex}
        </span>
        <span className="text-[#a9a6a0] select-none">—</span>
        <span
          className={`tx-relax inline-block ${isSettled || prefersReduced || !ENABLE_MOTION_FX ? "is-in" : ""}`}
        >
          {label}
        </span>
      </span>
    </div>
  );
}
