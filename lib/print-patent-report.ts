import type { PatentAnalysis } from "@/lib/patent-types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string): string {
  return `<p>${escapeHtml(text)}</p>`;
}

function list(items: string[]): string {
  if (!items.length) return "<p>해당 항목 없음</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function reportStyles(): string {
  return `
  @page {
    size: A4;
    margin: 16mm 14mm;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  body {
    /* Noto Sans KR은 PDF에 폰트로 임베드되어 드래그·복사가 가능함.
       시스템 폰트만 쓰면 숨김 iframe/일부 환경에서 윤곽선(그림)으로만 저장됨. */
    font-family: "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #111827;
  }

  /* 인쇄 시에도 테두리·배경색 유지 */
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  h1, h2, h3, p, li, td, th, strong, div {
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  /* 제목이 페이지 끝에 혼자 남지 않도록 */
  h1, h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* 문단 첫/끝 줄이 한 줄만 떨어지지 않도록 */
  p, li {
    orphans: 3;
    widows: 3;
    margin: 0 0 8px;
  }

  .pdf-cover {
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 3px solid #0f766e;
  }
  .pdf-cover .brand {
    font-size: 9pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0f766e;
    font-weight: 700;
    margin-bottom: 8px;
  }
  .pdf-cover h1 {
    margin: 0 0 14px;
    font-size: 17pt;
    line-height: 1.4;
    color: #0f172a;
  }
  .pdf-cover .meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 14px;
    padding: 12px 14px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #f8fafc;
    font-size: 9.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .pdf-section {
    margin-bottom: 20px;
  }
  .pdf-section h2 {
    margin: 0 0 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #0f766e;
    font-size: 13pt;
    color: #0f172a;
  }
  .pdf-section h3 {
    margin: 14px 0 6px;
    font-size: 11pt;
    color: #134e4a;
  }
  .pdf-section ul,
  .pdf-section ol {
    margin: 0 0 10px;
    padding-left: 20px;
  }

  /* 카드·지표는 작은 단위라 통째로 유지, 긴 목록은 자연스럽게 분할 */
  .pdf-card,
  .pdf-metric {
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: #ffffff;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .pdf-card-title {
    font-weight: 700;
    margin-bottom: 4px;
  }
  .pdf-mono {
    font-family: Consolas, "Courier New", monospace;
    color: #0f766e;
    margin-bottom: 4px;
  }
  .pdf-subtle {
    font-size: 9pt;
    color: #6b7280;
    margin: 2px 0 6px;
  }

  .pdf-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 10px;
  }
  .pdf-metric .label { font-size: 9pt; color: #6b7280; }
  .pdf-metric .value { font-size: 12pt; font-weight: 700; margin-top: 2px; }
  .pdf-metric .note { font-size: 9pt; color: #6b7280; margin-top: 2px; }

  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin: 8px 0 14px;
    font-size: 9.5pt;
  }
  /* 표가 여러 장에 걸치면 머리행 반복 */
  thead { display: table-header-group; }
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f1f5f9; font-weight: 700; }
  th:nth-child(1), td:nth-child(1) { width: 28%; }
  th:nth-child(2), td:nth-child(2) { width: 36%; }
  th:nth-child(3), td:nth-child(3) { width: 36%; }

  .hint {
    padding: 9px 12px;
    border-radius: 8px;
    background: #ecfdf5;
    border: 1px solid #99f6e4;
    color: #115e59;
    font-size: 9.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }`;
}

