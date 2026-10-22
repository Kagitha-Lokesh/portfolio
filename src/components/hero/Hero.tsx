"use client";

import React, { useEffect, useRef, useState } from "react";
import { PROFILE } from "@/lib/data";
import { useScroll } from "@/lib/scroll";
import { SplitText } from "@/components/ui/SplitText";
import { SectionTag } from "@/components/ui/SectionTag";
import { openLokiContact } from "@/components/agent/LokiWidgetIntegration";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);
  const { scrollToTarget } = useScroll();

  // Track page ready status
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-loaded")) {
      setIsPageReady(true);
    } else {
      const onReady = () => setIsPageReady(true);
      window.addEventListener("intro-loader-complete", onReady, { once: true });
      return () => window.removeEventListener("intro-loader-complete", onReady);
    }
  }, []);

  // 1. Audio and video autoplay / interaction unlock (starts when loading animation completes)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startVideo = () => {
      try {
        video.currentTime = 0;
      } catch {}

      // Try playing with sound initially
      video.muted = false;
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMuted(false);
            setSoundBlocked(false);
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay with sound blocked, fallback to muted
            video.muted = true;
            video.play().then(() => {
              setIsMuted(true);
              setSoundBlocked(true);
              setIsPlaying(true);
            }).catch(() => {});
          });
      }
    };

    // If already loaded or loader is bypassed, start immediately
    if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-loaded")) {
      startVideo();
    } else {
      // Pause at beginning while loading animation is visible
      try {
        video.pause();
        video.currentTime = 0;
      } catch {}

      const onLoaderComplete = () => {
        startVideo();
      };

      window.addEventListener("intro-loader-complete", onLoaderComplete, { once: true });
    }

    // Unlock sound on first user interaction
    const unlockSound = () => {
      if (video && video.muted) {
        video.muted = false;
        video
          .play()
          .then(() => {
            setIsMuted(false);
            setSoundBlocked(false);
          })
          .catch(() => {});
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
      window.removeEventListener("touchend", unlockSound);
    };

    window.addEventListener("pointerdown", unlockSound, { once: true });
    window.addEventListener("keydown", unlockSound, { once: true });
    window.addEventListener("touchend", unlockSound, { once: true });

    return () => {
      cleanupListeners();
    };
  }, []);

  // 2. IntersectionObserver pauses video when < 35% visible, resumes when >= 35%
  useEffect(() => {
    const heroEl = heroRef.current;
    const video = videoRef.current;
    if (!heroEl || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!document.documentElement.hasAttribute("data-loaded")) {
            return;
          }
          if (entry.intersectionRatio < 0.35) {
            video.pause();
            setIsPlaying(false);
          } else {
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        });
      },
      {
        threshold: [0, 0.35, 0.7, 1.0],
      }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      setSoundBlocked(false);
      video.play().catch(() => {});
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-[100svh] w-full flex flex-col justify-between pt-20 pb-12 overflow-hidden bg-[#f4f2ee]"
    >
      {/* Background Ghost Name Typography with center torso occlusion mask */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
        style={{
          maskImage:
            "linear-gradient(to right, black 0%, black calc(50% - min(8vw, 45px)), transparent calc(50% - min(4vw, 20px)), transparent calc(50% + min(4vw, 20px)), black calc(50% + min(8vw, 45px)), black 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black calc(50% - min(8vw, 45px)), transparent calc(50% - min(4vw, 20px)), transparent calc(50% + min(4vw, 20px)), black calc(50% + min(8vw, 45px)), black 100%)",
        }}
      >
        <span
          className="font-black uppercase tracking-tighter text-transparent whitespace-nowrap opacity-60 text-center select-none"
          style={{
            fontSize: "clamp(64px, 24vw, 320px)",
            WebkitTextStroke: "1.5px rgba(13, 13, 13, 0.12)",
            transform: "translateY(-5%)",
          }}
        >
          {PROFILE.firstName}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="content-container relative my-auto flex flex-col items-center justify-center pt-2 sm:pt-4">
        {/* Centered Video Container */}
        <div className="relative flex items-center justify-center w-full">
          <div
            className="hero-video-box relative flex items-center justify-center select-none"
            style={{
              aspectRatio: "768/960",
              height: "clamp(260px, 48svh, 680px)",
              maxWidth: "100%",
            }}
          >
            {/* Native Hardware-Accelerated Video with Seamless Multiply Blend */}
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-contain select-none pointer-events-none"
              style={{
                mixBlendMode: "multiply",
              }}
            >
              <source src="/hero/hero.webm" type="video/webm" />
              <source src="/hero/hero.mp4" type="video/mp4" />
            </video>

            {/* Sound Toggle Floating Button */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
              <button
                onClick={toggleSound}
                className="relative w-[46px] h-[46px] rounded-full bg-[#0d0d0d] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform duration-300 focus-visible:outline-none"
                aria-label={isMuted ? "Unmute introduction video" : "Mute introduction video"}
              >
                {soundBlocked && isMuted && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-[#0d0d0d]/30 pointer-events-none" />
                )}
                {isMuted ? (
                  // ▶ Triangle Play Sound icon
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="translate-x-0.5"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  // ❚❚ Pause / Sound On two bars icon
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Role and CTAs */}
        <div className="mt-4 sm:mt-6 text-center flex flex-col items-center max-w-xl mx-auto w-full px-2">
          <SectionTag
            index="00"
            label="Introduction"
            className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs"
          />

          <h1 className="heading-display text-3xl sm:text-5xl md:text-6xl tracking-tight mb-3.5 sm:mb-5 leading-[1.1]">
            <SplitText
              text={PROFILE.role}
              type="chars"
              accentText="."
              accentClassName="heading-accent ml-2.5"
              triggerOnView={isPageReady}
              delay={100}
            />
          </h1>

          {/* CTAs: Side-by-side for primary/secondary, full-width below for Resume */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md sm:w-auto">
            <button
              onClick={() => scrollToTarget("#work")}
              className="btn-primary min-h-[44px] justify-center text-xs sm:text-sm px-4 py-2.5"
            >
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Explore work">Explore work</span>
              </span>
              <span className="arrow-move arrow-right text-xs">→</span>
            </button>

            <button
              onClick={() => {
                scrollToTarget("#contact");
                openLokiContact();
              }}
              className="btn-secondary min-h-[44px] justify-center text-xs sm:text-sm px-4 py-2.5"
            >
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Let's talk">Let&apos;s talk</span>
              </span>
            </button>

            <a
              href={PROFILE.resumePath}
              download="Lokesh_Kagitha_Resume.pdf"
              className="btn-secondary col-span-2 sm:col-span-1 min-h-[44px] justify-center text-xs sm:text-sm px-4 py-2.5"
            >
              <span className="btn-roll">
                <span className="btn-roll-inner" data-text="Résumé">Résumé</span>
              </span>
              <span className="arrow-move arrow-down text-xs">↓</span>
            </a>
          </div>
        </div>
      </div>

      {/* Hero Bottom Bar */}
      <div className="content-container relative z-10 flex flex-col gap-1.5 sm:flex-row items-center sm:justify-between text-xs text-[#77756f] font-mono border-t border-[#0d0d0d]/10 pt-3 sm:pt-4 mt-4 sm:mt-6 text-center sm:text-left">
        <div>{PROFILE.location}</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0d0d0d] animate-pulse" />
          <span>Available for Roles &amp; Projects</span>
        </div>
        <div className="hidden sm:block">Scroll to explore ↓</div>
      </div>

      <style jsx>{`
        @media (max-height: 500px) and (orientation: landscape) {
          #hero {
            min-height: auto !important;
            padding-top: 4.5rem !important;
            padding-bottom: 1.5rem !important;
          }
          .hero-video-box {
            height: clamp(200px, 65svh, 320px) !important;
          }
        }
      `}</style>
    </section>
  );
}
