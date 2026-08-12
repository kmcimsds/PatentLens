"use client";

import { AlertCircle, Loader2, Presentation, Printer, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { AnalysisLoader } from "@/components/patent/analysis-loader";
import { ApiKeySettings } from "@/components/patent/api-key-settings";
import { PatentResultSections } from "@/components/patent/patent-result-sections";
import { PatentSearchBar } from "@/components/patent/patent-search-bar";
import { TableOfContents } from "@/components/patent/table-of-contents";
import { ThemeToggle } from "@/components/patent/theme-toggle";
import { Button } from "@/components/ui/button";
import { downloadPatentPptx } from "@/lib/export-patent-pptx";
import { EXAMPLE_PATENT_NUMBER } from "@/lib/patent-dummy-data";
import { printPatentReport } from "@/lib/print-patent-report";
import type { PatentAnalysis } from "@/lib/patent-types";
import {
  hasCompleteUserApiKeys,
  loadUserApiKeys,
  type UserApiKeys,
} from "@/lib/user-api-keys";
import { cn } from "@/lib/utils";

type ViewState = "idle" | "loading" | "results" | "error";

type AnalyzeResponse = {
  data?: PatentAnalysis;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
};

export function PatentApp() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewState>("idle");
  const [result, setResult] = useState<PatentAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const printingRef = useRef(false);

  const handleKeysChange = useCallback((keys: UserApiKeys) => {
    setApiKeysConfigured(hasCompleteUserApiKeys(keys));
  }, []);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const keys = loadUserApiKeys();
    if (!hasCompleteUserApiKeys(keys)) {
      setResult(null);
      setErrorMessage(
        "API 키를 먼저 설정해 주세요. 상단의 API 키 설정에서 SerpApi Key와 Gemini API Key를 입력하세요."
      );
      setView("error");
      return;
    }

    setView("loading");
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/patents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patentNumber: trimmed,
          serpApiKey: keys.serpApiKey,
          geminiApiKey: keys.geminiApiKey,
        }),
        signal: AbortSignal.timeout(95_000),
      });
      const payload = (await response.json()) as AnalyzeResponse;

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error?.message ||
            "특허 분석에 실패했습니다. 잠시 후 다시 시도해 주세요."
        );
      }

      setResult(payload.data);
      setView("results");
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "TimeoutError"
          ? "분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : error instanceof Error
            ? error.message
            : "특허 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setErrorMessage(message);
      setView("error");
    }
  };

  const fillExample = () => {
    setQuery(EXAMPLE_PATENT_NUMBER);
  };

  const handlePrint = async () => {
    if (!result || printingRef.current) return;
    printingRef.current = true;
    try {
      await printPatentReport(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "인쇄 창을 열지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
      setView("error");
    } finally {
      printingRef.current = false;
    }
  };

  const handlePptxDownload = async () => {
    if (!result || isExportingPptx) return;
    setIsExportingPptx(true);
    try {
      await downloadPatentPptx(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "PPTX 파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
      setView("error");
    } finally {
      setIsExportingPptx(false);
    }
  };

  const isCompact = view !== "idle";

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 atmosphere" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-md transition-colors data-[scrolled=true]:border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              PatentLens
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              글로벌 특허 AI 요약
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ApiKeySettings onKeysChange={handleKeysChange} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "relative mx-auto flex w-full max-w-6xl flex-col px-4 sm:px-6",
          view === "idle"
            ? "min-h-[calc(100vh-3.5rem)] items-center justify-center pb-24 pt-8"
            : "pb-16 pt-6"
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col items-center transition-all duration-500 ease-out",
            view === "idle" ? "-mt-16" : "mb-8 items-stretch"
          )}
        >
          {view === "idle" && (
            <div className="mb-8 text-center animate-fade-in">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                PatentLens
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                특허 번호 하나로 핵심 요약과 숨겨진 실험 조건을 확인하세요.
              </p>
              {!apiKeysConfigured && (
                <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
                  검색 전 상단의 API 키 설정에서 키를 입력해 주세요.
                </p>
              )}
            </div>
          )}

          <div
            className={cn(
              "flex w-full justify-center transition-all duration-500",
              isCompact && "justify-start"
            )}
          >
            <PatentSearchBar
              value={query}
              onChange={setQuery}
              onSubmit={runSearch}
              onExampleClick={fillExample}
              exampleLabel={`${EXAMPLE_PATENT_NUMBER} 입력해보기`}
              compact={isCompact}
              disabled={view === "loading"}
              autoFocus={view === "idle"}
            />
          </div>
        </div>

        {view === "loading" && <AnalysisLoader />}

        {view === "error" && (
          <div
            role="alert"
            className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-rose-500/25 bg-rose-500/5 p-6 text-center animate-fade-in"
          >
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
            <p className="mt-3 font-semibold text-foreground">분석을 완료하지 못했습니다</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {errorMessage}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={runSearch}
              className="mt-5 rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>
        )}

        {view === "results" && result && (
          <div className="grid w-full gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-20 lg:self-start">
              <div className="mb-3 lg:hidden">
                <MobileToc />
              </div>
              <TableOfContents className="hidden lg:block" />
            </aside>
            <article className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  분석 결과 · {result.number}
                </p>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrint}
                      className="rounded-xl"
                    >
                      <Printer className="h-4 w-4" />
                      인쇄 / PDF 저장
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePptxDownload}
                      disabled={isExportingPptx}
                      className="rounded-xl"
                    >
                      {isExportingPptx ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Presentation className="h-4 w-4" />
                      )}
                      {isExportingPptx ? "생성 중…" : "PPTX 다운로드"}
                    </Button>
                  </div>
                  <p className="max-w-xs text-right text-xs leading-relaxed text-muted-foreground">
                    대상은 &lsquo;PDF로 저장&rsquo;을 고르고, &lsquo;이미지로 인쇄&rsquo;는
                    끄세요. (켜면 텍스트 복사가 안 됩니다)
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-background p-1 sm:p-2">
                <PatentResultSections data={result} />
              </div>
            </article>
          </div>
        )}
      </main>
    </div>
  );
}

function MobileToc() {
  return (
    <details className="rounded-2xl border border-border/70 bg-card/70 p-3 backdrop-blur-sm">
      <summary className="cursor-pointer select-none text-sm font-semibold text-foreground">
        목차 펼치기
      </summary>
      <div className="mt-2">
        <TableOfContents className="border-0 bg-transparent p-0" />
      </div>
    </details>
  );
}
