"use client";

import { useState } from "react";
import { Lock, Pencil, Save, X } from "lucide-react";

import { useWiki } from "@/contexts/wiki-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditHistoryList } from "@/components/manual/edit-history-list";
import { MarkdownViewer } from "@/components/manual/markdown-viewer";

interface OfficialGuideTabProps {
  content: string;
}

export function OfficialGuideTab({ content }: OfficialGuideTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Lock className="h-3 w-3" />
          관리자 작성 · 수정 불가
        </Badge>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <MarkdownViewer content={content} />
      </div>
    </div>
  );
}

interface WikiTabProps {
  equipmentId: string;
}

export function WikiTab({ equipmentId }: WikiTabProps) {
  const { getManual, updateWikiContent } = useWiki();
  const manual = getManual(equipmentId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState("");

  if (!manual) return null;

  const startEditing = () => {
    setDraft(manual.wiki.content);
    setSummary("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft("");
    setSummary("");
  };

  const saveEditing = () => {
    if (!summary.trim()) return;
    updateWikiContent(equipmentId, draft, summary.trim());
    setIsEditing(false);
    setSummary("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Badge variant="outline" className="text-primary">
          누구나 편집 가능 · 나무위키 스타일
        </Badge>
        {!isEditing ? (
          <Button size="sm" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
            편집
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing}>
              <X className="h-4 w-4" />
              취소
            </Button>
            <Button size="sm" onClick={saveEditing} disabled={!summary.trim()}>
              <Save className="h-4 w-4" />
              저장
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="edit-summary">수정 요약</Label>
            <Input
              id="edit-summary"
              placeholder="예: HPLC 컬럼 세척 팁 추가"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              수정 요약은 하단 &quot;최근 수정 이력&quot;에 기록됩니다.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wiki-editor">마크다운 본문</Label>
            <Textarea
              id="wiki-editor"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[360px] font-mono text-sm leading-relaxed"
              placeholder="# 제목&#10;&#10;**볼드** 텍스트, 표, 목록 등 마크다운 문법을 사용할 수 있습니다."
            />
            <p className="text-xs text-muted-foreground">
              지원: **볼드**, *이탤릭*, 표(GFM), 목록, 인용문, 코드 블록
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-6">
          <MarkdownViewer content={manual.wiki.content} />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">최근 수정 이력</h3>
        <EditHistoryList history={manual.wiki.history} />
      </div>
    </div>
  );
}

interface QaTabProps {
  items: { id: string; question: string; answer: string }[];
}

export function QaTab({ items }: QaTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        자주 묻는 질문 및 에러 대처법입니다. 새 Q&A 추가 기능은 추후
        업데이트 예정입니다.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="group rounded-xl border bg-card open:shadow-sm"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-medium marker:content-none">
              <span className="flex items-start justify-between gap-3">
                <span>Q. {item.question}</span>
                <span className="shrink-0 text-xs text-muted-foreground group-open:hidden">
                  펼치기
                </span>
              </span>
            </summary>
            <div className="border-t px-5 py-4 text-sm text-muted-foreground">
              <MarkdownViewer content={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
