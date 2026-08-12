import type PptxGenJS from "pptxgenjs";

import type { PatentAnalysis } from "@/lib/patent-types";

/** 16:9 와이드스크린 슬라이드 크기(inch) */
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

const MARGIN_X = 0.55;
const CONTENT_W = SLIDE_W - MARGIN_X * 2;
const CONTENT_TOP = 1.2;
const CONTENT_BOTTOM = 6.85;

const FONT = "맑은 고딕";
const MONO = "Consolas";

const COLOR = {
  ink: "0F172A",
  heading: "1E3A8A",
  accent: "2563EB",
  muted: "475569",
  border: "CBD5E1",
  box: "EFF4FB",
  boxAlt: "F1F5F9",
  white: "FFFFFF",
  coverBg: "0F203F",
  coverSub: "A8C0E8",
} as const;

const CONFIDENCE_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "신뢰도 높음",
  medium: "신뢰도 중간",
  low: "신뢰도 낮음",
};

/**
 * 글자 크기를 줄여 가며 맞출 때의 감소 폭과 하한.
 * 본문을 중간에 잘라내는 대신 크기를 낮춰 전체 문장을 보여 준다.
 */
const FONT_STEP = 0.5;

/** 줄바꿈 계산에 쓰는 줄 높이 배수. 실제 렌더링보다 여유를 두어 넘침을 막는다. */
const LINE_HEIGHT = 1.35;

/**
 * 주어진 폭에 한 줄로 들어가는 대략적인 글자 수.
 * 한글은 거의 전각이라 폭 비율을 보수적으로 잡는다.
 */
function charsPerLine(widthIn: number, fontSize: number): number {
  return Math.max(6, Math.floor((widthIn * 72) / (fontSize * 0.95)));
}

/** 주어진 높이에 들어가는 줄 수 */
function maxLines(heightIn: number, fontSize: number): number {
  return Math.max(1, Math.floor((heightIn * 72) / (fontSize * LINE_HEIGHT)));
}

function linesFor(texts: string[], widthIn: number, fontSize: number): number {
  const perLine = charsPerLine(widthIn, fontSize);
  return texts.reduce(
    (total, text) => total + Math.max(1, Math.ceil(text.length / perLine)),
    0
  );
}

