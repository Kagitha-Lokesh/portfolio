"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "./hooks";

interface ScrollContextType {
  lenis: Lenis | null;
  scrollToTarget: (target: string | HTMLElement, offset?: number) => void;
  stopScroll: () => void;
  startScroll: () => void;
}

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
  scrollToTarget: () => {},
  stopScroll: () => {},
  startScroll: () => {},
});

export const useScroll = () => useContext(ScrollContext);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !isTouch,
      syncTouch: false,
      touchMultiplier: 1.0,
      wheelMultiplier: 1.0,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReduced]);

  const stopScroll = () => {
    lenisRef.current?.stop();
  };

  const startScroll = () => {
    lenisRef.current?.start();
  };

  const scrollToTarget = (target: string | HTMLElement, offset: number = 0) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset, duration: 1.2 });
    } else {
      if (typeof target === "string") {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
        }
      } else if (target) {
        target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
      }
    }
  };

  return (
    <ScrollContext.Provider
      value={{
        lenis: lenisRef.current,
        scrollToTarget,
        stopScroll,
        startScroll,
      }}
    >
      {children}
    </ScrollContext.Provider>
  );
}
