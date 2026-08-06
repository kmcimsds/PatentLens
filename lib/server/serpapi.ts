import "server-only";

import { load } from "cheerio";

import type { LegalStatus, RelatedPatent } from "@/lib/patent-types";
import { ApiError, isAbortError } from "@/lib/server/api-error";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";
const SERPAPI_TIMEOUT_MS = 25_000;

// 연관 특허 추천 가중치. Google Patents가 돌려주는 순서는 오래된 원천 특허 쪽으로
// 크게 쏠려 있어, 관련성과 최신성을 함께 반영해 다시 정렬한다.
const RELATED_LIMIT = 5;
const RELEVANCE_WEIGHT = 0.45;
const RECENCY_WEIGHT = 0.55;
const HALF_LIFE_BASE = 0.5;
const RECENCY_HALF_LIFE_YEARS = 7;
const RELEVANCE_HALF_LIFE_RANK = 8;
const RECENT_WINDOW_YEARS = 10;
const MIN_RECENT_RELATED = 2;
const MIN_SIMILAR_RELATED = 1;

type JsonRecord = Record<string, unknown>;

export type SerpPatentData = {
  number: string;
  title: string;
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
  claims: string;
  description: string;
  relatedPatents: RelatedPatent[];
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function textFrom(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map(textFrom)
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    const preferred =
      asString(record.text) ||
      asString(record.claim) ||
      asString(record.description) ||
      asString(record.title);
    if (preferred) return preferred;
    return Object.values(record)
      .map(textFrom)
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function namesFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return asString(asRecord(item).name);
    })
    .filter(Boolean);
}

function flattenApplications(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  return Object.values(record).flatMap((applications) =>
    Array.isArray(applications) ? applications.map(asRecord) : []
  );
}

function deriveStatus(
  raw: JsonRecord,
  applications: JsonRecord[]
): Pick<SerpPatentData, "status" | "statusLabel"> {
  const publicationNumber = asString(raw.publication_number).toUpperCase();
  const matching =
    applications.find((application) => application.this_app === true) ??
    applications.find(
      (application) =>
        asString(application.document_id)
          .toUpperCase()
          .includes(publicationNumber) ||
        asString(application.application_number).toUpperCase() === publicationNumber
    ) ?? applications[applications.length - 1];

  const rawStatus = (
    asString(matching?.legal_status) ||
    asString(matching?.legal_status_cat) ||
    asString(raw.legal_status) ||
    asString(raw.type)
  ).toLowerCase();

  if (/expire|lapse|ceased|not.active|withdraw|revok|dead/.test(rawStatus)) {
    return { status: "expired", statusLabel: "만료/소멸" };
  }
  if (/pending|application/.test(rawStatus)) {
    return { status: "pending", statusLabel: "심사 중" };
  }
  if (/active|grant|registered/.test(rawStatus)) {
    return { status: "registered", statusLabel: "등록" };
  }
  return { status: "published", statusLabel: "공개" };
}

function deriveGrantDate(raw: JsonRecord): string | undefined {
  const events = [
    ...(Array.isArray(raw.events) ? raw.events : []),
    ...(Array.isArray(raw.legal_events) ? raw.legal_events : []),
  ];
  const grantEvent = events
    .map(asRecord)
    .find((event) =>
      /grant|patent grant|등록|특허권 설정/i.test(
        `${asString(event.title)} ${asString(event.type)} ${asString(event.code)}`
      )
    );
  return asString(raw.grant_date) || asString(grantEvent?.date) || undefined;
}

async function fetchDescription(descriptionLink: string): Promise<string> {
  if (!descriptionLink) return "";

  let url: URL;
  try {
    url = new URL(descriptionLink, "https://patents.google.com");
  } catch {
    return "";
  }
  if (url.protocol !== "https:" || url.hostname !== "patents.google.com") {
    return "";
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
      headers: {
        Accept: "text/html",
        "User-Agent": "PatentLens/1.0 (patent analysis service)",
      },
    });
    if (!response.ok) return "";

    const html = await response.text();
    const $ = load(html);
    const description = $(
      'section[itemprop="description"], section#description, .description'
    )
      .first()
      .text();
    return description.replace(/\s+/g, " ").trim();
  } catch {
    // 상세 설명을 못 가져와도 초록·청구항 분석은 계속 진행합니다.
    return "";
  }
}

type RelatedSource = "citedBy" | "similar" | "family";

// cited_by.original은 이 특허와 직접 맺어진 인용 관계라 연결이 가장 확실하고,
// family_to_family는 패밀리 단위 인용이라 가장 느슨하다.
const SOURCE_WEIGHT: Record<RelatedSource, number> = {
  citedBy: 1,
  similar: 0.85,
  family: 0.7,
};

