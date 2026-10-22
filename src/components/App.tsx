"use client";

import React from "react";
import { Navigation } from "./Navigation";
import { Hero } from "./hero/Hero";
import { About } from "./sections/About";
import { Skills } from "./sections/Skills";
import { Work } from "./sections/Work";
import { Freelance } from "./sections/Freelance";
import { Certifications } from "./sections/Certifications";
import { Experience } from "./sections/Experience";
import { Achievements } from "./sections/Achievements";
import { Contact } from "./sections/Contact";
import { Loader } from "./ui/Loader";
import { RevealObserver } from "./ui/RevealObserver";

export function App() {
  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen bg-[#f4f2ee] text-[#0d0d0d] flex flex-col selection:bg-[#0d0d0d] selection:text-[#f4f2ee]"
    >
      <Loader />
      <RevealObserver />
      <Navigation />
      <main className="flex-1 w-full flex flex-col">
        <Hero />
        <About />
        <Skills />
        <Work />
        <Freelance />
        <Certifications />
        <Experience />
        <Achievements />
      </main>
      <Contact />
    </div>
  );
}