function normalize(text: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** 최소 크기에서도 넘칠 때만 쓰는 마지막 수단 */
function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

/**
 * 문단이 상자 안에 다 들어가도록 글자 크기를 낮춘다.
 * 하한 크기에서도 넘치는 극단적인 경우에만 잘라 낸다.
 */
function fitParagraph(
  rawText: string,
  widthIn: number,
  heightIn: number,
  baseSize: number,
  minSize: number
): { text: string; fontSize: number } {
  const text = normalize(rawText) || "원문에서 확인되지 않음";

  let fontSize = baseSize;
  while (
    fontSize > minSize &&
    linesFor([text], widthIn, fontSize) > maxLines(heightIn, fontSize)
  ) {
    fontSize -= FONT_STEP;
  }

  const capacity =
    charsPerLine(widthIn, fontSize) * maxLines(heightIn, fontSize);
  return { text: clamp(text, capacity), fontSize };
}

/**
 * 목록이 상자 안에 다 들어가도록 글자 크기를 낮춘다.
 * 하한 크기에서도 넘치면 문장을 자르지 않고 뒤쪽 항목을 통째로 덜어 낸다.
 */
function fitList(
  rawItems: string[],
  widthIn: number,
  heightIn: number,
  baseSize: number,
  minSize: number
): { items: string[]; fontSize: number; dropped: number } {
  const items = rawItems.map(normalize).filter(Boolean);
  if (!items.length) return { items, fontSize: baseSize, dropped: 0 };

  let fontSize = baseSize;
  while (
    fontSize > minSize &&
    linesFor(items, widthIn, fontSize) > maxLines(heightIn, fontSize)
  ) {
    fontSize -= FONT_STEP;
  }

  const limit = maxLines(heightIn, fontSize);
  const kept: string[] = [];
  let used = 0;
  for (const item of items) {
    const needed = linesFor([item], widthIn, fontSize);
    if (used + needed > limit) break;
    kept.push(item);
    used += needed;
  }

  return {
    items: kept.length ? kept : [items[0]],
    fontSize,
    dropped: items.length - (kept.length || 1),
  };
}

function fileNameFor(data: PatentAnalysis): string {
  const safeNumber = (data.number || "patent").replace(/[\\/:*?"<>|]/g, "-");
  return `PatentLens_${safeNumber}_분석보고서.pptx`;
}

function analyzedAt(): string {
  return new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 슬라이드 상단 제목 + 강조선 */
function addHeader(slide: PptxGenJS.Slide, index: string, title: string) {
  slide.addText(index, {
    x: MARGIN_X,
    y: 0.34,
    w: 1.1,
    h: 0.42,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: COLOR.accent,
    valign: "middle",
  });
  slide.addText(title, {
    x: MARGIN_X + 1.0,
    y: 0.3,
    w: CONTENT_W - 1.0,
    h: 0.5,
    fontFace: FONT,
    fontSize: 22,
    bold: true,
    color: COLOR.heading,
    valign: "middle",
    fit: "shrink",
  });
  slide.addShape("line", {
    x: MARGIN_X,
    y: 0.92,
    w: CONTENT_W,
    h: 0,
    line: { color: COLOR.accent, width: 1.75 },
  });
}

function addFooter(slide: PptxGenJS.Slide, data: PatentAnalysis, page: number) {
  slide.addText(`PatentLens · ${data.number}`, {
    x: MARGIN_X,
    y: 6.95,
    w: CONTENT_W - 1,
    h: 0.3,
    fontFace: FONT,
    fontSize: 9,
    color: COLOR.muted,
    valign: "middle",
  });
  slide.addText(`${page} / 4`, {
    x: SLIDE_W - MARGIN_X - 1,
    y: 6.95,
    w: 1,
    h: 0.3,
    fontFace: FONT,
    fontSize: 9,
    color: COLOR.muted,
    align: "right",
    valign: "middle",
  });
}

type BoxArgs = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill?: string;
};

/** 라벨이 붙은 연한 배경 박스를 그리고, 본문이 들어갈 영역을 돌려준다. */
function addLabeledBox(
  slide: PptxGenJS.Slide,
  { x, y, w, h, label, fill = COLOR.box }: BoxArgs
) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: COLOR.border, width: 0.75 },
    rectRadius: 0.05,
  });
  slide.addText(label, {
    x: x + 0.18,
    y: y + 0.1,
    w: w - 0.36,
    h: 0.28,
    fontFace: FONT,
    fontSize: 10,
    bold: true,
    color: COLOR.accent,
    valign: "middle",
  });
  return {
    x: x + 0.18,
    y: y + 0.42,
    w: w - 0.36,
    h: h - 0.58,
  };
}

/** 상자 안에 문단을 자동 크기로 채운다. */
function addFittedParagraph(
  slide: PptxGenJS.Slide,
  box: { x: number; y: number; w: number; h: number },
  text: string,
  baseSize: number,
  minSize: number,
  color: string = COLOR.ink
) {
  const fitted = fitParagraph(text, box.w, box.h, baseSize, minSize);
  slide.addText(fitted.text, {
    ...box,
    fontFace: FONT,
    fontSize: fitted.fontSize,
    color,
    lineSpacingMultiple: 1.2,
    valign: "top",
    fit: "shrink",
  });
}

