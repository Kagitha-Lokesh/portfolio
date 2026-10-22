import { renderAssistantMarkdown } from "../src/components/agent/LokiWidgetIntegration";
import { JSDOM } from "jsdom";

console.log("================================================================================");
console.log("       LOKI Markdown Rendering Verification Test Suite (Prompt Section 7)      ");
console.log("================================================================================");

const testMarkdown = `### Lokesh's projects:
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

const html = renderAssistantMarkdown(testMarkdown);
const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
const doc = dom.window.document;

let passed = 0;
let total = 0;

function assert(condition: boolean, description: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    console.error(`  ✗ [FAIL] ${description}`);
    process.exitCode = 1;
  }
}

// 1. Table structure: three columns and exactly two body rows
const table = doc.querySelector("table");
assert(table !== null, "Table element is created");
if (table) {
  const headers = table.querySelectorAll("thead th");
  assert(headers.length === 3, `Table has exactly 3 column headers (found ${headers.length})`);
  assert(headers[0]?.textContent === "Project", "Header 1 is 'Project'");
  assert(headers[1]?.textContent === "Year", "Header 2 is 'Year'");
  assert(headers[2]?.textContent === "Tech Stack", "Header 3 is 'Tech Stack'");

  const rows = table.querySelectorAll("tbody tr");
  assert(rows.length === 2, `Table has exactly 2 body rows (found ${rows.length})`);

  // 2. Bold formatting inside table cells
  const boldCells = table.querySelectorAll("tbody td strong");
  assert(boldCells.length >= 2, `Bold elements found inside table cells (found ${boldCells.length})`);
  assert(boldCells[0]?.textContent === "Purnima Kalamkari", "First cell has bold 'Purnima Kalamkari'");
  assert(boldCells[1]?.textContent === "JavaMentor", "Second row cell has bold 'JavaMentor'");
}

// 3. Highlights heading renders as a heading
const heading = doc.querySelector("h4");
assert(heading !== null && heading.textContent === "Highlights", "The Highlights heading renders as an <h4> element");

// 4. Nested bullet list and numbered list render correctly
const ul = doc.querySelector("ul");
assert(ul !== null, "Unordered list renders correctly");
const nestedUl = ul?.querySelector("ul");
assert(nestedUl !== null, "Nested bullet list <ul> exists inside outer <ul>");
assert(nestedUl?.textContent?.includes("nested item") === true, "Nested bullet list contains 'nested item'");

const ol = doc.querySelector("ol");
assert(ol !== null, "Ordered list renders correctly");
const olItems = ol?.querySelectorAll("li") || [];
assert(olItems.length === 2, `Ordered list has 2 items (found ${olItems.length})`);
assert(olItems[0]?.textContent === "First", "First ordered item is 'First'");
assert(olItems[1]?.textContent === "Second", "Second ordered item is 'Second'");

// 5. Permitted links are clickable with target="_blank" and rel="noopener noreferrer"
const links = doc.querySelectorAll("a");
const githubLink = Array.from(links).find((a) => a.href === "https://github.com/x/y");
assert(githubLink !== undefined, "GitHub https: link is rendered and clickable");
assert(githubLink?.getAttribute("target") === "_blank", "GitHub link has target='_blank'");
assert(githubLink?.getAttribute("rel") === "noopener noreferrer", "GitHub link has rel='noopener noreferrer'");

const autoLink = Array.from(links).find((a) => a.href === "https://example.com/a");
assert(autoLink !== undefined, "Autolinked https://example.com/a is rendered and clickable");

// 6. Literal <img ...> appears as text; no image element is created and no JavaScript executes
const imgElement = doc.querySelector("img");
assert(imgElement === null, "No <img> element is created in DOM (zero executable markup)");
assert(doc.body.innerHTML.includes("&lt;img src=x onerror=alert(1)&gt;"), "Literal '<img src=x onerror=alert(1)>' appears escaped as safe text");

// 7. Unsafe javascript: link is NOT clickable
const jsLink = Array.from(links).find((a) => a.href.includes("javascript"));
assert(jsLink === undefined, "Unsafe javascript: link is NOT clickable (no <a> element with javascript: href)");
assert(doc.body.textContent?.includes("bad") === true, "The label 'bad' from [bad](javascript:alert(1)) remains visible as plain text");

// 8. No raw ** or table separator syntax (|---) remains visible
assert(!doc.body.textContent?.includes("**"), "No raw '**' syntax remains visible");
assert(!doc.body.textContent?.includes("|---"), "No raw table separator syntax '|---' remains visible");

// 9. Table wrapping container exists
const tableWrap = doc.querySelector(".lk-table-wrap");
assert(tableWrap !== null, "Table is wrapped in '.lk-table-wrap' container for responsive horizontal scrolling");

console.log("================================================================================");
console.log(`Verification Results: ${passed}/${total} assertions passed successfully.`);
console.log("================================================================================");

if (passed === total) {
  console.log("✓ All Section 7 Markdown verification assertions PASSED!\n");
} else {
  console.error("✗ Some assertions failed.\n");
  process.exit(1);
}
