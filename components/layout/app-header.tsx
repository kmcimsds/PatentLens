"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { currentUser, equipmentList } from "@/lib/equipment-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "기기 현황 & 예약",
    description: "연구실 분석기기 실시간 현황을 확인하고 예약하세요",
  },
  "/schedule": {
    title: "예약 스케줄",
    description: "기기별 시간대별 예약 현황을 확인하고 새 예약을 등록하세요",
  },
  "/manuals": {
    title: "기기 매뉴얼",
    description: "분석기기 사용 매뉴얼 및 SOP 문서를 확인하세요",
  },
};

function getPageMeta(pathname: string) {
  if (pathname.startsWith("/manuals/")) {
    const equipmentId = pathname.split("/")[2];
    const equipment = equipmentList.find((e) => e.id === equipmentId);
    if (equipment) {
      return {
        title: `${equipment.name} 매뉴얼`,
        description: `${equipment.fullName} · 공식 가이드 및 연구원 위키`,
      };
    }
  }
  return pageMeta[pathname] ?? pageMeta["/"];
}

export function AppHeader() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{meta.title}</h1>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <Separator orientation="vertical" className="h-8" />

        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{currentUser.initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">
              {currentUser.displayName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">로그인됨</p>
          </div>
        </div>
      </div>
    </header>
  );
}
