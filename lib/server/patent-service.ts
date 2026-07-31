import "server-only";

import type { PatentAnalysis } from "@/lib/patent-types";
import { ApiError } from "@/lib/server/api-error";
import {
  analyzePatentWithGemini,
  translateRelatedPatentTitles,
} from "@/lib/server/gemini";
import {
  fetchPatentFromSerpApi,
  normalizePatentNumber,
} from "@/lib/server/serpapi";

export type AnalyzePatentOptions = {
  serpApiKey?: string;
  geminiApiKey?: string;
};

function normalizedKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function analyzePatent(
  input: string,
  options: AnalyzePatentOptions = {}
): Promise<PatentAnalysis> {
  const serpApiKey = options.serpApiKey?.trim() || process.env.SERPAPI_KEY;
  const geminiApiKey = options.geminiApiKey?.trim() || process.env.GEMINI_API_KEY;

  if (!serpApiKey || !geminiApiKey) {
    throw new ApiError(
      400,
      "CONFIGURATION_ERROR",
      "API 키를 먼저 설정해 주세요. 상단의 API 키 설정에서 SerpApi Key와 Gemini API Key를 입력하세요."
    );
  }

  const patentNumber = normalizePatentNumber(input);
  const patent = await fetchPatentFromSerpApi(patentNumber, serpApiKey);
  const [analysis, relatedPatents] = await Promise.all([
    analyzePatentWithGemini(patent, geminiApiKey),
    translateRelatedPatentTitles(patent.relatedPatents, geminiApiKey),
  ]);

  return {
    number: patent.number,
    title: patent.title,
    titleKo: analysis.titleKo,
    assignee: patent.assignee,
    inventors: patent.inventors,
    filingDate: patent.filingDate,
    publicationDate: patent.publicationDate,
    grantDate: patent.grantDate,
    status: patent.status,
    statusLabel: patent.statusLabel,
    ipc: patent.ipc,
    googlePatentsUrl: patent.googlePatentsUrl,
    abstract: analysis.abstractKo || patent.abstract || "초록 정보가 제공되지 않았습니다.",
    problem: analysis.problem,
    solution: analysis.solution,
    technicalOverview: analysis.technicalOverview,
    methods: analysis.methods,
    compositions: analysis.compositions.map((item) => ({
      ...item,
      disclosedRange:
        item.disclosedRange === "원문에 명시 없음"
          ? undefined
          : item.disclosedRange,
    })),
    estimatedConditions: uniqueBy(
      analysis.estimatedConditions,
      (item) =>
        `${normalizedKey(item.parameter)}|${normalizedKey(item.estimatedValue)}`
    ),
    results: {
      summary: analysis.results.summary,
      highlights: uniqueBy(analysis.results.highlights, normalizedKey),
      quantitative: uniqueBy(
        analysis.results.quantitative,
        (item) =>
          `${normalizedKey(item.metric)}|${normalizedKey(item.value)}|${normalizedKey(item.note)}`
      ).map((item) => ({
        ...item,
        note: item.note || undefined,
      })),
    },
    relatedKeywords: uniqueBy(analysis.relatedKeywords, normalizedKey),
    relatedPatents,
  };
}
