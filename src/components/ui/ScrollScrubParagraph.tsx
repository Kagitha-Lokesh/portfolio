"use client";

import React, { useEffect, useRef, useState } from "react";
import { ENABLE_MOTION_FX } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface ScrollScrubParagraphProps {
  text: string;
  className?: string;
  as?: "p" | "div" | "span";
}

// Shared registry for scroll scrub elements
type ScrubItem = {
  el: HTMLElement;
  wordNodes: NodeListOf<HTMLElement>;
  totalWords: number;
};

const registeredItems = new Set<ScrubItem>();
let scrollTicking = false;

function onScrollTick() {
  const vh = window.innerHeight;
  const startY = vh * 0.92; // starts revealing near bottom
  const endY = vh * 0.45;   // fully revealed around middle

  registeredItems.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > vh) return;

    // Progress 0 to 1
    const progress = Math.min(1, Math.max(0, (startY - rect.top) / (startY - endY)));

    const N = item.totalWords;
    item.wordNodes.forEach((node, i) => {
      const wordStart = i / N;
      const wordSpan = 1 / N;
      const wordProgress = Math.min(1, Math.max(0, (progress - wordStart) / wordSpan));
      const opacity = 0.15 + 0.85 * wordProgress;
      node.style.opacity = opacity.toFixed(2);
    });

    if (progress >= 1) {
      // Once fully revealed, unregister to save CPU
      item.wordNodes.forEach((node) => {
        node.style.opacity = "1";
      });
      registeredItems.delete(item);
    }
  });

  scrollTicking = false;
}

function handleGlobalScroll() {
  if (!scrollTicking && registeredItems.size > 0) {
    scrollTicking = true;
    requestAnimationFrame(onScrollTick);
  }
}

let isGlobalListenerAttached = false;
function registerScrub(item: ScrubItem) {
  registeredItems.add(item);
  if (!isGlobalListenerAttached && typeof window !== "undefined") {
    window.addEventListener("scroll", handleGlobalScroll, { passive: true });
    window.addEventListener("resize", handleGlobalScroll, { passive: true });
    isGlobalListenerAttached = true;
  }
  handleGlobalScroll();
}

function unregisterScrub(item: ScrubItem) {
  registeredItems.delete(item);
}

export function ScrollScrubParagraph({
  text,
  className = "",
  as: Component = "p",
}: ScrollScrubParagraphProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const words = text.split(" ");
  const isEligible = words.length > 12;
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop, { passive: true });
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!isEligible || !isDesktop || prefersReduced || !ENABLE_MOTION_FX) return;
    const el = containerRef.current;
    if (!el) return;

    const wordNodes = el.querySelectorAll<HTMLElement>("[data-scrub-word]");
    if (wordNodes.length === 0) return;

    const item: ScrubItem = {
      el,
      wordNodes,
      totalWords: wordNodes.length,
    };

    registerScrub(item);

    return () => {
      unregisterScrub(item);
    };
  }, [isEligible, isDesktop, prefersReduced, text]);

  // Fallback for short paragraphs, mobile, reduced motion, or motion disabled
  if (!isEligible || !isDesktop || prefersReduced || !ENABLE_MOTION_FX) {
    return (
      <Component className={`rv ${className}`}>
        {text}
      </Component>
    );
  }

  return (
    <Component
      ref={containerRef as any}
      className={`tx-scrub ${className}`}
      aria-label={text}
    >
      <span aria-hidden="true" className="inline">
        {words.map((w, idx) => (
          <span
            key={idx}
            data-scrub-word
            className="inline-block whitespace-nowrap mr-[0.25em] transition-opacity duration-150"
            style={{ opacity: 0.15 }}
          >
            {w}
          </span>
        ))}
      </span>
    </Component>
  );
}
