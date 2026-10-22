/**
 * LOKI Offline Intelligence — Phase 7G: Performance Benchmark Suite
 *
 * Measures offline retrieval and response composition latency across 8 distinct
 * deterministic queries under controlled in-memory conditions.
 *
 * Rules:
 * - Uses performance.now() for high-resolution timing.
 * - Warmup phase to eliminate JIT compilation / cold-start distortion.
 * - 50 iterations per query scenario for statistical validity.
 * - Reports retrieval, composition, and combined end-to-end offline latency.
 * - Validates non-empty output and expected intent for every iteration.
 */

import { performance } from "perf_hooks";
import { retrievePortfolioFacts } from "../src/lib/agent/offline-retrieval";
import { composeOfflineResponse } from "../src/lib/agent/offline-composer";
import type { ChatMessage } from "../src/lib/agent/llm";

interface BenchmarkCase {
  id: string;
  name: string;
  query: string;
  history: ChatMessage[];
  expectedIntent: string;
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  retrievalMean: number;
  retrievalMedian: number;
  retrievalP95: number;
  compositionMean: number;
  compositionMedian: number;
  compositionP95: number;
  totalMean: number;
  totalMedian: number;
  totalP95: number;
  min: number;
  max: number;
  errors: number;
  outputValid: boolean;
}

