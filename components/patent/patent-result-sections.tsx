"use client";

import {
  Beaker,
  ExternalLink,
  FlaskConical,
  Lightbulb,
  Link2,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LegalStatus, PatentAnalysis } from "@/lib/patent-types";
import { cn } from "@/lib/utils";

function statusVariant(status: LegalStatus) {
  switch (status) {
    case "registered":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "published":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    case "expired":
      return "bg-stone-500/15 text-stone-600 dark:text-stone-300 border-stone-500/30";
    case "pending":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  }
}

function confidenceLabel(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return { text: "신뢰도 높음", className: "text-emerald-600 dark:text-emerald-400" };
    case "medium":
      return { text: "신뢰도 중간", className: "text-amber-600 dark:text-amber-400" };
    case "low":
      return { text: "신뢰도 낮음", className: "text-rose-600 dark:text-rose-400" };
  }
}

function SectionHeading({
  id,
  icon,
  children,
  special,
}: {
  id: string;
  icon: ReactNode;
  children: React.ReactNode;
  special?: boolean;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-28 mb-5 flex items-start gap-3 border-b border-border/80 pb-3"
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          special
            ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
            : "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>
      <h2
        className={cn(
          "font-display text-xl font-semibold tracking-tight md:text-2xl",
          special && "text-teal-800 dark:text-teal-200"
        )}
      >
        {children}
      </h2>
    </div>
  );
}

