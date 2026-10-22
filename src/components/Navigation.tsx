"use client";

import React, { useState, useEffect, useRef } from "react";
import { NAV, PROFILE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";
import { useScrollProgress } from "@/lib/hooks";
import { openLokiContact } from "@/components/agent/LokiWidgetIntegration";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollProgress = useScrollProgress();
  const { scrollToTarget, stopScroll, startScroll } = useScroll();

  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<number>(0);

  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  // Track 40px scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track active section with IntersectionObserver rootMargin: -45% 0px -50% 0px
  useEffect(() => {
    const sectionIds = ["hero", ...NAV.map((n) => n.id)];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-45% 0px -50% 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Update sliding indicator pill under active link
  useEffect(() => {
    const activeBtn = navRefs.current[activeSection];
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    } else {
      setIndicatorStyle({ left: 0, width: 0 });
    }
  }, [activeSection, scrolled]);

  // Lock scroll, trap focus, and handle keyboard navigation when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      scrollPosRef.current = window.scrollY;
      stopScroll();
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      // Focus close button on open
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
          return;
        }

        // Trap focus inside dialog
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(focusTimer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      startScroll();
    }
  }, [mobileMenuOpen, stopScroll, startScroll]);

  const handleNavClick = (id: string) => {
    const wasOpen = mobileMenuOpen;
    setMobileMenuOpen(false);
    if (wasOpen) {
      // Return focus to menu button
      setTimeout(() => {
        menuButtonRef.current?.focus();
      }, 50);
    }
    if (id === "hero") {
      scrollToTarget("#hero");
    } else if (id === "contact") {
      scrollToTarget("#contact");
      openLokiContact();
    } else {
      scrollToTarget(`#${id}`);
    }
  };

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      menuButtonRef.current?.focus();
    }, 50);
  };

  return (
    <>
      {/* 2px ink scroll-progress bar along the very top under notch */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-[#0d0d0d] pointer-events-none transition-transform duration-75 origin-left"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      {/* Main Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? "py-2 sm:py-3" : "py-4 sm:py-6"
        }`}
        style={{
          paddingTop: `calc(${scrolled ? "0.5rem" : "1rem"} + env(safe-area-inset-top, 0px))`,
        }}
      >
        <div className="content-container flex items-center justify-between">
          {/* Left: Initials mark + Name (44px target) */}
          <button
            onClick={() => handleNavClick("hero")}
            className="nav-logo-mark group flex items-center gap-3 min-h-[44px] min-w-[44px] focus-visible:outline-none"
            aria-label={`${PROFILE.name} - Scroll to top`}
          >
            <div
              className={`nav-logo-inner w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold tracking-wider transition-all duration-500 ${
                scrolled
                  ? "bg-[#0d0d0d] text-[#ffffff] border border-transparent shadow-sm"
                  : "bg-transparent text-[#0d0d0d] border border-[#0d0d0d]/30"
              }`}
              style={{
                transition: "transform 0.6s var(--ease), background-color 0.4s var(--ease), color 0.4s var(--ease)",
              }}
            >
              KL
            </div>
            <span
              className={`font-semibold tracking-tight text-sm text-[#0d0d0d] transition-opacity duration-300 hidden sm:inline-block ${
                scrolled ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {PROFILE.name}
            </span>
          </button>

          {/* Desktop Nav Pill */}
          <nav
            aria-label="Main Navigation"
            className={`nav-pill-container hidden md:flex items-center relative p-1.5 rounded-full transition-all duration-400 ${
              scrolled
                ? "bg-white/85 backdrop-blur-md border border-[#0d0d0d]/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                : "bg-transparent border border-transparent"
            }`}
          >
            {/* Sliding ink indicator pill */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-full bg-[#0d0d0d] pointer-events-none transition-all duration-300 ease-out"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
                opacity: indicatorStyle.width > 0 ? 1 : 0,
              }}
              aria-hidden="true"
            />

            {NAV.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    navRefs.current[item.id] = el;
                  }}
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item relative z-10 px-3 lg:px-4 py-2 text-xs font-medium tracking-tight rounded-full transition-all duration-300 focus-visible:outline-none min-h-[44px] flex items-center ${
                    isActive
                      ? "text-white"
                      : "text-[#3a3a3a] hover:text-[#0d0d0d]"
                  }`}
                  style={{
                    transitionDelay: isActive ? "180ms" : "0ms",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: CTA on desktop, Menu on mobile */}
          <div className="flex items-center gap-3">
            <a
              href={PROFILE.resumePath}
              download="Lokesh_Kagitha_Resume.pdf"
              className="btn-secondary hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 min-h-[44px] rounded-full"
            >
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Résumé">Résumé</span>
              </span>
              <span className="arrow-move arrow-down text-[10px]">↓</span>
            </a>

            {/* Mobile Menu Pill Button (44px min target) */}
            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/85 backdrop-blur-md border border-[#0d0d0d]/10 text-xs font-medium tracking-tight text-[#0d0d0d] shadow-sm active:scale-95 transition-transform"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Menu">Menu</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile paper overlay with clip-path reveal */}
      <div
        ref={dialogRef}
        className={`fixed inset-0 z-50 bg-[#f4f2ee] md:hidden flex flex-col justify-between px-6 sm:px-8 transition-all duration-600 ${
          mobileMenuOpen
            ? "pointer-events-auto [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] opacity-100"
            : "pointer-events-none [clip-path:polygon(0_0,100%_0,100%_0,0_0)] opacity-0"
        }`}
        style={{
          height: "100dvh",
          paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
          paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
          paddingLeft: "max(1.5rem, env(safe-area-inset-left, 0px))",
          paddingRight: "max(1.5rem, env(safe-area-inset-right, 0px))",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        id="mobile-menu-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-[#77756f] uppercase tracking-widest">
            Navigation
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleCloseMenu}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-sm font-mono text-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white transition-colors active:scale-95"
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-[clamp(0.5rem,2.2vh,1.5rem)] my-auto overflow-y-auto max-h-[calc(100dvh-180px)]">
          {NAV.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="group flex items-baseline gap-3 text-left focus-visible:outline-none min-h-[44px]"
              style={{
                transitionDelay: `${idx * 30}ms`,
                transform: mobileMenuOpen ? "translateY(0)" : "translateY(18px)",
                opacity: mobileMenuOpen ? 1 : 0,
                transition: "transform 0.4s var(--ease), opacity 0.4s var(--ease)",
              }}
            >
              <span className="font-mono text-xs text-[#a9a6a0] group-hover:text-[#0d0d0d] transition-colors">
                0{idx + 1}
              </span>
              <span className="text-[clamp(1.35rem,4.2vh,2rem)] font-bold tracking-tight text-[#0d0d0d] group-hover:translate-x-2 transition-transform leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-between pt-4 border-t border-[#0d0d0d]/10 text-xs text-[#77756f]">
          <a
            href={PROFILE.resumePath}
            download="Lokesh_Kagitha_Resume.pdf"
            className="font-medium text-[#0d0d0d] underline underline-offset-4 min-h-[44px] flex items-center"
          >
            Download Résumé ↓
          </a>
          <span className="font-mono">{PROFILE.location}</span>
        </div>
      </div>
    </>
  );
}
