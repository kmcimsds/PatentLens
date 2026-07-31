"use client";

import { KeyRound, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearUserApiKeys,
  hasCompleteUserApiKeys,
  loadUserApiKeys,
  saveUserApiKeys,
  type UserApiKeys,
} from "@/lib/user-api-keys";
import { cn } from "@/lib/utils";

type ApiKeySettingsProps = {
  onKeysChange?: (keys: UserApiKeys) => void;
};

export function ApiKeySettings({ onKeysChange }: ApiKeySettingsProps) {
  const [open, setOpen] = useState(false);
  const [keys, setKeys] = useState<UserApiKeys>({
    serpApiKey: "",
    geminiApiKey: "",
  });
  const [draft, setDraft] = useState<UserApiKeys>({
    serpApiKey: "",
    geminiApiKey: "",
  });
  const configured = hasCompleteUserApiKeys(keys);

  useEffect(() => {
    const stored = loadUserApiKeys();
    setKeys(stored);
    setDraft(stored);
    onKeysChange?.(stored);
  }, [onKeysChange]);

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      const stored = loadUserApiKeys();
      setDraft(stored);
    }
    setOpen(nextOpen);
  };

  const handleSave = () => {
    const next = {
      serpApiKey: draft.serpApiKey.trim(),
      geminiApiKey: draft.geminiApiKey.trim(),
    };
    saveUserApiKeys(next);
    setKeys(next);
    onKeysChange?.(next);
    setOpen(false);
  };

  const handleClear = () => {
    clearUserApiKeys();
    const empty = { serpApiKey: "", geminiApiKey: "" };
    setKeys(empty);
    setDraft(empty);
    onKeysChange?.(empty);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleOpen(true)}
        className="h-10 gap-2 rounded-full border-border/80 bg-card/80 px-3 backdrop-blur-sm"
        aria-label="API 키 설정"
        title="API 키 설정"
      >
        <Settings2 className="h-4 w-4" />
        <span className="hidden sm:inline">API 키 설정</span>
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            configured ? "bg-emerald-500" : "bg-amber-500"
          )}
          aria-hidden
        />
      </Button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              API 키 설정
            </DialogTitle>
            <DialogDescription>
              본인 SerpApi / Gemini 키를 입력하면 서버 기본 키 한도를 쓰지 않고
              검색할 수 있습니다. 키는 이 브라우저에만 저장됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="serp-api-key">SerpApi Key</Label>
              <Input
                id="serp-api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="SerpApi에서 발급받은 키"
                value={draft.serpApiKey}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, serpApiKey: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                발급:{" "}
                <a
                  href="https://serpapi.com/manage-api-key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  serpapi.com/manage-api-key
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini API Key</Label>
              <Input
                id="gemini-api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder="Google AI Studio에서 발급받은 키"
                value={draft.geminiApiKey}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    geminiApiKey: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                발급:{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={handleClear}>
              저장 삭제
            </Button>
            <Button type="button" onClick={handleSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
