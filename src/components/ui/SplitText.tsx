"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { ENABLE_MOTION_FX } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/hooks";

export interface SplitTextProps {
  text: string;
  type?: "lines" | "words" | "chars";
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "div" | "p";
  accentText?: string;
  accentClassName?: string;
  delay?: number;
  triggerOnView?: boolean;
}

export function SplitText({
  text,
  type = "lines",
  className = "",
  as: Component = "span",
  accentText,
  accentClassName = "heading-accent ml-2",
  delay = 0,
  triggerOnView = true,
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const wordsSpanRef = useRef<HTMLSpanElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();
  const [lines, setLines] = useState<string[]>([]);
  const [isInView, setIsInView] = useState(!triggerOnView);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const rawFullText = accentText ? `${text} ${accentText}` : text;

  // 1. Check fonts ready
  useEffect(() => {
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => setFontsLoaded(true))
        .catch(() => setFontsLoaded(true));
    } else {
      setFontsLoaded(true);
    }
  }, []);

  // 2. IntersectionObserver (trigger once when 25% visible)
  useEffect(() => {
    if (!triggerOnView) {
      setIsInView(true);
      return;
    }
    const el = containerRef.current;
    if (!el || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsInView(true);
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
  }, [triggerOnView]);

  // 3. Line measurement on resize for type="lines"
  useEffect(() => {
    if (type !== "lines" || prefersReduced || !ENABLE_MOTION_FX) return;
    if (!fontsLoaded) return;

    const measureLines = () => {
      const parent = wordsSpanRef.current;
      if (!parent) return;

      const wordNodes = parent.querySelectorAll<HTMLElement>("[data-word]");
      if (wordNodes.length === 0) return;

      const lineMap: { [top: number]: string[] } = {};
      wordNodes.forEach((node) => {
        const top = Math.round(node.offsetTop);
        const w = node.getAttribute("data-word") || "";
        if (!lineMap[top]) lineMap[top] = [];
        lineMap[top].push(w);
      });

      const detectedLines = Object.keys(lineMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map((top) => lineMap[top].join(" "));

      setLines(detectedLines);
    };

    measureLines();

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measureLines, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [text, type, fontsLoaded, prefersReduced]);

  // Static / Fallback Mode (Reduced Motion, No-JS, or Motion Disabled)
  if (prefersReduced || !ENABLE_MOTION_FX) {
    return (
      <Component className={className}>
        <span>{text}</span>
        {accentText && <span className={accentClassName}>{accentText}</span>}
      </Component>
    );
  }

  // --- RENDERING VARIANTS ---

  // A. LINES
  if (type === "lines") {
    // If lines not yet measured, render un-split words invisibly while reserving space
    const isReady = lines.length > 0;
    const words = text.split(" ");

    return (
      <Component
        ref={containerRef as any}
        className={`tx-lines-wrap relative ${className}`}
        aria-label={rawFullText}
      >
        <span className="sr-only">{rawFullText}</span>
        {/* Hidden measurement container */}
        <span
          ref={wordsSpanRef}
          aria-hidden="true"
          className="words-measurer inline-block w-full opacity-0 pointer-events-none select-none"
          style={{ position: isReady ? "absolute" : "relative", left: 0, top: 0 }}
        >
          {words.map((w, idx) => (
            <span
              key={idx}
              data-word={w}
              className="inline-block whitespace-nowrap mr-[0.25em]"
            >
              {w}
            </span>
          ))}
          {accentText && (
            <span className={`${accentClassName} inline-block`}>{accentText}</span>
          )}
        </span>

        {/* Rendered masked lines */}
        {isReady && (
          <span aria-hidden="true" className="block w-full">
            {lines.map((lineText, lineIdx) => {
              const isLastLine = lineIdx === lines.length - 1;
              const lineDelay = delay + lineIdx * 90; // 90ms stagger per line

              return (
                <span
                  key={lineIdx}
                  className="tx-line-mask block overflow-hidden leading-tight"
                >
                  <span
                    className={`tx-line block will-change-transform ${isInView ? "is-in" : ""}`}
                    style={{
                      transitionDelay: `${lineDelay}ms`,
                    }}
                  >
                    {lineText}
                    {isLastLine && accentText && (
                      <span
                        className={`tx-blur ${accentClassName} inline-block ${
                          isInView ? "is-in" : ""
                        }`}
                        style={{
                          transitionDelay: `${lineDelay + 250}ms`,
                        }}
                      >
                        {accentText}
                      </span>
                    )}
                  </span>
                </span>
              );
            })}
          </span>
        )}
      </Component>
    );
  }

  // B. CHARACTERS (e.g. Hero title)
  if (type === "chars") {
    const chars = Array.from(text);
    const charCount = chars.length;
    // Per rule: stagger total max 1200ms -> min(40ms, 1200ms / charCount), hero default 16ms
    const staggerMs = Math.min(40, Math.floor(1200 / Math.max(1, charCount)));

    return (
      <Component
        ref={containerRef as any}
        className={`tx-chars-wrap inline-block ${className}`}
        aria-label={rawFullText}
      >
        <span className="sr-only">{rawFullText}</span>
        <span aria-hidden="true" className="inline-block">
          {text.split(" ").map((word, wordIdx, arr) => {
            const wordStartIdx = text
              .split(" ")
              .slice(0, wordIdx)
              .reduce((acc, w) => acc + w.length + 1, 0);

            return (
              <React.Fragment key={wordIdx}>
                <span className="inline-block whitespace-nowrap">
                  {Array.from(word).map((char, charOffset) => {
                    const globalCharIdx = wordStartIdx + charOffset;
                    const charDelay = delay + globalCharIdx * staggerMs;

                    return (
                      <span
                        key={charOffset}
                        className={`tx-char inline-block will-change-transform ${
                          isInView ? "is-in" : ""
                        }`}
                        style={{
                          transitionDelay: `${charDelay}ms`,
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
                {wordIdx < arr.length - 1 && " "}
              </React.Fragment>
            );
          })}
          {accentText && (
            <span
              className={`tx-blur ${accentClassName} inline-block ${
                isInView ? "is-in" : ""
              }`}
              style={{
                transitionDelay: `${delay + charCount * staggerMs + 100}ms`,
              }}
            >
              {accentText}
            </span>
          )}
        </span>
      </Component>
    );
  }

  // C. WORDS
  const words = text.split(" ");
  const wordCount = words.length;
  const wordStagger = Math.min(80, Math.floor(1000 / Math.max(1, wordCount)));

  return (
    <Component
      ref={containerRef as any}
      className={`tx-words-wrap inline-block ${className}`}
      aria-label={rawFullText}
    >
      <span aria-hidden="true" className="inline-block">
        {words.map((w, idx) => {
          const wordDelay = delay + idx * wordStagger;
          return (
            <span
              key={idx}
              className={`tx-word inline-block whitespace-nowrap mr-[0.25em] ${
                isInView ? "is-in" : ""
              }`}
              style={{
                transitionDelay: `${wordDelay}ms`,
              }}
            >
              {w}
            </span>
          );
        })}
        {accentText && (
          <span
            className={`tx-blur ${accentClassName} inline-block ${
              isInView ? "is-in" : ""
            }`}
            style={{
              transitionDelay: `${delay + wordCount * wordStagger + 150}ms`,
            }}
          >
            {accentText}
          </span>
        )}
      </span>
    </Component>
  );
}
