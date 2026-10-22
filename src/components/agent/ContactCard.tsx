"use client";

import React, { useState } from "react";
import { ContactDraft, Message } from "./types";

interface ContactCardProps {
  initialDraft?: Partial<ContactDraft>;
  recentChat?: Message[];
  onSuccess?: () => void;
  isStandaloneFallback?: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  initialDraft,
  recentChat = [],
  onSuccess,
  isStandaloneFallback = false,
}) => {
  const [name, setName] = useState(initialDraft?.name || "");
  const [email, setEmail] = useState(initialDraft?.email || "");
  const [message, setMessage] = useState(initialDraft?.message || "");
  const [website, setWebsite] = useState(""); // Honeypot field
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (trimmedMessage.length < 10) {
      setErrorMessage("Message must be at least 10 characters.");
      return;
    }

    setStatus("sending");

    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        website: website, // Honeypot
        recentChat: recentChat.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setStatus("success");
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        (err as Error)?.message || "Unable to send message. Please email kagithalokesh8@gmail.com directly."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="mt-3 p-4 rounded-xl bg-[#ffffff] border border-[#0d0d0d]/10 text-xs text-[#0d0d0d] shadow-sm animate-fadeIn">
        <div className="flex items-center gap-2 font-semibold text-[#0d0d0d] mb-1">
          <span className="w-4 h-4 rounded-full bg-[#0d0d0d] text-white flex items-center justify-center text-[10px] font-mono">
            ✓
          </span>
          <span>Message Delivered to Lokesh</span>
        </div>
        <p className="text-[#77756f] mt-1 leading-relaxed">
          Thank you, {name || "there"}! Lokesh has received your message and conversation context and will reply to{" "}
          <strong className="text-[#0d0d0d]">{email}</strong> shortly.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mt-3 p-3.5 sm:p-4 rounded-xl border border-[#0d0d0d]/10 text-xs shadow-sm ${
        isStandaloneFallback ? "bg-[#ffffff]" : "bg-[#ffffff]"
      }`}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#0d0d0d]/10">
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#77756f]">
            {isStandaloneFallback ? "Direct Message" : "Contact Draft"}
          </span>
          <h4 className="font-semibold text-[#0d0d0d] text-xs sm:text-[13px]">
            {isStandaloneFallback ? "Send a Message to Lokesh" : "Review & Send to Lokesh"}
          </h4>
        </div>
        <span className="font-mono text-[10px] text-[#77756f]">
          via Resend
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Honeypot field (hidden from view and screen readers) */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div>
          <label className="block font-mono text-[10px] text-[#77756f] uppercase mb-1">
            Your Name
          </label>
          <input
            type="text"
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            disabled={status === "sending"}
            data-lenis-prevent
            className="w-full px-3 py-2 rounded-lg bg-[#f4f2ee] border border-[#0d0d0d]/10 text-xs text-[#0d0d0d] placeholder:text-[#a9a6a0] focus:outline-none focus:border-[#0d0d0d] transition-colors"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-[#77756f] uppercase mb-1">
            Your Email
          </label>
          <input
            type="email"
            required
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sarah@company.com"
            disabled={status === "sending"}
            data-lenis-prevent
            className="w-full px-3 py-2 rounded-lg bg-[#f4f2ee] border border-[#0d0d0d]/10 text-xs text-[#0d0d0d] placeholder:text-[#a9a6a0] focus:outline-none focus:border-[#0d0d0d] transition-colors"
          />
        </div>

        <div>
          <label className="block font-mono text-[10px] text-[#77756f] uppercase mb-1">
            Message
          </label>
          <textarea
            required
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi Lokesh, I'd like to discuss an opportunity..."
            disabled={status === "sending"}
            data-lenis-prevent
            className="w-full px-3 py-2 rounded-lg bg-[#f4f2ee] border border-[#0d0d0d]/10 text-xs text-[#0d0d0d] placeholder:text-[#a9a6a0] focus:outline-none focus:border-[#0d0d0d] transition-colors resize-none leading-relaxed"
          />
        </div>

        {errorMessage && (
          <div className="p-2 rounded-lg bg-[#f4f2ee] border border-[#0d0d0d]/20 text-[11px] text-[#0d0d0d]">
            {errorMessage}
          </div>
        )}

        <div className="pt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-[#77756f]">
            Sent securely to kagithalokesh8@gmail.com
          </span>

          <button
            type="submit"
            disabled={status === "sending"}
            className="min-h-[44px] px-4 py-2 rounded-full bg-[#0d0d0d] text-white hover:bg-[#3a3a3a] text-xs font-medium tracking-tight flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {status === "sending" ? (
              <>
                <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send to Lokesh</span>
                <span className="font-sans text-xs">→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
