export type LegalStatus = "registered" | "published" | "expired" | "pending";

export type EstimatedCondition = {
  parameter: string;
  estimatedValue: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
};

export type RelatedPatent = {
  number: string;
  title: string;
  /** Gemini로 번역한 한국어 제목 (없으면 title 표시) */
  titleKo?: string;
  assignee: string;
  relevance: string;
  url: string;
};

export type PatentAnalysis = {
  number: string;
  title: string;
  titleKo: string;
  assignee: string;
  inventors: string[];
  filingDate: string;
  publicationDate: string;
  grantDate?: string;
  status: LegalStatus;
  statusLabel: string;
  ipc: string[];
  googlePatentsUrl: string;
  abstract: string;
  problem: string;
  solution: string;
  technicalOverview: string;
  methods: {
    title: string;
    steps: string[];
  }[];
  compositions: {
    name: string;
    role: string;
    disclosedRange?: string;
  }[];
  estimatedConditions: EstimatedCondition[];
  results: {
    summary: string;
    highlights: string[];
    quantitative: { metric: string; value: string; note?: string }[];
  };
  relatedKeywords: string[];
  relatedPatents: RelatedPatent[];
};

export const TOC_SECTIONS = [
  { id: "basic-info", label: "1. 기본 정보 및 법적 상태" },
  { id: "overview", label: "2. 기술 개요 및 목적" },
  { id: "methods", label: "3. 핵심 실험 방법 및 구성" },
  { id: "ai-estimate", label: "4. AI 추정 실험 조건" },
  { id: "results", label: "5. 실험 결과 및 효과" },
  { id: "related", label: "6. 연관 추천 특허" },
] as const;
