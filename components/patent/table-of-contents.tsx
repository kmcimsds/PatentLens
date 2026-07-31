"use client";

import { useEffect, useState } from "react";

import { TOC_SECTIONS } from "@/lib/patent-types";
import { cn } from "@/lib/utils";

type TableOfContentsProps = {
  className?: string;
};

export function TableOfContents({ className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(TOC_SECTIONS[0].id);

  useEffect(() => {
    const elements = TOC_SECTIONS.map((s) =>
      document.getElementById(s.id)
    ).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav
      aria-label="목차"
      className={cn(
        "rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur-sm",
        className
      )}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        목차
      </p>
      <ul className="space-y-1">
        {TOC_SECTIONS.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {section.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
