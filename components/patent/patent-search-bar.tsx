"use client";

import { Search } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PatentSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onExampleClick: () => void;
  exampleLabel: string;
  compact?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function PatentSearchBar({
  value,
  onChange,
  onSubmit,
  onExampleClick,
  exampleLabel,
  compact = false,
  disabled = false,
  autoFocus = false,
}: PatentSearchBarProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  };

  return (
    <div className={cn("w-full", compact ? "max-w-3xl" : "max-w-2xl")}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex w-full items-stretch gap-2 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-search backdrop-blur-md transition-shadow focus-within:border-primary/40 focus-within:shadow-search-focus",
          compact ? "p-1.5" : "p-2"
        )}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
              compact ? "h-4 w-4" : "h-5 w-5"
            )}
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="특허 번호 입력 (예: KR20240096026A)"
            disabled={disabled}
            autoFocus={autoFocus}
            spellCheck={false}
            className={cn(
              "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              compact
                ? "h-11 pl-10 text-base"
                : "h-14 pl-11 text-lg tracking-wide"
            )}
            aria-label="특허 번호"
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "shrink-0 rounded-xl px-6 font-semibold",
            compact ? "h-11" : "h-14 px-8 text-base"
          )}
        >
          검색
        </Button>
      </form>

      {!compact && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={onExampleClick}
            disabled={disabled}
            className="rounded-full border border-border/70 bg-secondary/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {exampleLabel}
          </button>
        </div>
      )}
    </div>
  );
}
