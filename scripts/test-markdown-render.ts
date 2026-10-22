import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const dom = new JSDOM("");
const purify = DOMPurify(dom.window as any);

// Configure marked with GFM and secure renderers
marked.use({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    },
    link({ href, title, text }) {
      const cleanHref = (href || "").trim();
      const isAllowed = /^(?:https?:|mailto:)/i.test(cleanHref);
      if (!isAllowed) {
        return text;
      }
      const titleAttr = title ? ` title="${title.replace(/"/g, "&quot;")}"` : "";
      return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  },
  hooks: {
    postprocess(html) {
      // Wrap tables with overflow-x auto container
      return html.replace(/<table>[\s\S]*?<\/table>/g, (tbl) => `<div class="lk-table-wrap">${tbl}</div>`);
    },
  },
});

export function renderAssistantMarkdown(rawMarkdown: string): string {
  if (!rawMarkdown) return "";

  const parsed = marked.parse(rawMarkdown) as string;

  return purify.sanitize(parsed, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "s", "del",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "hr",
      "pre", "code",
      "div", "span",
      "table", "thead", "tbody", "tr", "th", "td",
      "a"
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "title", "class"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  });
}

const sample = `### Lokesh's projects:
| Project | Year | Tech Stack |
|---|---|---|
| **Purnima Kalamkari** (Freelance) | 2026 | React, Node |
| **JavaMentor** | 2026 | Firebase |

#### Highlights
- Secure admin dashboard
  - nested item
1. First
2. Second

See [GitHub](https://github.com/x/y) or https://example.com/a.
<img src=x onerror=alert(1)> and [bad](javascript:alert(1))`;

const output = renderAssistantMarkdown(sample);
console.log("=== RENDERED & SANITIZED HTML ===");
console.log(output);
