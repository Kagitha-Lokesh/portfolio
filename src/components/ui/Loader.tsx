"use client";

import React, { useEffect, useState, useRef } from "react";
import { SHOW_LOADER } from "@/lib/data";
import { useLoadProgress, usePrefersReducedMotion } from "@/lib/hooks";
import { useScroll } from "@/lib/scroll";

const SESSION_KEY = "lk_portfolio_intro_shown";

export function Loader() {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isLifting, setIsLifting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const prefersReduced = usePrefersReducedMotion();
  const { lenis } = useScroll();
  const { progress, isComplete } = useLoadProgress();
  const hasCompletedRef = useRef(false);

  // 1. Initial mount: always run loading animation on reload if SHOW_LOADER is true
  useEffect(() => {
    setMounted(true);

    // Clear any previous session flag so reload always plays the intro
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}

    if (!SHOW_LOADER) {
      document.documentElement.setAttribute("data-loaded", "true");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("intro-loader-complete"));
      }
      setShouldRender(false);
    } else {
      setShouldRender(true);
      // Lock scroll while loader is visible
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (lenis) {
        lenis.stop();
      }
    }
  }, [lenis]);

  // Keep Lenis stopped if it mounts/initializes while loader is visible
  useEffect(() => {
    if (shouldRender && !isExiting && lenis) {
      lenis.stop();
    }
  }, [shouldRender, isExiting, lenis]);

  // 2. Trigger exit animation when progress hits 100
  useEffect(() => {
    if (!shouldRender || !isComplete || hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    // Begin exit
    setIsExiting(true);
    setAnnouncement("Loading complete");
    document.documentElement.setAttribute("data-loaded", "true");

    // Signal hero video to begin playing immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("intro-loader-complete"));
    }

    // Unlock page scroll and restart Lenis as overlay lifts
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (lenis) {
      lenis.start();
    }

    if (prefersReduced) {
      // Reduced motion: 300ms fade-out, no clip-path wipe
      setIsLifting(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        focusHero();
      }, 320);
      return () => clearTimeout(timer);
    }

    // Normal motion: fade out counter/bar, then lift overlay via clip-path
    const liftTimer = setTimeout(() => {
      setIsLifting(true);
    }, 160);

    // After 0.9s clip-path wipe completes
    const exitTimer = setTimeout(() => {
      setShouldRender(false);
      focusHero();
    }, 1120);

    return () => {
      clearTimeout(liftTimer);
      clearTimeout(exitTimer);
    };
  }, [isComplete, shouldRender, prefersReduced, lenis]);

  const focusHero = () => {
    // Ensure video is playing once loader is completely gone
    const video = document.querySelector("#hero video") as HTMLVideoElement | null;
    if (video && video.paused) {
      video.play().catch(() => {});
    }

    const heroHeading = document.querySelector("#hero h1") as HTMLElement | null;
    if (heroHeading) {
      heroHeading.setAttribute("tabindex", "-1");
      heroHeading.focus({ preventScroll: true });
    } else {
      document.body.focus();
    }
  };

  // Do not render during SSR or if skipped
  if (!mounted || !shouldRender) {
    return null;
  }

  const paddedProgress = String(progress).padStart(3, "0");

  return (
    <aside
      className={`lk-loader ${isExiting ? "is-exiting" : ""} ${isLifting ? "is-lifting" : ""} ${prefersReduced ? "reduced-motion" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <style>{`
        .lk-loader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background-color: var(--paper, #f4f2ee);
          color: var(--ink, #0d0d0d);
          clip-path: inset(0 0 0 0);
          transition: clip-path 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--gutter, clamp(18px, 4vw, 64px));
          box-sizing: border-box;
          overflow: hidden;
          will-change: clip-path;
        }

        .lk-loader.is-exiting {
          pointer-events: none;
        }

        .lk-loader.is-lifting {
          clip-path: inset(0 0 100% 0);
        }

        /* Center container */
        .lk-loader-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        /* Initials Mark */
        .lk-mark-wrapper {
          position: relative;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lk-mark-svg {
          position: absolute;
          inset: 0;
          width: 72px;
          height: 72px;
          transform: rotate(-90deg);
        }

        .lk-circle {
          stroke: var(--ink, #0d0d0d);
          stroke-dasharray: 207.35;
          stroke-dashoffset: 207.35;
          animation: lkCircleDraw 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes lkCircleDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        .lk-mark-letters {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 1.0625rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--ink, #0d0d0d);
        }

        .lk-letter {
          opacity: 0;
          transform: translateY(4px);
        }

        .lk-letter-l {
          animation: lkLetterFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
        }

        .lk-letter-k {
          animation: lkLetterFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) 0.72s forwards;
        }

        @keyframes lkLetterFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Sub elements under the mark (counter & bar) */
        .lk-center-sub {
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lk-loader.is-exiting .lk-center-sub {
          opacity: 0;
        }

        /* Counter */
        .lk-counter {
          margin-top: 22px;
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.8125rem;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.12em;
          color: var(--ink, #0d0d0d);
        }

        /* 1px Hairline Progress Bar */
        .lk-bar-track {
          margin-top: 14px;
          width: 140px;
          height: 1px;
          background-color: var(--line, rgba(13, 13, 13, 0.1));
          overflow: hidden;
        }

        .lk-bar-fill {
          width: 100%;
          height: 100%;
          background-color: var(--ink, #0d0d0d);
          transform-origin: left;
          transition: transform 0.12s linear;
        }

        /* Bottom Row */
        .lk-bottom-bar {
          position: absolute;
          bottom: var(--gutter, clamp(18px, 4vw, 64px));
          left: var(--gutter, clamp(18px, 4vw, 64px));
          right: var(--gutter, clamp(18px, 4vw, 64px));
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .lk-loader.is-exiting .lk-bottom-bar {
          opacity: 0;
        }

        /* Masked line reveal wrappers */
        .lk-reveal-mask {
          overflow: hidden;
          display: inline-flex;
          align-items: baseline;
        }

        .lk-bottom-left-inner {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-wrap: wrap;
          transform: translateY(100%);
          animation: lkMaskRise 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
        }

        .lk-name {
          font-family: var(--font-inter-tight), system-ui, sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: var(--ink, #0d0d0d);
        }

        .lk-role {
          font-family: var(--font-instrument-serif), Georgia, serif;
          font-style: italic;
          font-size: 0.95rem;
          font-weight: 400;
          color: var(--mute, #77756f);
        }

        .lk-bottom-right-inner {
          display: inline-block;
          transform: translateY(100%);
          animation: lkMaskRise 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
        }

        .lk-status-tag {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--mute, #77756f);
        }

        @keyframes lkMaskRise {
          to {
            transform: translateY(0);
          }
        }

        /* Accessible Screen-Reader Only Announcement */
        .lk-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* Reduced motion overrides */
        .lk-loader.reduced-motion {
          clip-path: none !important;
          transition: opacity 0.3s ease !important;
        }

        .lk-loader.reduced-motion.is-lifting {
          opacity: 0 !important;
        }

        .lk-loader.reduced-motion * {
          animation: none !important;
        }

        .lk-loader.reduced-motion .lk-circle {
          stroke-dashoffset: 0 !important;
        }

        .lk-loader.reduced-motion .lk-letter,
        .lk-loader.reduced-motion .lk-bottom-left-inner,
        .lk-loader.reduced-motion .lk-bottom-right-inner {
          opacity: 1 !important;
          transform: none !important;
        }
      `}</style>

      {/* Center initials mark, counter, and hairline bar */}
      <div className="lk-loader-center">
        <div className="lk-mark-wrapper">
          <svg
            viewBox="0 0 72 72"
            className="lk-mark-svg"
            aria-hidden="true"
          >
            <circle
              cx="36"
              cy="36"
              r="33"
              fill="none"
              strokeWidth="1.25"
              className="lk-circle"
            />
          </svg>
          <div className="lk-mark-letters" aria-hidden="true">
            <span className="lk-letter lk-letter-l">K</span>
            <span className="lk-letter lk-letter-k">L</span>
          </div>
        </div>

        <div className="lk-center-sub">
          <div className="lk-counter" aria-hidden="true">
            {paddedProgress}
          </div>
          <div className="lk-bar-track" aria-hidden="true">
            <div
              className="lk-bar-fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar with masked reveals */}
      <div className="lk-bottom-bar">
        <div className="lk-reveal-mask">
          <div className="lk-bottom-left-inner">
            <span className="lk-name">Lokesh Kagitha</span>
            <span className="lk-role">Full Stack Developer</span>
          </div>
        </div>

        <div className="lk-reveal-mask">
          <div className="lk-bottom-right-inner">
            <span className="lk-status-tag">Loading</span>
          </div>
        </div>
      </div>

      {/* Screen reader completion announcer */}
      <span className="lk-sr-only">
        {announcement}
      </span>
    </aside>
  );
}
