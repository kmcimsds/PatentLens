import "server-only";

import { load } from "cheerio";

import type { LegalStatus, RelatedPatent } from "@/lib/patent-types";
import { ApiError, isAbortError } from "@/lib/server/api-error";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";
const SERPAPI_TIMEOUT_MS = 25_000;

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

function relatedFrom(raw: JsonRecord, currentNumber: string): RelatedPatent[] {
  const candidates = [
    ...(Array.isArray(raw.similar_documents) ? raw.similar_documents : []),
    ...(Array.isArray(asRecord(raw.cited_by).original)
      ? (asRecord(raw.cited_by).original as unknown[])
      : []),
    ...(Array.isArray(asRecord(raw.cited_by).family_to_family)
      ? (asRecord(raw.cited_by).family_to_family as unknown[])
      : []),
  ];

  const seen = new Set<string>();
  const results: RelatedPatent[] = [];

  for (const candidate of candidates) {
    const item = asRecord(candidate);
    const number =
      asString(item.publication_number) ||
      asString(item.application_number);
    if (
      !number ||
      number.toUpperCase() === currentNumber.toUpperCase() ||
      seen.has(number)
    ) {
      continue;
    }

    seen.add(number);
    results.push({
      number,
      title: asString(item.title) || "제목 정보 없음",
      assignee:
        asString(item.assignee) ||
        asString(item.assignee_original) ||
        namesFrom(item.assignees).join(", ") ||
        "출원인 정보 없음",
      relevance: "Google Patents에서 확인된 유사·인용 특허",
      url:
        asString(item.link) ||
        `https://patents.google.com/patent/${encodeURIComponent(number)}/en`,
    });
    if (results.length === 5) break;
  }

  return results;
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
