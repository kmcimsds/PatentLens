import { Clock, User } from "lucide-react";

import { formatEditDate, type WikiEditHistory } from "@/lib/manual-data";

interface EditHistoryListProps {
  history: WikiEditHistory[];
}

export function EditHistoryList({ history }: EditHistoryListProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">아직 수정 이력이 없습니다.</p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {history.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium">{entry.editorName}</span>
              <span className="text-muted-foreground">이 </span>
              <span>{entry.summary}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {entry.editorName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatEditDate(entry.editedAt)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