function buildCoverSlide(pptx: PptxGenJS, data: PatentAnalysis) {
  const slide = pptx.addSlide();
  slide.background = { color: COLOR.coverBg };

  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.22,
    h: SLIDE_H,
    fill: { color: COLOR.accent },
    line: { color: COLOR.accent, width: 0 },
  });

  slide.addText("PATENTLENS · 특허 기술 분석 보고서", {
    x: 0.9,
    y: 1.0,
    w: SLIDE_W - 1.8,
    h: 0.4,
    fontFace: FONT,
    fontSize: 13,
    bold: true,
    color: COLOR.coverSub,
    charSpacing: 2,
  });

  const titleBox = { x: 0.9, y: 1.55, w: SLIDE_W - 1.8, h: 1.9 };
  const title = fitParagraph(data.titleKo, titleBox.w, titleBox.h, 32, 16);
  slide.addText(title.text, {
    ...titleBox,
    fontFace: FONT,
    fontSize: title.fontSize,
    bold: true,
    color: COLOR.white,
    lineSpacingMultiple: 1.15,
    valign: "top",
    fit: "shrink",
  });

  const originalBox = { x: 0.9, y: 3.5, w: SLIDE_W - 1.8, h: 0.65 };
  const original = fitParagraph(data.title, originalBox.w, originalBox.h, 12, 8);
  slide.addText(original.text, {
    ...originalBox,
    fontFace: FONT,
    fontSize: original.fontSize,
    color: COLOR.coverSub,
    lineSpacingMultiple: 1.2,
    valign: "top",
    fit: "shrink",
  });

  const meta: { label: string; value: string }[] = [
    { label: "특허번호", value: data.number },
    { label: "출원인", value: data.assignee },
    { label: "법적 상태", value: data.statusLabel },
    { label: "공개일", value: data.publicationDate || "정보 없음" },
  ];

  const cardW = (SLIDE_W - 1.8 - 0.3 * 3) / 4;
  meta.forEach((item, index) => {
    const x = 0.9 + index * (cardW + 0.3);
    slide.addShape("roundRect", {
      x,
      y: 4.45,
      w: cardW,
      h: 1.05,
      fill: { color: "1B3560" },
      line: { color: "2F4E82", width: 0.75 },
      rectRadius: 0.05,
    });
    slide.addText(item.label, {
      x: x + 0.16,
      y: 4.56,
      w: cardW - 0.32,
      h: 0.28,
      fontFace: FONT,
      fontSize: 9,
      color: COLOR.coverSub,
      valign: "middle",
    });
    const valueBox = { x: x + 0.16, y: 4.85, w: cardW - 0.32, h: 0.55 };
    const value = fitParagraph(item.value, valueBox.w, valueBox.h, 13, 8);
    slide.addText(value.text, {
      ...valueBox,
      fontFace: index === 0 ? MONO : FONT,
      fontSize: value.fontSize,
      bold: true,
      color: COLOR.white,
      valign: "middle",
      fit: "shrink",
    });
  });

  slide.addText(`분석 일시 · ${analyzedAt()}`, {
    x: 0.9,
    y: 6.15,
    w: SLIDE_W - 1.8,
    h: 0.35,
    fontFace: FONT,
    fontSize: 11,
    color: COLOR.coverSub,
  });
}

function addPriorArtTable(
  slide: PptxGenJS.Slide,
  rows: PatentAnalysis["priorArt"],
  top: number,
  height: number
) {
  const colW = [2.6, 4.8, CONTENT_W - 2.6 - 4.8];
  const headerH = 0.34;
  /** 셀 상하 여백(margin 6pt) */
  const cellPad = 0.18;
  const minSize = 7;

  let fontSize = 10;
  let rowHeights: number[] = [];

  for (;;) {
    rowHeights = rows.map((item) => {
      const cells = [item.reference, item.approach, item.limitation];
      const lines = Math.max(
        ...cells.map((cell, index) =>
          linesFor([normalize(cell)], colW[index] - 0.2, fontSize)
        )
      );
      return (lines * fontSize * LINE_HEIGHT) / 72 + cellPad;
    });

    const total = rowHeights.reduce((sum, h) => sum + h, headerH);
    if (total <= height || fontSize <= minSize) break;
    fontSize -= FONT_STEP;
  }

  slide.addTable(
    [
      ["선행 특허 번호", "시도한 기술 내용", "기존 기술의 한계 및 문제점"].map(
        (text) => ({
          text,
          options: {
            bold: true,
            color: COLOR.white,
            fill: { color: COLOR.heading },
            fontSize: Math.min(10, fontSize + 0.5),
          },
        })
      ),
      ...rows.map((item) => [
        {
          text: normalize(item.reference),
          options: { fontFace: MONO, bold: true, color: COLOR.heading },
        },
        { text: normalize(item.approach) },
        {
          text: normalize(item.limitation),
          options: { color: COLOR.muted },
        },
      ]),
    ],
    {
      x: MARGIN_X,
      y: top,
      w: CONTENT_W,
      colW,
      rowH: [headerH, ...rowHeights],
      fontFace: FONT,
      fontSize,
      color: COLOR.ink,
      valign: "top",
      border: { type: "solid", color: COLOR.border, pt: 0.75 },
      margin: 6,
      autoPage: false,
    }
  );
}

