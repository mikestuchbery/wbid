import { GoogleGenAI } from "@google/genai";

const apiKey = "test_key";

// Baseline: Re-instantiating every time
const startBaseline = performance.now();
for (let i = 0; i < 10000; i++) {
  const ai = new GoogleGenAI({ apiKey });
}
const endBaseline = performance.now();
const baselineTime = endBaseline - startBaseline;

// Optimized: Instantiating once
const startOptimized = performance.now();
const aiInstance = new GoogleGenAI({ apiKey });
for (let i = 0; i < 10000; i++) {
  const ai = aiInstance;
}
const endOptimized = performance.now();
const optimizedTime = endOptimized - startOptimized;

console.log(`Baseline (instantiating inside loop): ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized (instantiating outside loop): ${optimizedTime.toFixed(2)} ms`);
console.log(`Improvement: ${(baselineTime - optimizedTime).toFixed(2)} ms (or ${(baselineTime / optimizedTime).toFixed(2)}x faster)`);
