"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { equipmentList } from "@/lib/equipment-data";
import { useWiki } from "@/contexts/wiki-context";
import {
  OfficialGuideTab,
  QaTab,
  WikiTab,
} from "@/components/manual/manual-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EquipmentManualPageProps {
  equipmentId: string;
}

export function EquipmentManualPage({ equipmentId }: EquipmentManualPageProps) {
  const { getManual } = useWiki();
  const equipment = equipmentList.find((e) => e.id === equipmentId);
  const manual = getManual(equipmentId);

  if (!equipment || !manual) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
        <p className="text-lg font-semibold">매뉴얼을 찾을 수 없습니다</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/manuals">매뉴얼 목록으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2">
            <Link href="/manuals">
              <ArrowLeft className="h-4 w-4" />
              매뉴얼 목록
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {equipment.name}
            </h2>
            <Badge variant="secondary">{equipment.category}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{equipment.fullName}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {equipment.location}
          </p>
        </div>
      </div>

      <Tabs defaultValue="wiki" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
          <TabsTrigger value="official" className="py-2.5">
            공식 가이드
          </TabsTrigger>
          <TabsTrigger value="wiki" className="py-2.5">
            연구원 노하우 (위키)
          </TabsTrigger>
          <TabsTrigger value="qa" className="py-2.5">
            Q&amp;A / 트러블슈팅
          </TabsTrigger>
        </TabsList>

        <TabsContent value="official">
          <OfficialGuideTab content={manual.officialGuide} />
        </TabsContent>

        <TabsContent value="wiki">
          <WikiTab equipmentId={equipmentId} />
        </TabsContent>

        <TabsContent value="qa">
          <QaTab items={manual.qa} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