function buildOverviewSlide(pptx: PptxGenJS, data: PatentAnalysis) {
  const slide = pptx.addSlide();
  addHeader(slide, "02", "기술 개요 및 선행 기술");

  const overviewBox = addLabeledBox(slide, {
    x: MARGIN_X,
    y: CONTENT_TOP,
    w: CONTENT_W,
    h: 1.3,
    label: "기술 개요",
  });
  addFittedParagraph(slide, overviewBox, data.technicalOverview, 11, 8);

  const halfW = (CONTENT_W - 0.3) / 2;
  const pairs: { label: string; text: string; x: number }[] = [
    { label: "해결하려는 과제", text: data.problem, x: MARGIN_X },
    { label: "발명의 핵심", text: data.solution, x: MARGIN_X + halfW + 0.3 },
  ];

  pairs.forEach((pair) => {
    const box = addLabeledBox(slide, {
      x: pair.x,
      y: 2.67,
      w: halfW,
      h: 1.45,
      label: pair.label,
      fill: COLOR.boxAlt,
    });
    addFittedParagraph(slide, box, pair.text, 10.5, 7.5);
  });

  slide.addText("선행 기술 및 한계점 비교", {
    x: MARGIN_X,
    y: 4.24,
    w: CONTENT_W,
    h: 0.32,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: COLOR.heading,
    valign: "middle",
  });

  const tableTop = 4.62;
  const tableH = CONTENT_BOTTOM - tableTop;
  const maxRows = 4;
  const rows = data.priorArt.slice(0, maxRows);

  if (rows.length) {
    const hasMore = data.priorArt.length > maxRows;
    const noteH = hasMore ? 0.26 : 0;
    addPriorArtTable(slide, rows, tableTop, tableH - noteH);

    if (hasMore) {
      slide.addText(
        `외 ${data.priorArt.length - maxRows}건은 웹 보고서에서 확인할 수 있습니다.`,
        {
          x: MARGIN_X,
          y: CONTENT_BOTTOM - noteH,
          w: CONTENT_W,
          h: noteH,
          fontFace: FONT,
          fontSize: 8.5,
          color: COLOR.muted,
          align: "right",
        }
      );
    }
  } else {
    const box = addLabeledBox(slide, {
      x: MARGIN_X,
      y: tableTop,
      w: CONTENT_W,
      h: tableH,
      label: "선행 기술",
      fill: COLOR.boxAlt,
    });
    slide.addText("원문 배경기술에서 비교 가능한 선행 기술이 확인되지 않았습니다.", {
      ...box,
      fontFace: FONT,
      fontSize: 11,
      color: COLOR.muted,
      align: "center",
      valign: "middle",
    });
  }

  addFooter(slide, data, 2);
}