// similar_documents만 관련도순으로 내려오고, cited_by 계열은 공개일 오름차순이다.
// 후자에 순번 감쇠를 적용하면 오히려 최신 인용 특허가 뒤로 밀린다.
const RANKED_BY_RELEVANCE: Record<RelatedSource, boolean> = {
  citedBy: false,
  similar: true,
  family: false,
};

const SOURCE_LABEL: Record<RelatedSource, string> = {
  citedBy: "이 특허와 인용 관계인 특허",
  similar: "Google Patents 유사 문헌",
  family: "특허 패밀리 인용 문헌",
};

type RankedRelated = {
  patent: RelatedPatent;
  source: RelatedSource;
  year?: number;
  score: number;
};

function relevanceScoreFor(source: RelatedSource, index: number): number {
  const weight = SOURCE_WEIGHT[source];
  if (!RANKED_BY_RELEVANCE[source]) return weight;
  return weight * HALF_LIFE_BASE ** (index / RELEVANCE_HALF_LIFE_RANK);
}

// cited_by 목록에는 본특허보다 공개일이 앞선 문헌도 섞여 들어오므로,
// 실제로 뒤에 나온 문헌일 때만 "후속 특허"라고 단정한다.
function relevanceLabel(
  source: RelatedSource,
  year: number | undefined,
  sourceYear: number | undefined
): string {
  if (source !== "citedBy") return SOURCE_LABEL[source];
  const isForward =
    year !== undefined && sourceYear !== undefined && year > sourceYear;
  return isForward ? "이 특허를 인용한 후속 특허" : SOURCE_LABEL.citedBy;
}

function publicationYear(value: string): number | undefined {
  const match = /^(\d{4})/.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const limit = new Date().getFullYear() + 1;
  return year >= 1800 && year <= limit ? year : undefined;
}

function recencyScore(year: number | undefined): number {
  // 연도를 모르는 후보는 최신·구형 어느 쪽으로도 단정할 수 없어 중간보다 약간 낮게 둔다.
  if (year === undefined) return 0.35;
  const age = Math.max(0, new Date().getFullYear() - year);
  return HALF_LIFE_BASE ** (age / RECENCY_HALF_LIFE_YEARS);
}

// 종합 점수만으로 자르면 5칸이 한쪽으로 쏠린다. 인용 관계는 최신 문헌이, 유사 문헌은
// 의미적으로 가까운 문헌이 강점이므로 각각의 자리를 먼저 확보한 뒤 나머지를 점수로 채운다.
function pickBalanced(ranked: RankedRelated[]): RankedRelated[] {
  const cutoff = new Date().getFullYear() - RECENT_WINDOW_YEARS;
  const picked: RankedRelated[] = [];
  const taken = new Set<RankedRelated>();

  const reserve = (pool: RankedRelated[], slots: number) => {
    let remaining = Math.min(slots, RELATED_LIMIT - picked.length);
    for (const item of pool) {
      if (remaining <= 0) break;
      if (taken.has(item)) continue;
      picked.push(item);
      taken.add(item);
      remaining -= 1;
    }
  };

  reserve(
    ranked.filter((item) => item.year !== undefined && item.year >= cutoff),
    MIN_RECENT_RELATED
  );
  reserve(
    ranked.filter((item) => item.source === "similar"),
    MIN_SIMILAR_RELATED
  );
  reserve(ranked, RELATED_LIMIT);

  return picked.sort((a, b) => b.score - a.score);
}

