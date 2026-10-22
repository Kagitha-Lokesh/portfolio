"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message, INITIAL_ASSISTANT_MESSAGE, ValidSectionId } from "./types";
import { FormattedText, extractContactDraft, extractNavAction, stripInternalMarkers } from "./FormattedText";
import { ContactCard } from "./ContactCard";
import { SuggestionChips } from "./SuggestionChips";
import { useScroll } from "@/lib/scroll";
import { usePrefersReducedMotion } from "@/lib/hooks";

const STORAGE_KEY = "lk_portfolio_chat_messages";

export function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFallbackForm, setShowFallbackForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { stopScroll, startScroll, scrollToTarget } = useScroll();
  const prefersReduced = usePrefersReducedMotion();

  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Detect Loader complete signal
  useEffect(() => {
    const checkLoaded = () => {
      if (typeof document !== "undefined") {
        if (document.documentElement.getAttribute("data-loaded") === "true") {
          setIsReady(true);
        }
      }
    };

    checkLoaded();

    const handleLoaderComplete = () => {
      setIsReady(true);
    };

    window.addEventListener("intro-loader-complete", handleLoaderComplete);
    return () => window.removeEventListener("intro-loader-complete", handleLoaderComplete);
  }, []);

  // 2. Load and persist messages from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // sessionStorage unavailable or restricted
    }
  }, []);

  const saveMessagesToStorage = useCallback((msgs: Message[]) => {
    try {
      // Exclude streaming flag when persisting
      const clean = msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        contactDraft: m.contactDraft,
        navAction: m.navAction,
      }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {}
  }, []);

  // 3. Listen for custom event from Contact section ("Ask my AI")
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-agent-widget", handleOpenEvent);
    return () => window.removeEventListener("open-agent-widget", handleOpenEvent);
  }, []);

  // Ensure scroll is restored if component unmounts unexpectedly
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      startScroll();
    };
  }, [startScroll]);

  // 4. Scroll management & Lenis lock on mobile
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        stopScroll();
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      }

      // Auto-focus input on open
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, prefersReduced ? 50 : 250);

      return () => clearTimeout(timer);
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      startScroll();
    }
  }, [isOpen, stopScroll, startScroll, prefersReduced]);

  const handleNavigateSection = (section: ValidSectionId) => {
    if (section === "contact") {
      setShowFallbackForm(true);
      return;
    }
    // On mobile sheet, close dialog to reveal destination section
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
    setTimeout(() => {
      scrollToTarget(`#${section}`);
    }, 120);
  };

  // 5. Focus trap and Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
        return;
      }

      // Focus trap
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
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-scroll to bottom as messages stream
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }
  }, [messages, isLoading, isOpen, prefersReduced]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      launcherRef.current?.focus();
    }, 50);
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const fresh = [INITIAL_ASSISTANT_MESSAGE];
    setMessages(fresh);
    saveMessagesToStorage(fresh);
    setInput("");
    setIsLoading(false);
    setShowFallbackForm(false);
    setApiError(null);
  };

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    setApiError(null);
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMsgId = `msg-assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    const messagesWithAssistant = [...newMessages, initialAssistantMsg];
    setMessages(messagesWithAssistant);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Send up to 20 messages payload, cleanly stripping any internal raw markers from previous assistant turns
      const payloadMessages = newMessages.slice(-20).map((m) => ({
        role: m.role,
        content: m.role === "assistant" ? stripInternalMarkers(m.content) : m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = "LOKI service is currently unavailable.";
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          errMessage = `Request error (${response.status})`;
        }
        throw new Error(errMessage);
      }

      const body = response.body;
      if (!body) throw new Error("No response stream received.");

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        const draft = extractContactDraft(accumulatedContent);
        const nav = extractNavAction(accumulatedContent);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent,
                  contactDraft: draft,
                  navAction: nav,
                  isStreaming: true,
                }
              : m
          )
        );
      }

      // Stream finalized
      const finalDraft = extractContactDraft(accumulatedContent);
      const finalNav = extractNavAction(accumulatedContent);
      const finalizedMessages = messagesWithAssistant.map((m) =>
        m.id === assistantMsgId
          ? {
              ...m,
              content: accumulatedContent,
              contactDraft: finalDraft,
              navAction: finalNav,
              isStreaming: false,
            }
          : m
      );

      setMessages(finalizedMessages);
      saveMessagesToStorage(finalizedMessages);
      setIsLoading(false);
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setIsLoading(false);
        return;
      }

      const errMsg = (err as Error)?.message || "Failed to reach LOKI.";
      setApiError(errMsg);

      const errorFallbackMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content:
          "LOKI encountered an issue connecting right now. You can use the message form below to reach Lokesh directly.",
        isStreaming: false,
      };

      const updated = [...newMessages, errorFallbackMsg];
      setMessages(updated);
      saveMessagesToStorage(updated);
      setIsLoading(false);
      setShowFallbackForm(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Do not render launcher before the Loader finishes
  if (!isReady) {
    return null;
  }

  const isInitialOnly = messages.length === 1 && messages[0].id === INITIAL_ASSISTANT_MESSAGE.id;

  return (
    <>
      {/* 1. Launcher Pill Button */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed z-[45] min-h-[44px] px-4 py-2.5 rounded-full bg-[#0d0d0d] text-white hover:bg-[#3a3a3a] border border-[#0d0d0d]/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-2.5 text-xs font-medium tracking-tight transition-all duration-300 active:scale-95 cursor-pointer focus-visible:outline-none"
        style={{
          bottom: "max(1.25rem, calc(1rem + var(--sab)))",
          right: "max(1.25rem, calc(1rem + var(--sar)))",
          transitionTimingFunction: "var(--ease)",
        }}
        aria-label="Open LOKI AI Assistant"
        aria-expanded={isOpen}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-semibold">Ask LOKI</span>
        <span className="font-mono text-[10px] text-[#a9a6a0] hidden sm:inline">
          [LOKI]
        </span>
      </button>

      {/* 2. Floating Panel (Desktop: bottom-right sheet, Mobile: 100svh full sheet) */}
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="LOKI — Lokesh's AI Assistant"
          data-lenis-prevent
          className="fixed z-[60] flex flex-col bg-[#ffffff] border border-[#0d0d0d]/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300 inset-0 sm:inset-auto sm:right-[max(1.25rem,calc(1rem+var(--sar)))] sm:bottom-[max(1.25rem,calc(1rem+var(--sab)))] w-full h-[100svh] sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100svh-4rem)] sm:rounded-2xl"
          style={{
            transitionTimingFunction: "var(--ease)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#f4f2ee] border-b border-[#0d0d0d]/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center font-mono text-[10px] font-bold tracking-wider">
                LOKI
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-semibold text-xs text-[#0d0d0d] tracking-tight">
                    LOKI
                  </span>
                  <span className="font-instrument-serif italic text-xs text-[#77756f]">
                    AI Assistant
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-[#77756f]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>ONLINE &middot; GROUNDED IN DATA</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewChat}
                title="Start new conversation with LOKI"
                aria-label="Start new conversation with LOKI"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-mono text-[#77756f] hover:text-[#0d0d0d] transition-colors rounded-full"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close LOKI"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-mono text-[#77756f] hover:text-[#0d0d0d] transition-colors rounded-full"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fallback notification / direct form banner */}
          <div className="px-4 py-1.5 bg-[#f4f2ee] border-b border-[#0d0d0d]/5 flex items-center justify-between text-[11px] text-[#77756f] shrink-0">
            <span>Need to get in touch immediately?</span>
            <button
              type="button"
              onClick={() => setShowFallbackForm((prev) => !prev)}
              className="font-medium text-[#0d0d0d] underline underline-offset-2 hover:text-[#77756f] transition-colors cursor-pointer"
            >
              {showFallbackForm ? "Back to chat" : "Write a message"}
            </button>
          </div>

          {/* Body Content */}
          {showFallbackForm ? (
            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 bg-[#f4f2ee]/40"
            >
              <ContactCard
                recentChat={messages}
                isStandaloneFallback={true}
                onSuccess={() => {
                  setTimeout(() => setShowFallbackForm(false), 2500);
                }}
              />
            </div>
          ) : (
            <div
              data-lenis-prevent
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#ffffff]"
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-[#0d0d0d] text-white rounded-br-xs"
                          : "bg-[#f4f2ee] text-[#0d0d0d] border border-[#0d0d0d]/10 rounded-bl-xs"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <>
                          <FormattedText content={msg.content} />
                          {msg.isStreaming && !msg.content && (
                            <div className="flex items-center gap-1.5 py-1 text-[#77756f]" aria-label="LOKI is typing...">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d] animate-bounce" />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d] animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d] animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Contextual navigation action button */}
                    {!isUser && msg.navAction && (
                      <button
                        type="button"
                        onClick={() => handleNavigateSection(msg.navAction!.section)}
                        className="mt-2 min-h-[44px] px-3.5 py-2 rounded-full border border-[#0d0d0d]/15 bg-[#f4f2ee] hover:bg-[#0d0d0d] hover:text-white text-xs font-medium text-[#0d0d0d] transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        aria-label={`Navigate to ${msg.navAction.label}`}
                      >
                        <span>{msg.navAction.label}</span>
                        <span className="font-mono text-xs">↓</span>
                      </button>
                    )}

                    {/* Contact Draft confirmation card if parsed from assistant response */}
                    {!isUser && msg.contactDraft && (
                      <div className="w-full max-w-[95%]">
                        <ContactCard
                          initialDraft={msg.contactDraft}
                          recentChat={messages}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Suggestion Chips when conversation is fresh */}
              {isInitialOnly && (
                <div className="mt-2">
                  <div className="font-mono text-[10px] text-[#77756f] uppercase tracking-wider mb-1.5">
                    Suggested Questions
                  </div>
                  <SuggestionChips onSelect={(prompt) => sendMessage(prompt)} disabled={isLoading} />
                </div>
              )}

              {/* API error notice */}
              {apiError && (
                <div className="p-3 rounded-xl bg-[#f4f2ee] border border-[#0d0d0d]/15 text-xs text-[#0d0d0d] space-y-1">
                  <p className="font-semibold">{apiError}</p>
                  <p className="text-[#77756f]">
                    You can switch to the direct message form above or email{" "}
                    <a
                      href="mailto:kagithalokesh8@gmail.com"
                      className="underline font-medium text-[#0d0d0d]"
                    >
                      kagithalokesh8@gmail.com
                    </a>
                    .
                  </p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Footer Input */}
          <div className="p-3 bg-[#f4f2ee] border-t border-[#0d0d0d]/10 shrink-0">
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                maxLength={500}
                disabled={isLoading || showFallbackForm}
                onChange={(e) => setInput(e.target.value)}
                placeholder={showFallbackForm ? "Fill out the form above..." : "Ask LOKI about Lokesh's work..."}
                data-lenis-prevent
                className="flex-1 min-h-[44px] px-3.5 py-2 rounded-full bg-[#ffffff] border border-[#0d0d0d]/15 text-xs text-[#0d0d0d] placeholder:text-[#a9a6a0] focus:outline-none focus:border-[#0d0d0d] transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim() || showFallbackForm}
                className="min-h-[44px] min-w-[44px] px-3.5 rounded-full bg-[#0d0d0d] text-white hover:bg-[#3a3a3a] disabled:opacity-40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Send message to LOKI"
              >
                {isLoading ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <span className="font-mono text-sm leading-none">&uarr;</span>
                )}
              </button>
            </form>

            <div className="mt-2 text-center">
              <p className="font-mono text-[9.5px] text-[#77756f] tracking-tight">
                LOKI can make mistakes. Your message is sent to Lokesh only when you click Send.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
