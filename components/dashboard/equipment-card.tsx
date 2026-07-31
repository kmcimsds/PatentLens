"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarPlus,
  Clock,
  MapPin,
  User,
} from "lucide-react";

import type { Equipment } from "@/lib/equipment-data";
import { formatRemainingMinutes, formatTime } from "@/lib/utils";
import { useReservations } from "@/contexts/reservation-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EquipmentCardProps {
  equipment: Equipment;
}

function getRemainingMinutes(endTime: Date): number {
  return Math.max(0, Math.ceil((endTime.getTime() - Date.now()) / 60000));
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { openCreateModal } = useReservations();
  const [remainingMinutes, setRemainingMinutes] = useState(
    equipment.endTime ? getRemainingMinutes(equipment.endTime) : 0
  );

  useEffect(() => {
    if (equipment.status !== "in_use" || !equipment.endTime) return;

    const tick = () => {
      setRemainingMinutes(getRemainingMinutes(equipment.endTime!));
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [equipment.status, equipment.endTime]);

  const isAvailable = equipment.status === "available";

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{equipment.name}</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {equipment.category}
              </Badge>
            </div>
            <CardDescription className="line-clamp-1">
              {equipment.fullName}
            </CardDescription>
          </div>
          <Badge variant={isAvailable ? "success" : "destructive"}>
            {isAvailable ? "사용 가능" : "사용 중"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{equipment.location}</span>
        </div>

        {!isAvailable && equipment.currentUser && equipment.endTime && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">현재 사용자</span>
              <span className="font-medium">{equipment.currentUser}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">남은 시간</span>
              <span className="font-medium text-destructive">
                {formatRemainingMinutes(remainingMinutes)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">종료 예정</span>
              <span className="font-medium">
                {formatTime(equipment.endTime)}
              </span>
            </div>
          </div>
        )}

        {isAvailable && (
          <div className="rounded-lg border border-dashed border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            지금 바로 예약할 수 있습니다
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-2">
        <Button
          className="flex-1"
          onClick={() => openCreateModal({ equipmentId: equipment.id })}
        >
          <CalendarPlus className="h-4 w-4" />
          예약하기
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href={`/manuals/${equipment.id}`}>
            <BookOpen className="h-4 w-4" />
            매뉴얼 보기
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
