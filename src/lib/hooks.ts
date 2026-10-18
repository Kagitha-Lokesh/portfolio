"use client";

import { useEffect, useState, useRef, RefObject } from "react";

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

export function useInView<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = {},
  triggerOnce: boolean = true
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (triggerOnce) {
          observer.unobserve(el);
        }
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.root, options.rootMargin, options.threshold, triggerOnce]);

  return [ref, isInView];
}

export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setProgress(0);
        return;
      }
      const current = window.scrollY;
      setProgress(Math.min(1, Math.max(0, current / totalHeight)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return progress;
}

export interface LoadProgressState {
  progress: number;
  isComplete: boolean;
}

export function useLoadProgress(options?: {
  minDuration?: number;
  maxDuration?: number;
}): LoadProgressState {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const minTime = prefersReduced ? 600 : (options?.minDuration ?? 1200);
    const maxTime = options?.maxDuration ?? 3500;
    const startTime = performance.now();

    let fontsWeight = 0;
    let videoWeight = 0;
    let windowWeight = 0;

    // 1. Fonts ready signal (30%)
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          fontsWeight = 30;
        })
        .catch(() => {
          fontsWeight = 30;
        });
    } else {
      fontsWeight = 30;
    }

    // 2. Video ready signal (50%): readyState >= 3 (canplay / canplaythrough)
    let videoCleanup: (() => void) | null = null;
    const initVideoSignal = () => {
      const video = document.querySelector("#hero video") as HTMLVideoElement | null;
      if (video) {
        if (video.readyState >= 3) {
          videoWeight = 50;
        } else {
          const onCanPlay = () => {
            videoWeight = 50;
          };
          video.addEventListener("canplay", onCanPlay, { once: true });
          video.addEventListener("canplaythrough", onCanPlay, { once: true });
          video.addEventListener("loadeddata", onCanPlay, { once: true });
          video.addEventListener("error", onCanPlay, { once: true });
          videoCleanup = () => {
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("canplaythrough", onCanPlay);
            video.removeEventListener("loadeddata", onCanPlay);
            video.removeEventListener("error", onCanPlay);
          };
        }
      } else {
        // Fallback to portrait image or count immediately if no video element
        const portraitImg = new Image();
        portraitImg.src = "/portrait-bust.webp";
        if (portraitImg.complete) {
          videoWeight = 50;
        } else {
          portraitImg.onload = () => {
            videoWeight = 50;
          };
          portraitImg.onerror = () => {
            videoWeight = 50;
          };
        }
      }
    };
    initVideoSignal();

    // 3. Window load signal (20%)
    let windowCleanup: (() => void) | null = null;
    if (typeof document !== "undefined") {
      if (document.readyState === "complete") {
        windowWeight = 20;
      } else {
        const onLoad = () => {
          windowWeight = 20;
        };
        window.addEventListener("load", onLoad, { once: true });
        windowCleanup = () => window.removeEventListener("load", onLoad);
      }
    }

    let rafId: number;
    let currentDisplay = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const timedOut = elapsed >= maxTime;

      // Real signals sum (0 - 100)
      let rawTarget = fontsWeight + videoWeight + windowWeight;
      if (timedOut) {
        rawTarget = 100;
      }

      // Smooth pacing: never exceed 100 before minTime (1.2s or 0.6s)
      const allowableMax = timedOut ? 100 : Math.min(100, (elapsed / minTime) * 100);
      const effectiveTarget = Math.min(rawTarget, allowableMax);

      // Smooth step towards effectiveTarget - never jump backward
      const delta = effectiveTarget - currentDisplay;
      if (delta > 0) {
        const step = Math.max(0.4, delta * 0.14);
        currentDisplay = Math.min(effectiveTarget, currentDisplay + step);
      }

      // Complete when minTime is reached and progress hits ~100 (or timeout)
      if (elapsed >= minTime && (currentDisplay >= 99.5 || (timedOut && rawTarget === 100))) {
        setProgress(100);
        setIsComplete(true);
        return;
      }

      setProgress(Math.floor(currentDisplay));
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (videoCleanup) videoCleanup();
      if (windowCleanup) windowCleanup();
    };
  }, [prefersReduced, options?.minDuration, options?.maxDuration]);

  return { progress, isComplete };
}

