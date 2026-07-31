/**
 * One-off regression check for Gemini patent summary quality.
 * Run: node --use-system-ca --env-file=.env.local scripts/prompt-regression.mjs
 */
const BASE = process.env.REGRESSION_BASE_URL || "http://localhost:3001";

const SAMPLES = [
  { id: "US", number: "US11734097B1" },
  // EP2784097A1은 SerpApi에서 간헐적으로 502 → 안정 샘플로 교체
  { id: "EP", number: "EP0415679A2" },
  { id: "JP", number: "JP2015526364A" },
];

const AWKWARD = [
  /에 의해 이루어/,
  /를 포함하는 것/,
  /에 관한 것이다$/,
  /제공된다\./,
  /구성된다\./,
  /\bis\b|\bare\b|\bthe\b|\band\b/i,
];

function collectStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out);
  }
  return out;
}

function koreanRatio(text) {
  const chars = text.replace(/\s+/g, "");
  if (!chars.length) return 1;
  const ko = (chars.match(/[\uac00-\ud7a3]/g) || []).length;
  return ko / chars.length;
}

function hasSpecifics(text) {
  return /(\d+\s*[-–~]\s*\d+|\d+\s*(°C|℃|wt%|%|MPa|h|시간|분|mM|mol)|환류|수소화|촉매)/i.test(
    text
  );
}

/** 흔한 용어에 영문 괄호 주석을 과도하게 붙인 경우 (번역투) */
function excessEnglishGlossCount(text) {
  const glosses = text.match(/[\uac00-\ud7a3]{2,}\s*\([A-Za-z][^)]{1,40}\)/g) || [];
  return glosses.length;
}

function scoreAnalysis(data) {
  const narrativeFields = [
    data.titleKo,
    data.abstractKo,
    data.problem,
    data.solution,
    data.technicalOverview,
    data.results?.summary,
    ...(data.results?.highlights || []),
    ...(data.methods || []).flatMap((m) => [m.title, ...(m.steps || [])]),
    ...(data.estimatedConditions || []).flatMap((e) => [
      e.parameter,
      e.estimatedValue,
      e.rationale,
    ]),
    ...(data.relatedKeywords || []),
  ].filter(Boolean);

  const joined = narrativeFields.join("\n");
  const ratio = koreanRatio(joined);
  const awkwardHits = AWKWARD.filter((re) => re.test(joined)).map((re) =>
    String(re)
  );
  const englishSentence =
    /\b(the invention|comprising|wherein|method of|composition for)\b/i.test(
      joined
    );
  const specifics = hasSpecifics(joined);
  const glossCount = excessEnglishGlossCount(joined);
  const estimateCount = data.estimatedConditions?.length || 0;
  const methodSteps =
    data.methods?.reduce((n, m) => n + (m.steps?.length || 0), 0) || 0;

  let score = 100;
  if (ratio < 0.55) score -= 35;
  else if (ratio < 0.7) score -= 15;
  score -= Math.min(30, awkwardHits.length * 8);
  if (englishSentence) score -= 25;
  if (!specifics) score -= 10;
  if (estimateCount < 2) score -= 10;
  if (methodSteps < 3) score -= 8;
  if (glossCount > 8) score -= Math.min(12, (glossCount - 8) * 2);

  return {
    score: Math.max(0, score),
    koreanRatio: Number(ratio.toFixed(3)),
    awkwardHits,
    englishSentence,
    specifics,
    glossCount,
    estimateCount,
    methodSteps,
    titleKo: data.titleKo,
    problemPreview: (data.problem || "").slice(0, 120),
    overviewPreview: (data.technicalOverview || "").slice(0, 120),
  };
}

async function analyzeOne(sample) {
  const started = Date.now();
  const response = await fetch(`${BASE}/api/patents/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patentNumber: sample.number,
      serpApiKey: process.env.SERPAPI_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json();
  const elapsedMs = Date.now() - started;
  if (!response.ok || !payload.data) {
    return {
      id: sample.id,
      number: sample.number,
      ok: false,
      status: response.status,
      error: payload.error?.message || "unknown",
      elapsedMs,
    };
  }
  return {
    id: sample.id,
    number: sample.number,
    ok: true,
    elapsedMs,
    ...scoreAnalysis(payload.data),
  };
}

async function main() {
  const results = [];
  for (const sample of SAMPLES) {
    process.stderr.write(`Analyzing ${sample.id} ${sample.number}...\n`);
    try {
      results.push(await analyzeOne(sample));
    } catch (error) {
      results.push({
        id: sample.id,
        number: sample.number,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  console.log(JSON.stringify({ base: BASE, results }, null, 2));
}

main();