function buildMethodsSlide(pptx: PptxGenJS, data: PatentAnalysis) {
  const slide = pptx.addSlide();
  addHeader(slide, "03", "핵심 실험 방법 및 AI 추정 조건");

  const halfW = (CONTENT_W - 0.35) / 2;
  const panelH = CONTENT_BOTTOM - CONTENT_TOP;

  const methodBox = addLabeledBox(slide, {
    x: MARGIN_X,
    y: CONTENT_TOP,
    w: halfW,
    h: panelH,
    label: "주요 공정 순서",
  });

  const entries: { text: string; heading: boolean }[] = [];
  for (const method of data.methods) {
    entries.push({ text: normalize(method.title), heading: true });
    for (const step of method.steps) {
      entries.push({ text: normalize(step), heading: false });
    }
  }

  if (entries.length) {
    // 글머리 기호 들여쓰기만큼 본문 폭이 줄어든다.
    const textW = methodBox.w - 0.28;
    const fitted = fitList(
      entries.map((entry) => entry.text),
      textW,
      methodBox.h,
      10.5,
      7.5
    );

    const shown = entries.slice(0, fitted.items.length);
    const dropped = entries.length - shown.length;
    const lines: PptxGenJS.TextProps[] = shown.map((entry) => ({
      text: entry.text,
      options: {
        bold: entry.heading,
        color: entry.heading ? COLOR.heading : COLOR.ink,
        bullet: entry.heading ? false : { characterCode: "2022" },
        indentLevel: entry.heading ? 0 : 1,
        breakLine: true,
      },
    }));

    if (dropped > 0) {
      lines.push({
        text: `외 ${dropped}개 단계는 웹·PDF 보고서 참조`,
        options: {
          bold: false,
          color: COLOR.muted,
          bullet: false,
          indentLevel: 0,
          breakLine: true,
        },
      });
    }

    slide.addText(lines, {
      ...methodBox,
      fontFace: FONT,
      fontSize: fitted.fontSize,
      color: COLOR.ink,
      lineSpacingMultiple: 1.18,
      valign: "top",
      fit: "shrink",
    });
  } else {
    slide.addText("원문에서 공정 단계가 확인되지 않았습니다.", {
      ...methodBox,
      fontFace: FONT,
      fontSize: 10.5,
      color: COLOR.muted,
    });
  }

  const rightX = MARGIN_X + halfW + 0.35;
  slide.addText("AI 추정 실험 조건", {
    x: rightX,
    y: CONTENT_TOP,
    w: halfW,
    h: 0.3,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: COLOR.accent,
    valign: "middle",
  });
  slide.addText("특허에 생략·모호하게 기재된 조건을 문맥으로 추정한 값입니다.", {
    x: rightX,
    y: CONTENT_TOP + 0.28,
    w: halfW,
    h: 0.26,
    fontFace: FONT,
    fontSize: 8.5,
    color: COLOR.muted,
    valign: "middle",
  });

  const cardsTop = CONTENT_TOP + 0.62;
  const cards = data.estimatedConditions.slice(0, 4);
  const gap = 0.14;
  const cardH = cards.length
    ? (CONTENT_BOTTOM - cardsTop - gap * (cards.length - 1)) / cards.length
    : 0;

  cards.forEach((item, index) => {
    const y = cardsTop + index * (cardH + gap);
    slide.addShape("roundRect", {
      x: rightX,
      y,
      w: halfW,
      h: cardH,
      fill: { color: COLOR.box },
      line: { color: COLOR.border, width: 0.75 },
      rectRadius: 0.05,
    });

    const labelW = halfW - 1.5;
    const label = fitParagraph(item.parameter, labelW, 0.28, 10.5, 8);
    slide.addText(label.text, {
      x: rightX + 0.18,
      y: y + 0.09,
      w: labelW,
      h: 0.28,
      fontFace: FONT,
      fontSize: label.fontSize,
      bold: true,
      color: COLOR.heading,
      valign: "middle",
      fit: "shrink",
    });
    slide.addText(CONFIDENCE_LABEL[item.confidence], {
      x: rightX + halfW - 1.4,
      y: y + 0.09,
      w: 1.22,
      h: 0.28,
      fontFace: FONT,
      fontSize: 8.5,
      color: COLOR.accent,
      align: "right",
      valign: "middle",
    });

    const valueW = halfW - 0.36;
    const value = fitParagraph(item.estimatedValue, valueW, 0.32, 10, 7.5);
    slide.addText(value.text, {
      x: rightX + 0.18,
      y: y + 0.38,
      w: valueW,
      h: 0.32,
      fontFace: MONO,
      fontSize: value.fontSize,
      bold: true,
      color: COLOR.ink,
      valign: "middle",
      fit: "shrink",
    });

    const rationaleH = cardH - 0.8;
    if (rationaleH > 0.2) {
      addFittedParagraph(
        slide,
        { x: rightX + 0.18, y: y + 0.72, w: valueW, h: rationaleH },
        item.rationale,
        9,
        7,
        COLOR.muted
      );
    }
  });

  if (!cards.length) {
    slide.addText("추정된 실험 조건이 없습니다.", {
      x: rightX,
      y: cardsTop,
      w: halfW,
      h: 0.6,
      fontFace: FONT,
      fontSize: 10.5,
      color: COLOR.muted,
    });
  }

  addFooter(slide, data, 3);
}