function relatedFrom(raw: JsonRecord, currentNumber: string): RelatedPatent[] {
  const citedBy = asRecord(raw.cited_by);
  const groups: { source: RelatedSource; items: unknown[] }[] = [
    {
      source: "citedBy",
      items: Array.isArray(citedBy.original) ? citedBy.original : [],
    },
    {
      source: "similar",
      items: Array.isArray(raw.similar_documents) ? raw.similar_documents : [],
    },
    {
      source: "family",
      items: Array.isArray(citedBy.family_to_family)
        ? citedBy.family_to_family
        : [],
    },
  ];

  const sourceYear = publicationYear(asString(raw.publication_date));
  const seen = new Set<string>();
  const ranked: RankedRelated[] = [];

  for (const group of groups) {
    for (let index = 0; index < group.items.length; index += 1) {
      const item = asRecord(group.items[index]);
      const number =
        asString(item.publication_number) ||
        asString(item.application_number);
      const key = number.toUpperCase();
      if (!key || key === currentNumber.toUpperCase() || seen.has(key)) {
        continue;
      }
      seen.add(key);

      const publicationDate = asString(item.publication_date);
      const year =
        publicationYear(publicationDate) ||
        publicationYear(asString(item.priority_date));
      const relevance = relevanceScoreFor(group.source, index);

      ranked.push({
        year,
        source: group.source,
        score:
          RELEVANCE_WEIGHT * relevance + RECENCY_WEIGHT * recencyScore(year),
        patent: {
          number,
          title: asString(item.title) || "제목 정보 없음",
          assignee:
            asString(item.assignee) ||
            asString(item.assignee_original) ||
            namesFrom(item.assignees).join(", ") ||
            "출원인 정보 없음",
          publicationDate: publicationDate || undefined,
          relevance: relevanceLabel(group.source, year, sourceYear),
          url: `https://patents.google.com/patent/${encodeURIComponent(number)}/en`,
        },
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return pickBalanced(ranked).map((item) => item.patent);
}

export function normalizePatentNumber(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/[\s-]+/g, "");
  if (!/^[A-Z]{2}(?=[A-Z0-9]*\d)[A-Z0-9]{5,20}$/.test(normalized)) {
    throw new ApiError(
      400,
      "INVALID_PATENT_NUMBER",
      "특허 번호 형식을 확인해 주세요. 예: US10123456B2, KR20070116676A"
    );
  }
  return normalized;
}

export async function fetchPatentFromSerpApi(
  patentNumber: string,
  userApiKey?: string
): Promise<SerpPatentData> {
  const apiKey = userApiKey?.trim() || process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new ApiError(
      400,
      "CONFIGURATION_ERROR",
      "API 키를 먼저 설정해 주세요. 상단의 API 키 설정에서 SerpApi Key를 입력하세요."
    );
  }

  const url = new URL(SERPAPI_ENDPOINT);
  url.searchParams.set("engine", "google_patents_details");
  url.searchParams.set("patent_id", `patent/${patentNumber}/en`);
  url.searchParams.set("api_key", apiKey);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(SERPAPI_TIMEOUT_MS),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        504,
        "UPSTREAM_TIMEOUT",
        "Google Patents 조회 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
        true
      );
    }
    throw new ApiError(
      502,
      "ANALYSIS_FAILED",
      "Google Patents 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      true
    );
  }

  if (response.status === 429) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "SerpApi 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      true
    );
  }

  const raw = asRecord(await response.json().catch(() => ({})));
  const upstreamError = asString(raw.error);

  if (
    response.status === 429 ||
    /rate limit|out of searches|monthly limit|too many requests/i.test(
      upstreamError
    )
  ) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "SerpApi 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      true
    );
  }
  if (
    response.status === 404 ||
    /not found|no results|couldn't find|does not exist/i.test(upstreamError)
  ) {
    throw new ApiError(
      404,
      "PATENT_NOT_FOUND",
      "해당 특허 번호를 Google Patents에서 찾을 수 없습니다."
    );
  }
  if (!response.ok || upstreamError) {
    throw new ApiError(
      response.status >= 400 ? response.status : 502,
      "ANALYSIS_FAILED",
      "Google Patents 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      response.status >= 500
    );
  }

  const title = asString(raw.title);
  const publicationNumber =
    asString(raw.publication_number) || patentNumber;
  if (!title && !asString(raw.abstract)) {
    throw new ApiError(
      404,
      "PATENT_NOT_FOUND",
      "해당 특허 번호를 Google Patents에서 찾을 수 없습니다."
    );
  }

  const applications = flattenApplications(raw.worldwide_applications);
  const status = deriveStatus(raw, applications);
  const classifications = Array.isArray(raw.classifications)
    ? raw.classifications
        .map((item) => asString(asRecord(item).code))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const assignees = namesFrom(raw.assignees);
  const inventors = namesFrom(raw.inventors);
  const googlePatentsUrl =
    asString(raw.main_url) ||
    asString(asRecord(raw.search_metadata).google_patents_url) ||
    `https://patents.google.com/patent/${encodeURIComponent(publicationNumber)}/en`;
  const description = await fetchDescription(
    asString(raw.description_link) || `${googlePatentsUrl}#description`
  );

  return {
    number: publicationNumber,
    title,
    assignee: assignees.join(", ") || "출원인 정보 없음",
    inventors: inventors.length ? inventors : ["발명자 정보 없음"],
    filingDate: asString(raw.filing_date) || "정보 없음",
    publicationDate: asString(raw.publication_date) || "정보 없음",
    grantDate: deriveGrantDate(raw),
    ...status,
    ipc: classifications,
    googlePatentsUrl,
    abstract: asString(raw.abstract),
    claims: textFrom(raw.claims),
    description: description || textFrom(raw.description),
    relatedPatents: relatedFrom(raw, publicationNumber),
  };
}
