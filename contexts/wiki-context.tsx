"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { currentUser } from "@/lib/equipment-data";
import {
  createInitialManuals,
  type EquipmentManualContent,
  type WikiEditHistory,
} from "@/lib/manual-data";

interface WikiContextValue {
  manuals: Record<string, EquipmentManualContent>;
  getManual: (equipmentId: string) => EquipmentManualContent | undefined;
  updateWikiContent: (
    equipmentId: string,
    content: string,
    summary: string
  ) => void;
}

const WikiContext = createContext<WikiContextValue | null>(null);

export function WikiProvider({ children }: { children: ReactNode }) {
  const [manuals, setManuals] = useState(createInitialManuals);

  const getManual = useCallback(
    (equipmentId: string) => manuals[equipmentId],
    [manuals]
  );

  const updateWikiContent = useCallback(
    (equipmentId: string, content: string, summary: string) => {
      const entry: WikiEditHistory = {
        id: `wh-${Date.now()}`,
        editorName: currentUser.displayName,
        editedAt: new Date().toISOString(),
        summary,
      };

      setManuals((prev) => {
        const manual = prev[equipmentId];
        if (!manual) return prev;

        return {
          ...prev,
          [equipmentId]: {
            ...manual,
            wiki: {
              ...manual.wiki,
              content,
              history: [entry, ...manual.wiki.history],
            },
          },
        };
      });
    },
    []
  );

  const value = useMemo(
    () => ({ manuals, getManual, updateWikiContent }),
    [manuals, getManual, updateWikiContent]
  );

  return (
    <WikiContext.Provider value={value}>{children}</WikiContext.Provider>
  );
}

export function useWiki() {
  const context = useContext(WikiContext);
  if (!context) {
    throw new Error("useWiki must be used within WikiProvider");
  }
  return context;
}