function reportBody(data: PatentAnalysis): string {
  const compositionsRows = data.compositions
    .map(
      (item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.role)}</td>
        <td>${escapeHtml(item.disclosedRange ?? "—")}</td>
      </tr>`
    )
    .join("");

  const methodsHtml = data.methods
    .map(
      (method) => `<div class="pdf-block">
        <h3>${escapeHtml(method.title)}</h3>
        <ol>${method.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      </div>`
    )
    .join("");

  const estimatesHtml = data.estimatedConditions
    .map(
      (item) => `<div class="pdf-card">
        <div class="pdf-card-title">${escapeHtml(item.parameter)} · 신뢰도 ${escapeHtml(item.confidence)}</div>
        <div class="pdf-mono">${escapeHtml(item.estimatedValue)}</div>
        <p>${escapeHtml(item.rationale)}</p>
      </div>`
    )
    .join("");

  const quantitativeHtml = data.results.quantitative
    .map(
      (item) => `<div class="pdf-metric">
        <div class="label">${escapeHtml(item.metric)}</div>
        <div class="value">${escapeHtml(item.value)}</div>
        ${item.note ? `<div class="note">${escapeHtml(item.note)}</div>` : ""}
      </div>`
    )
    .join("");

  const relatedHtml = data.relatedPatents.length
    ? data.relatedPatents
        .map(
          (item) => `<div class="pdf-card">
            <div class="pdf-mono">${escapeHtml(item.number)}</div>
            <strong>${escapeHtml(item.titleKo || item.title)}</strong>
            ${
              item.titleKo && item.titleKo !== item.title
                ? `<p class="pdf-subtle">원문: ${escapeHtml(item.title)}</p>`
                : ""
            }
            <p>${escapeHtml(item.assignee)}</p>
            <p>${escapeHtml(item.relevance)}</p>
          </div>`
        )
        .join("")
    : "<p>연관 특허 정보가 없습니다.</p>";

  return `
  <header class="pdf-cover">
    <div class="brand">PatentLens 분석 보고서</div>
    <h1>${escapeHtml(data.titleKo)}</h1>
    <div class="meta">
      <div><strong>공개번호</strong> ${escapeHtml(data.number)}</div>
      <div><strong>법적 상태</strong> ${escapeHtml(data.statusLabel)}</div>
      <div><strong>출원인</strong> ${escapeHtml(data.assignee)}</div>
      <div><strong>공개일</strong> ${escapeHtml(data.publicationDate)}</div>
    </div>
  </header>

  <section class="pdf-section">
    <h2>1. 기본 정보 및 법적 상태</h2>
    ${paragraph(`원문 제목: ${data.title}`)}
    ${paragraph(`발명자: ${data.inventors.join(", ")}`)}
    ${paragraph(`출원일: ${data.filingDate}`)}
    ${data.grantDate ? paragraph(`등록일: ${data.grantDate}`) : ""}
    ${paragraph(`분류 코드: ${data.ipc.join(", ") || "정보 없음"}`)}
    ${paragraph(`Google Patents: ${data.googlePatentsUrl}`)}
  </section>

  <section class="pdf-section">
    <h2>2. 기술 개요 및 목적</h2>
    ${paragraph(data.technicalOverview)}
    <h3>해결하려는 과제</h3>
    ${paragraph(data.problem)}
    <h3>발명의 핵심</h3>
    ${paragraph(data.solution)}
    <h3>요약 (Abstract)</h3>
    ${paragraph(data.abstract)}
  </section>

  <section class="pdf-section">
    <h2>3. 핵심 실험 방법 및 구성</h2>
    <h3>조성물 / 구성 요소</h3>
    <table>
      <thead>
        <tr><th>명칭</th><th>역할</th><th>개시 범위</th></tr>
      </thead>
      <tbody>${compositionsRows || `<tr><td colspan="3">구성 정보 없음</td></tr>`}</tbody>
    </table>
    ${methodsHtml || "<p>실험 방법 정보 없음</p>"}
  </section>

  <section class="pdf-section">
    <h2>4. AI 추정 실험 조건</h2>
    <p class="hint">특허 문헌에 생략되거나 모호하게 기재된 조건을 문맥으로 추정한 내용입니다. 실제 실험 전 교차 검증이 필요합니다.</p>
    ${estimatesHtml || "<p>추정 조건 없음</p>"}
  </section>

  <section class="pdf-section">
    <h2>5. 실험 결과 및 효과</h2>
    ${paragraph(data.results.summary)}
    <h3>주요 하이라이트</h3>
    ${list(data.results.highlights)}
    <div class="pdf-metrics">${quantitativeHtml || "<p>정량 결과 없음</p>"}</div>
  </section>

  <section class="pdf-section">
    <h2>6. 연관 추천 특허</h2>
    <h3>추천 검색 키워드 / 기술 분야</h3>
    ${list(data.relatedKeywords)}
    <h3>연관 특허</h3>
    ${relatedHtml}
  </section>`;
}

export function buildReportDocumentTitle(data: PatentAnalysis): string {
  return `PatentLens_${data.number}_${new Date().toISOString().slice(0, 10)}`;
}

function fontFaceCss(origin: string): string {
  const base = `${origin}/fonts`;
  return `
@font-face {
  font-family: "Noto Sans KR";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("${base}/noto-sans-kr-latin-400-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Noto Sans KR";
  font-style: normal;
  font-weight: 700;
  font-display: block;
  src: url("${base}/noto-sans-kr-latin-700-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Noto Sans KR";
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url("${base}/noto-sans-kr-korean-400-normal.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7A3, U+D7B0-D7FF;
}
@font-face {
  font-family: "Noto Sans KR";
  font-style: normal;
  font-weight: 700;
  font-display: block;
  src: url("${base}/noto-sans-kr-korean-700-normal.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7A3, U+D7B0-D7FF;
}`;
}

function buildPrintHtml(data: PatentAnalysis, origin: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${escapeHtml(buildReportDocumentTitle(data))}</title>
<style>
${fontFaceCss(origin)}
${reportStyles()}
</style>
</head>
<body>${reportBody(data)}</body>
</html>`;
}

async function waitUntilFontsReady(doc: Document, timeoutMs = 10_000): Promise<void> {
  const fonts = doc.fonts;
  if (!fonts?.ready) {
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    return;
  }
  try {
    // 본문에 쓰일 글리프를 미리 로드해 PDF에 폰트로 임베드되게 함
    await Promise.all([
      fonts.load('400 12px "Noto Sans KR"'),
      fonts.load('700 12px "Noto Sans KR"'),
    ]);
  } catch {
    // 폰트 로드 실패 시에도 시스템 폰트로 인쇄는 진행
  }
  await Promise.race([
    fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
  await new Promise((resolve) => window.setTimeout(resolve, 250));
}

/**
 * 브라우저 인쇄 엔진으로 보고서를 출력합니다.
 *
 * 중요: 0×0 숨김 iframe에서 print()하면 Chromium이 한글을 폰트가 아닌
 * 벡터 윤곽선으로만 넣어, 저장된 PDF에서 드래그·복사가 안 됩니다.
 * 실제 팝업 창 + 임베드 가능 웹폰트(Noto Sans KR)로 조판해야 텍스트 PDF가 됩니다.
 *
 * 크롬은 document.title을 "PDF로 저장" 기본 파일명으로 사용합니다.
 */
export async function printPatentReport(data: PatentAnalysis): Promise<void> {
  // noopener/noreferrer를 features에 넣으면 브라우저가 항상 null을 반환함.
  // 연 직후 opener만 끊어서 동일 효과를 낸다.
  const printWindow = window.open(
    "",
    "patentlens-print",
    "width=920,height=1100"
  );
  if (!printWindow) {
    throw new Error(
      "인쇄 창이 차단되었습니다. 브라우저에서 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요."
    );
  }
  printWindow.opener = null;

  const doc = printWindow.document;
  doc.open();
  doc.write(buildPrintHtml(data, window.location.origin));
  doc.close();

  const closeSoon = () => {
    window.setTimeout(() => {
      try {
        printWindow.close();
      } catch {
        // ignore
      }
    }, 300);
  };

  try {
    await waitUntilFontsReady(doc);
    printWindow.addEventListener("afterprint", closeSoon, { once: true });
    printWindow.focus();
    printWindow.print();
  } catch (error) {
    try {
      printWindow.close();
    } catch {
      // ignore
    }
    throw error;
  }

  // afterprint 미지원 환경: 사용자가 창을 직접 닫을 수 있도록 남겨 둠
  window.setTimeout(closeSoon, 120_000);
}