export function PatentResultSections({ data }: { data: PatentAnalysis }) {
  return (
    <div className="space-y-14 animate-fade-up">
      {/* 1. 기본 정보 */}
      <section aria-labelledby="basic-info-heading">
        <SectionHeading id="basic-info" icon={<FlaskConical className="h-4 w-4" />}>
          <span id="basic-info-heading">1. 기본 정보 및 법적 상태</span>
        </SectionHeading>

        <div className="space-y-5">
          <div>
            <p className="font-mono text-sm font-medium text-primary">{data.number}</p>
            <h3 className="mt-1 font-display text-2xl font-semibold leading-snug tracking-tight md:text-[1.7rem]">
              {data.titleKo}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              원문 제목: {data.title}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold",
                statusVariant(data.status)
              )}
            >
              {data.statusLabel}
            </span>
            {data.ipc.map((code, index) => (
              <Badge
                key={`${code}-${index}`}
                variant="secondary"
                className="font-mono text-xs"
              >
                {code}
              </Badge>
            ))}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="출원인" value={data.assignee} />
            <InfoItem label="발명자" value={data.inventors.join(", ")} />
            <InfoItem label="출원일" value={data.filingDate} />
            <InfoItem label="공개일" value={data.publicationDate} />
            {data.grantDate && <InfoItem label="등록일" value={data.grantDate} />}
          </dl>

          <Button asChild className="rounded-xl">
            <a
              href={data.googlePatentsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Patents 원문 보기
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* 2. 기술 개요 */}
      <section aria-labelledby="overview-heading">
        <SectionHeading id="overview" icon={<Lightbulb className="h-4 w-4" />}>
          <span id="overview-heading">2. 기술 개요 및 목적</span>
        </SectionHeading>

        <div className="space-y-5 text-[0.95rem] leading-7 text-foreground/90">
          <p>{data.technicalOverview}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                해결하려는 과제
              </p>
              <p>{data.problem}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                발명의 핵심
              </p>
              <p>{data.solution}</p>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">
              선행 기술 및 한계점 비교
            </p>
            {data.priorArt.length ? (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="w-[22%] px-4 py-3 font-medium">선행 특허 번호</th>
                      <th className="w-[39%] px-4 py-3 font-medium">시도한 기술 내용</th>
                      <th className="w-[39%] px-4 py-3 font-medium">
                        기존 기술의 한계 및 문제점
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.priorArt.map((item, index) => (
                      <tr
                        key={`${item.reference}-${index}`}
                        className="border-t border-border/60 align-top"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium">
                          {item.reference}
                        </td>
                        <td className="px-4 py-3 leading-6">{item.approach}</td>
                        <td className="px-4 py-3 leading-6 text-muted-foreground">
                          {item.limitation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
                원문 배경기술에서 비교 가능한 선행 기술이 확인되지 않았습니다.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              요약 (Abstract)
            </p>
            <p className="text-muted-foreground">{data.abstract}</p>
          </div>
        </div>
      </section>

      {/* 3. 실험 방법 */}
      <section aria-labelledby="methods-heading">
        <SectionHeading id="methods" icon={<Beaker className="h-4 w-4" />}>
          <span id="methods-heading">3. 핵심 실험 방법 및 구성</span>
        </SectionHeading>

        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">조성물 / 구성 요소</p>
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">명칭</th>
                    <th className="px-4 py-3 font-medium">역할</th>
                    <th className="px-4 py-3 font-medium">개시 범위</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compositions.map((c, index) => (
                    <tr key={`${c.name}-${index}`} className="border-t border-border/60">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.role}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {c.disclosedRange ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.methods.map((method, methodIndex) => (
            <div key={`${method.title}-${methodIndex}`}>
              <p className="mb-2 text-sm font-semibold">{method.title}</p>
              <ol className="list-decimal space-y-2 pl-5 text-[0.95rem] leading-7 text-foreground/90">
                {method.steps.map((step, stepIndex) => (
                  <li key={`${step}-${stepIndex}`}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AI 추정 */}
      <section aria-labelledby="ai-estimate-heading">
        <SectionHeading
          id="ai-estimate"
          icon={<Sparkles className="h-4 w-4" />}
          special
        >
          <span id="ai-estimate-heading">4. AI 추정 실험 조건</span>
        </SectionHeading>

        <div className="mb-4 rounded-2xl border border-teal-500/25 bg-teal-500/5 px-4 py-3 text-sm leading-6 text-teal-900/80 dark:text-teal-100/80">
          특허 문헌에 생략되거나 모호하게 기재된 용매·시약·농도 범위를 문맥과
          유사 기술 패턴으로 추정한 내용입니다. 실제 실험 전 반드시 교차 검증하세요.
        </div>

        <div className="space-y-3">
          {data.estimatedConditions.map((item, index) => {
            const conf = confidenceLabel(item.confidence);
            return (
              <article
                key={`${item.parameter}-${item.estimatedValue}-${index}`}
                className="rounded-2xl border border-teal-500/20 bg-card/80 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{item.parameter}</h4>
                  <span className={cn("text-xs font-medium", conf.className)}>
                    {conf.text}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm text-teal-800 dark:text-teal-200">
                  {item.estimatedValue}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.rationale}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. 결과 */}
      <section aria-labelledby="results-heading">
        <SectionHeading id="results" icon={<Beaker className="h-4 w-4" />}>
          <span id="results-heading">5. 실험 결과 및 효과</span>
        </SectionHeading>

        <p className="mb-5 text-[0.95rem] leading-7 text-foreground/90">
          {data.results.summary}
        </p>

        <ul className="mb-6 space-y-2">
          {data.results.highlights.map((h, index) => (
            <li
              key={`${h}-${index}`}
              className="flex gap-2 text-[0.95rem] leading-7 text-foreground/90"
            >
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {h}
            </li>
          ))}
        </ul>

        <div className="grid gap-3 sm:grid-cols-3">
          {data.results.quantitative.map((q, index) => (
            <div
              key={`${q.metric}-${q.value}-${index}`}
              className="rounded-2xl border border-border/70 bg-muted/35 p-4"
            >
              <p className="text-xs font-medium text-muted-foreground">{q.metric}</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight">
                {q.value}
              </p>
              {q.note && (
                <p className="mt-1 text-xs text-muted-foreground">{q.note}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. 연관 특허 */}
      <section aria-labelledby="related-heading" className="pb-8">
        <SectionHeading id="related" icon={<Link2 className="h-4 w-4" />}>
          <span id="related-heading">6. 연관 추천 특허</span>
        </SectionHeading>

        {data.relatedKeywords.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              추천 검색 키워드 / 기술 분야
            </p>
            <div className="flex flex-wrap gap-2">
              {data.relatedKeywords.map((keyword, index) => (
                <Badge key={`${keyword}-${index}`} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {data.relatedPatents.map((p, index) => (
            <a
              key={`${p.number}-${index}`}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/35 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs font-medium text-primary">
                      {p.number}
                    </p>
                    {p.publicationDate && (
                      <Badge variant="secondary" className="font-normal">
                        {p.publicationDate.slice(0, 4)}년 공개
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 font-medium leading-snug group-hover:text-primary">
                    {p.titleKo || p.title}
                  </p>
                  {p.titleKo && p.titleKo !== p.title && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      원문: {p.title}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">{p.assignee}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {p.relevance}
                  </p>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </a>
          ))}
          {data.relatedPatents.length === 0 && (
            <p className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              Google Patents 응답에서 연관 특허를 확인할 수 없습니다. 위 추천 키워드로
              선행기술을 검색해 보세요.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium leading-relaxed">{value}</dd>
    </div>
  );
}