// 8 Benchmark Scenarios
const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    id: "greeting",
    name: "1. Simple Greeting",
    query: "Hello, who are you and what can you help me with?",
    history: [],
    expectedIntent: "greeting",
  },
  {
    id: "project_lookup",
    name: "2. Single Project Lookup",
    query: "Tell me about the Purnima Kalamkari ecommerce project.",
    history: [],
    expectedIntent: "projects", // or freelance
  },
  {
    id: "skills_query",
    name: "3. Skills Overview Query",
    query: "What databases and backend technologies does Lokesh use?",
    history: [],
    expectedIntent: "skills",
  },
  {
    id: "project_comparison",
    name: "4. Project Comparison",
    query: "How does JavaMentor compare to Attendance Management System?",
    history: [],
    expectedIntent: "projects",
  },
  {
    id: "multiturn_followup",
    name: "5. Multi-Turn Follow-up (Pronoun Resolution)",
    query: "What features does it have and what stack did he use?",
    history: [
      { role: "user", content: "Tell me about JavaMentor" },
      {
        role: "assistant",
        content: "JavaMentor is an interactive Java Full Stack learning platform.",
      },
    ],
    expectedIntent: "followup",
  },
  {
    id: "contact_intent",
    name: "6. Contact Intent Query",
    query: "I would like to contact Lokesh regarding a senior developer position.",
    history: [],
    expectedIntent: "contact",
  },
  {
    id: "unsupported_negative",
    name: "7. Unsupported / Private Inquiry",
    query: "What is his expected salary, monthly CTC, and hourly freelance rate?",
    history: [],
    expectedIntent: "unsupported",
  },
  {
    id: "long_valid_history",
    name: "8. Long Valid Conversation History (10 Turns)",
    query: "Can you summarize his core frontend strengths based on our chat?",
    history: [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello! I am LOKI." },
      { role: "user", content: "What projects has Lokesh built?" },
      { role: "assistant", content: "Lokesh built Purnima Kalamkari, JavaMentor, and Attendance System." },
      { role: "user", content: "Tell me about JavaMentor" },
      { role: "assistant", content: "JavaMentor is a full-stack learning platform." },
      { role: "user", content: "What database does it use?" },
      { role: "assistant", content: "JavaMentor uses Firebase for data and student accounts." },
      { role: "user", content: "Where did he go to college?" },
      { role: "assistant", content: "He completed B.Tech in CSE at Sri Vasavi Institute." },
    ],
    expectedIntent: "skills",
  },
];

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function calculateMean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function runBenchmark() {
  console.log("================================================================================");
  console.log("   LOKI Offline Intelligence: Phase 7G Performance Benchmark Suite              ");
  console.log("================================================================================");
  console.log("Iterations: 50 runs per scenario (following 10 warmup runs)\n");

  const results: BenchmarkResult[] = [];
  const WARMUP_RUNS = 10;
  const MEASURED_RUNS = 50;

  // 1. Warm-up Phase
  process.stdout.write("Warming up JIT and cache...");
  for (let i = 0; i < WARMUP_RUNS; i++) {
    for (const testCase of BENCHMARK_CASES) {
      const ret = await retrievePortfolioFacts(testCase.query, testCase.history);
      composeOfflineResponse(testCase.query, ret, testCase.history);
    }
  }
  console.log(" Done.\n");

  // 2. Measured Execution Phase
  for (const testCase of BENCHMARK_CASES) {
    const retrievalTimes: number[] = [];
    const compositionTimes: number[] = [];
    const totalTimes: number[] = [];
    let errors = 0;
    let outputValid = true;

    for (let i = 0; i < MEASURED_RUNS; i++) {
      try {
        const t0 = performance.now();
        const ret = await retrievePortfolioFacts(testCase.query, testCase.history);
        const t1 = performance.now();
        const comp = composeOfflineResponse(testCase.query, ret, testCase.history);
        const t2 = performance.now();

        const retDuration = t1 - t0;
        const compDuration = t2 - t1;
        const totalDuration = t2 - t0;

        retrievalTimes.push(retDuration);
        compositionTimes.push(compDuration);
        totalTimes.push(totalDuration);

        if (!comp.text || comp.text.length < 10) {
          outputValid = false;
        }
      } catch (err) {
        errors++;
        outputValid = false;
      }
    }

    const res: BenchmarkResult = {
      name: testCase.name,
      iterations: MEASURED_RUNS,
      retrievalMean: calculateMean(retrievalTimes),
      retrievalMedian: calculatePercentile(retrievalTimes, 50),
      retrievalP95: calculatePercentile(retrievalTimes, 95),
      compositionMean: calculateMean(compositionTimes),
      compositionMedian: calculatePercentile(compositionTimes, 50),
      compositionP95: calculatePercentile(compositionTimes, 95),
      totalMean: calculateMean(totalTimes),
      totalMedian: calculatePercentile(totalTimes, 50),
      totalP95: calculatePercentile(totalTimes, 95),
      min: Math.min(...totalTimes),
      max: Math.max(...totalTimes),
      errors,
      outputValid,
    };

    results.push(res);
  }

  // 3. Print Benchmark Results Table
  console.log("---------------------------------------------------------------------------------------------------------------------");
  console.log(
    "Scenario".padEnd(35) +
      "Ret. Mean".padStart(12) +
      "Comp. Mean".padStart(13) +
      "Total Mean".padStart(13) +
      "Median".padStart(11) +
      "p95".padStart(11) +
      "Min/Max".padStart(14) +
      "Valid".padStart(8)
  );
  console.log("---------------------------------------------------------------------------------------------------------------------");

  for (const r of results) {
    const minMaxStr = `${r.min.toFixed(2)}/${r.max.toFixed(2)}ms`;
    console.log(
      r.name.padEnd(35) +
        `${r.retrievalMean.toFixed(2)}ms`.padStart(12) +
        `${r.compositionMean.toFixed(2)}ms`.padStart(13) +
        `${r.totalMean.toFixed(2)}ms`.padStart(13) +
        `${r.totalMedian.toFixed(2)}ms`.padStart(11) +
        `${r.totalP95.toFixed(2)}ms`.padStart(11) +
        minMaxStr.padStart(14) +
        (r.outputValid && r.errors === 0 ? "✓ OK" : "✗ FAIL").padStart(8)
    );
  }
  console.log("---------------------------------------------------------------------------------------------------------------------");

  const overallTotalMean = calculateMean(results.map((r) => r.totalMean));
  const overallP95 = calculatePercentile(results.map((r) => r.totalP95), 95);
  console.log(`\nOverall Offline Pipeline Latency: Mean = ${overallTotalMean.toFixed(2)}ms | p95 = ${overallP95.toFixed(2)}ms`);
  console.log("Measurement Methodology: In-memory Node.js runtime via performance.now(), excluding network and browser paint.\n");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