function buildResultsSlide(pptx: PptxGenJS, data: PatentAnalysis) {
  const slide = pptx.addSlide();
  addHeader(slide, "04", "실험 결과 및 주요 효과");

  const summaryBox = addLabeledBox(slide, {
    x: MARGIN_X,
    y: CONTENT_TOP,
    w: CONTENT_W,
    h: 1.25,
    label: "결과 요약",
  });
  addFittedParagraph(slide, summaryBox, data.results.summary, 11, 8);

  const metrics = data.results.quantitative.slice(0, 4);
  const metricsTop = 2.65;
  const metricsH = 1.25;

  if (metrics.length) {
    const gap = 0.25;
    const cardW = (CONTENT_W - gap * (metrics.length - 1)) / metrics.length;
    metrics.forEach((item, index) => {
      const x = MARGIN_X + index * (cardW + gap);
      const innerW = cardW - 0.32;
      slide.addShape("roundRect", {
        x,
        y: metricsTop,
        w: cardW,
        h: metricsH,
        fill: { color: COLOR.boxAlt },
        line: { color: COLOR.border, width: 0.75 },
        rectRadius: 0.05,
      });

      const metric = fitParagraph(item.metric, innerW, 0.3, 9.5, 7.5);
      slide.addText(metric.text, {
        x: x + 0.16,
        y: metricsTop + 0.1,
        w: innerW,
        h: 0.3,
        fontFace: FONT,
        fontSize: metric.fontSize,
        color: COLOR.muted,
        valign: "middle",
        fit: "shrink",
      });

      const value = fitParagraph(item.value, innerW, 0.46, 17, 9);
      slide.addText(value.text, {
        x: x + 0.16,
        y: metricsTop + 0.4,
        w: innerW,
        h: 0.46,
        fontFace: FONT,
        fontSize: value.fontSize,
        bold: true,
        color: COLOR.accent,
        valign: "middle",
        fit: "shrink",
      });

      if (item.note) {
        const note = fitParagraph(item.note, innerW, 0.32, 8.5, 7);
        slide.addText(note.text, {
          x: x + 0.16,
          y: metricsTop + 0.86,
          w: innerW,
          h: 0.32,
          fontFace: FONT,
          fontSize: note.fontSize,
          color: COLOR.muted,
          valign: "top",
          fit: "shrink",
        });
      }
    });
  }

  const highlightsTop = metrics.length ? metricsTop + metricsH + 0.3 : metricsTop;
  const keywordsH = 0.8;
  const highlightsH = CONTENT_BOTTOM - highlightsTop - keywordsH - 0.22;

  const highlightBox = addLabeledBox(slide, {
    x: MARGIN_X,
    y: highlightsTop,
    w: CONTENT_W,
    h: highlightsH,
    label: "주요 하이라이트",
  });

  const highlights = data.results.highlights.slice(0, 6);
  if (highlights.length) {
    const textW = highlightBox.w - 0.28;
    const fitted = fitList(highlights, textW, highlightBox.h, 10.5, 7.5);
    const dropped = highlights.length - fitted.items.length;
    const lines: PptxGenJS.TextProps[] = fitted.items.map((text) => ({
      text,
      options: { bullet: { characterCode: "2022" }, breakLine: true },
    }));

    if (dropped > 0) {
      lines.push({
        text: `외 ${dropped}건은 웹·PDF 보고서 참조`,
        options: { bullet: { characterCode: "2022" }, breakLine: true },
      });
    }

    slide.addText(lines, {
      ...highlightBox,
      fontFace: FONT,
      fontSize: fitted.fontSize,
      color: COLOR.ink,
      lineSpacingMultiple: 1.2,
      valign: "top",
      fit: "shrink",
    });
  } else {
    slide.addText("원문에서 확인된 정성적 효과가 없습니다.", {
      ...highlightBox,
      fontFace: FONT,
      fontSize: 10.5,
      color: COLOR.muted,
    });
  }

  const keywordBox = addLabeledBox(slide, {
    x: MARGIN_X,
    y: CONTENT_BOTTOM - keywordsH,
    w: CONTENT_W,
    h: keywordsH,
    label: "연관 기술 키워드",
    fill: COLOR.boxAlt,
  });
  const keywords = data.relatedKeywords.join("   ·   ") || "키워드 없음";
  const fittedKeywords = fitParagraph(
    keywords,
    keywordBox.w,
    keywordBox.h,
    10.5,
    7.5
  );
  slide.addText(fittedKeywords.text, {
    ...keywordBox,
    fontFace: FONT,
    fontSize: fittedKeywords.fontSize,
    color: COLOR.ink,
    valign: "middle",
    fit: "shrink",
  });

  addFooter(slide, data, 4);
}

/** 분석 결과를 16:9 4장짜리 PPTX 보고서로 내려받는다. (브라우저 전용) */
export async function downloadPatentPptx(data: PatentAnalysis): Promise<void> {
  const { default: PptxGenJSCtor } = await import("pptxgenjs");
  const pptx = new PptxGenJSCtor();

  // 내장 LAYOUT_WIDE(13.3in)보다 파워포인트 기본 와이드스크린 규격에 정확히 맞춘다.
  pptx.defineLayout({ name: "PATENTLENS_WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "PATENTLENS_WIDE";

  pptx.title = `${data.titleKo} 특허 분석 보고서`;
  pptx.subject = data.number;
  pptx.company = "PatentLens";

  buildCoverSlide(pptx, data);
  buildOverviewSlide(pptx, data);
  buildMethodsSlide(pptx, data);
  buildResultsSlide(pptx, data);

  await pptx.writeFile({ fileName: fileNameFor(data) });
}
