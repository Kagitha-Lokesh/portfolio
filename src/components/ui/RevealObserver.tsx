"use client";

import { useEffect } from "react";

export function RevealObserver() {
  useEffect(() => {
    // If IntersectionObserver is unavailable, reveal everything immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".rv, .rv-mask, .tx-relax").forEach((el) => {
        el.classList.add("is-in");
      });
      return;
    }

    // Safety net: reveal anything already in or within 1 screen of viewport on load
    const runSafetyNet = () => {
      const vh = window.innerHeight;
      const elements = document.querySelectorAll(".rv:not(.is-in), .rv-mask:not(.is-in)");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= vh * 1.5) {
          el.classList.add("is-in");
        }
      });
    };

    runSafetyNet();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const elements = document.querySelectorAll(".rv, .rv-mask, .tx-relax");
    elements.forEach((el) => {
      if (!el.classList.contains("is-in")) {
        observer.observe(el);
      }
    });

    // Handle any dynamically added elements
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains("rv") || node.classList.contains("rv-mask")) {
              if (!node.classList.contains("is-in")) {
                observer.observe(node);
              }
            }
            node.querySelectorAll?.(".rv, .rv-mask, .tx-relax").forEach((child) => {
              if (!child.classList.contains("is-in")) {
                observer.observe(child);
              }
            });
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
