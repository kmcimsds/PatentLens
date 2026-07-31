"use client";

import { Loader2 } from "lucide-react";

export function AnalysisLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-20 animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold tracking-tight text-foreground">
          연구용 특허 데이터 분석 중...
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          원문 구조화 · 핵심 청구항 추출 · 실험 조건 추정
        </p>
      </div>
    </div>
  );
}
