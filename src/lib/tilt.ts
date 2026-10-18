"use client";

import { useEffect, useRef } from "react";
import { ENABLE_MOTION_FX } from "./motion";

/**
 * useCardTilt
 * Attaches a subtle 3D tilt (max 3deg) to cards on pointer move,
 * setting CSS variables --rx and --ry via a single rAF loop.
 * Disabled on touch, reduced motion, or when ENABLE_MOTION_FX = false.
 */
export function useCardTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!ENABLE_MOTION_FX || typeof window === "undefined") return;

    // Check hover capability and reduced motion
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || prefersReduced) return;

    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;
    let isHovered = false;

    const tick = () => {
      // Smooth interpolation towards target
      currentRx += (targetRx - currentRx) * 0.12;
      currentRy += (targetRy - currentRy) * 0.12;

      el.style.setProperty("--rx", `${currentRx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${currentRy.toFixed(2)}deg`);

      // Keep ticking while hovered or until settled
      if (isHovered || Math.abs(targetRx - currentRx) > 0.05 || Math.abs(targetRy - currentRy) > 0.05) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
        rafId = null;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5

      // Max 3deg tilt
      targetRx = -y * 3.0;
      targetRy = x * 3.0;

      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleMouseEnter = () => {
      isHovered = true;
      if (!rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const handleMouseLeave = () => {
      isHovered = false;
      targetRx = 0;
      targetRy = 0;
    };

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    el.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    el.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    };
  }, []);

  return ref;
}
