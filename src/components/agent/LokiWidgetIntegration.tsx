"use client";

import { useEffect, useRef } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/**
 * Configure marked with GFM and secure renderers
 */
const markdownRenderer = new marked.Renderer();

markdownRenderer.html = function ({ text }: { text: string }) {
  // Render literal raw HTML as plain text, not executable markup
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

markdownRenderer.link = function ({
  href,
  title,
  text,
}: {
  href: string;
  title?: string | null;
  text: string;
}) {
  const cleanHref = (href || "").trim();
  // Only permit http:, https:, and mailto: links
  const isAllowed = /^(?:https?:|mailto:)/i.test(cleanHref);
  if (!isAllowed) {
    // Reject javascript:, data:, and unsafe schemes - render as non-clickable text
    return text;
  }
  const titleAttr = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
  return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
};

marked.use({
  gfm: true,
  breaks: true,
  renderer: markdownRenderer,
  hooks: {
    postprocess(html: string) {
      // Wrap tables with overflow-x auto container
      return html.replace(
        /<table>[\s\S]*?<\/table>/g,
        (tbl) => `<div class="lk-table-wrap">${tbl}</div>`
      );
    },
  },
});

let cachedPurifier: any = null;

function getPurifier() {
  if (cachedPurifier) return cachedPurifier;

  let pur: any = null;
  if (typeof window === "undefined") {
    try {
      const { JSDOM } = require("jsdom");
      const jsdom = new JSDOM("");
      pur = (DOMPurify as any)(jsdom.window);
    } catch {
      return null;
    }
  } else if (typeof (DOMPurify as any).sanitize === "function") {
    pur = DOMPurify;
  } else if (typeof (DOMPurify as any) === "function") {
    pur = (DOMPurify as any)(window);
  }

  if (pur && typeof pur.addHook === "function") {
    pur.addHook("afterSanitizeAttributes", function (node: any) {
      if (node.tagName === "A" && node.hasAttribute("href")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  cachedPurifier = pur;
  return pur;
}

export function renderAssistantMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return "";
  const rawHtml = marked.parse(rawMarkdown) as string;

  const purifier = getPurifier();
  if (!purifier || typeof purifier.sanitize !== "function") {
    return rawHtml;
  }

  return purifier.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "hr",
      "pre", "code",
      "div", "span",
      "table", "thead", "tbody", "tr", "th", "td",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title", "class"],
    ADD_ATTR: ["target", "rel"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}

/**
 * TypeScript interface for window.LokiWidget
 */
interface LokiWidgetAPI {
  __loaded?: boolean;
  version?: string;
  init: (opts?: LokiWidgetOptions) => LokiWidgetAPI;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setMood: (mood: string) => void;
  destroy: () => void;
}

interface LokiWidgetOptions {
  owner?: string;
  title?: string;
  position?: "left" | "right";
  theme?: "auto" | "light" | "dark";
  offset?: number;
  greeting?: string;
  chips?: string[];
  accent?: string | null;
  accentInk?: string | null;
  onMessage?: (text: string) => Promise<string>;
  renderMarkdown?: (text: string) => string;
}

declare global {
  interface Window {
    LokiWidget?: LokiWidgetAPI;
    LokiMarkdownRenderer?: (text: string) => string;
  }
}

const STORAGE_KEY = "lk_loki_chat_history";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Strip internal backend tags from conversation history before sending
 * to prevent leaking raw internal markers into subsequent turns
 */
function stripMarkersForBackend(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\[\[CONTACT_DRAFT\]\][\s\S]*?(?=(\[\[NAV_ACTION|$))/g, "")
    .replace(/\[\[NAV_ACTION\]\][\s\S]*?(?=(\[\[CONTACT_DRAFT|$))/g, "")
    .replace(/\[\[CONTACT_DRAFT[\s\S]*$/, "")
    .replace(/\[\[NAV_ACTION[\s\S]*$/, "")
    .trim();
}

/**
 * Client integration component for the Loki floating assistant widget.
 * Mounted once in the root layout to initialize the floating Shadow DOM assistant
 * and connect its onMessage callback to the real /api/chat streaming endpoint.
 */
export function LokiWidgetIntegration() {
  const historyRef = useRef<HistoryMessage[]>([]);

  // Load conversation history from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          historyRef.current = parsed.slice(-20);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let isDestroyed = false;

    const handleMessage = async (userText: string): Promise<string> => {
      const trimmed = userText.trim();
      if (!trimmed) return "";

      // Append user message to history
      const updatedHistory: HistoryMessage[] = [
        ...historyRef.current,
        { role: "user" as const, content: trimmed },
      ];
      historyRef.current = updatedHistory;

      // Sliding window of up to 20 messages for the backend
      const payloadMessages = updatedHistory.slice(-20).map((m) => ({
        role: m.role,
        content: m.role === "assistant" ? stripMarkersForBackend(m.content) : m.content,
      }));

      // Call /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!response.ok) {
        let errMessage = "LOKI assistant is having trouble connecting to AI services.";
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch {}
        throw new Error(errMessage);
      }

      const body = response.body;
      if (!body) {
        throw new Error("No response body received from server.");
      }

      // Read streaming chunks until completion
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }

      // Flush decoder
      accumulated += decoder.decode();

      // Record assistant answer into history
      const finalHistory: HistoryMessage[] = [
        ...updatedHistory,
        { role: "assistant" as const, content: accumulated },
      ].slice(-20);
      historyRef.current = finalHistory;

      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(finalHistory));
      } catch {}

      return accumulated;
    };

    const initWidget = () => {
      if (isDestroyed || !window.LokiWidget) return;

      if (typeof window !== "undefined") {
        window.LokiMarkdownRenderer = renderAssistantMarkdown;
      }

      window.LokiWidget.init({
        owner: "Lokesh",
        title: "Loki",
        position: "right",
        theme: "light",
        offset: 20,
        greeting:
          "Hi, I'm Loki, Lokesh's portfolio assistant. Ask me about his projects, technical stack, experience, education, or get in touch with him!",
        chips: [
          "Explore projects",
          "What technologies do you use?",
          "Tell me about your experience",
          "How can I contact Lokesh?",
        ],
        onMessage: handleMessage,
        renderMarkdown: renderAssistantMarkdown,
      });
    };

    // If script is already loaded on the page
    const existingScript = document.querySelector('script[data-loki-script]');
    if (existingScript) {
      if (window.LokiWidget) {
        initWidget();
      } else {
        existingScript.addEventListener("load", initWidget, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.src = "/loki-widget.js";
      script.defer = true;
      script.setAttribute("data-loki-script", "true");
      script.setAttribute("data-manual", "true");
      script.addEventListener("load", initWidget, { once: true });
      document.body.appendChild(script);
    }

    return () => {
      isDestroyed = true;
      if (window.LokiWidget) {
        window.LokiWidget.destroy();
      }
    };
  }, []);

  return null;
}
