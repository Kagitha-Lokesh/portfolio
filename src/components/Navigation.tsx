"use client";

import React, { useState, useEffect, useRef } from "react";
import { NAV, PROFILE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";
import { useScrollProgress } from "@/lib/hooks";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollProgress = useScrollProgress();
  const { scrollToTarget } = useScroll();

  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
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

  // Lock scroll on mobile menu open & listen for Esc
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileMenuOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (id === "hero") {
      scrollToTarget("#hero");
    } else {
      scrollToTarget(`#${id}`);
    }
  };

  return (
    <>
      {/* 2px ink scroll-progress bar along the very top */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-[#0d0d0d] pointer-events-none transition-transform duration-75 origin-left"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      {/* Main Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled ? "py-3" : "py-6"
        }`}
      >
        <div className="content-container flex items-center justify-between">
          {/* Left: Initials mark + Name */}
          <button
            onClick={() => handleNavClick("hero")}
            className="group flex items-center gap-3.5 focus-visible:outline-none"
            aria-label={`${PROFILE.name} - Scroll to top`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold tracking-wider transition-all duration-500 group-hover:rotate-360 ${
                scrolled
                  ? "bg-[#0d0d0d] text-[#ffffff] border border-transparent shadow-sm"
                  : "bg-transparent text-[#0d0d0d] border border-[#0d0d0d]/30"
              }`}
              style={{
                transition: "transform 0.6s var(--ease), background-color 0.4s var(--ease), color 0.4s var(--ease)",
              }}
            >
              LK
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
            className={`hidden md:flex items-center relative p-1.5 rounded-full transition-all duration-400 ${
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
                  className={`relative z-10 px-4 py-1.5 text-xs font-medium tracking-tight rounded-full transition-colors duration-200 focus-visible:outline-none ${
                    isActive
                      ? "text-white"
                      : "text-[#3a3a3a] hover:text-[#0d0d0d]"
                  }`}
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
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-full border border-[#0d0d0d]/15 hover:border-[#0d0d0d] text-[#0d0d0d] transition-all duration-300 hover:bg-[#0d0d0d] hover:text-white"
            >
              <span>Résumé</span>
              <span className="text-[10px]">↓</span>
            </a>

            {/* Mobile Menu Pill Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-md border border-[#0d0d0d]/10 text-xs font-medium tracking-tight text-[#0d0d0d] shadow-sm"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen mobile paper overlay with clip-path reveal */}
      <div
        className={`fixed inset-0 z-50 bg-[#f4f2ee] md:hidden flex flex-col justify-between p-8 transition-all duration-600 ${
          mobileMenuOpen
            ? "pointer-events-auto [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)] opacity-100"
            : "pointer-events-none [clip-path:polygon(0_0,100%_0,100%_0,0_0)] opacity-0"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-[#77756f] uppercase tracking-widest">
            Navigation
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-full border border-[#0d0d0d]/15 flex items-center justify-center text-sm font-mono text-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white transition-colors"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-6 my-auto">
          {NAV.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="group flex items-baseline gap-4 text-left focus-visible:outline-none"
              style={{
                transitionDelay: `${idx * 40}ms`,
                transform: mobileMenuOpen ? "translateY(0)" : "translateY(24px)",
                opacity: mobileMenuOpen ? 1 : 0,
                transition: "transform 0.5s var(--ease), opacity 0.5s var(--ease)",
              }}
            >
              <span className="font-mono text-xs text-[#a9a6a0] group-hover:text-[#0d0d0d] transition-colors">
                0{idx + 1}
              </span>
              <span className="text-3xl font-bold tracking-tight text-[#0d0d0d] group-hover:translate-x-2 transition-transform">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center justify-between pt-6 border-t border-[#0d0d0d]/10 text-xs text-[#77756f]">
          <a
            href={PROFILE.resumePath}
            download="Lokesh_Kagitha_Resume.pdf"
            className="font-medium text-[#0d0d0d] underline underline-offset-4"
          >
            Download Résumé ↓
          </a>
          <span className="font-mono">{PROFILE.location}</span>
        </div>
      </div>
    </>
  );
}
