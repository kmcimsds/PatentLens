import "server-only";

import type { FigureAnalysis, PatentAnalysis } from "@/lib/patent-types";
import { NO_FIGURE_FALLBACK } from "@/lib/patent-types";
import { ApiError } from "@/lib/server/api-error";
import {
  analyzeFigureWithGemini,
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
  const [analysis, relatedPatents, figureAnalysis] = await Promise.all([
    analyzePatentWithGemini(patent, geminiApiKey),
    translateRelatedPatentTitles(patent.relatedPatents, geminiApiKey),
    analyzeFigureWithGemini(patent, geminiApiKey).catch((error): FigureAnalysis => {
      console.warn("Figure analysis failed", {
        detail: error instanceof Error ? error.message : "unknown",
      });
      const imageUrl = patent.images[0];
      return imageUrl
        ? {
            hasFigure: true,
            imageUrl,
            figureType: "미확인",
            summary:
              "대표 도면은 확인되었으나 이미지 해석에 실패하여 본문 텍스트 기반으로 요약을 구성했습니다.",
          }
        : {
            hasFigure: false,
            figureType: "도면 없음",
            summary: NO_FIGURE_FALLBACK,
          };
    }),
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
    priorArt: uniqueBy(
      analysis.priorArt,
      (item) => `${normalizedKey(item.reference)}|${normalizedKey(item.approach)}`
    ),
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
    figureAnalysis,
  };
}
