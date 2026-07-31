"use client";

import { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DateSelectArg,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import koLocale from "@fullcalendar/core/locales/ko";

import { equipmentList } from "@/lib/equipment-data";
import { equipmentColors } from "@/lib/reservation-types";
import { useReservations } from "@/contexts/reservation-context";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function EquipmentScheduler() {
  const calendarRef = useRef<FullCalendar>(null);
  const { reservations, openCreateModal, openDetailModal } = useReservations();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("all");
  const [viewType, setViewType] = useState<"timeGridDay" | "timeGridWeek">(
    "timeGridWeek"
  );

  const filteredReservations = useMemo(() => {
    if (selectedEquipmentId === "all") return reservations;
    return reservations.filter((r) => r.equipmentId === selectedEquipmentId);
  }, [reservations, selectedEquipmentId]);

  const events: EventInput[] = useMemo(
    () =>
      filteredReservations.map((reservation) => {
        const equipment = equipmentList.find(
          (e) => e.id === reservation.equipmentId
        );
        const color = equipmentColors[reservation.equipmentId] ?? "#2563eb";

        return {
          id: reservation.id,
          title: `${equipment?.name} · ${reservation.reservatorName}`,
          start: reservation.startTime,
          end: reservation.endTime,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { reservation },
        };
      }),
    [filteredReservations]
  );

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const equipmentId =
      selectedEquipmentId === "all"
        ? equipmentList[0].id
        : selectedEquipmentId;

    openCreateModal({
      equipmentId,
      startTime: selectInfo.start,
      endTime: selectInfo.end,
      allowEquipmentSelect: selectedEquipmentId === "all",
    });
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    openDetailModal(clickInfo.event.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={selectedEquipmentId === "all"}
            onClick={() => setSelectedEquipmentId("all")}
          >
            전체 기기
          </FilterButton>
          {equipmentList.map((equipment) => (
            <FilterButton
              key={equipment.id}
              active={selectedEquipmentId === equipment.id}
              onClick={() => setSelectedEquipmentId(equipment.id)}
              color={equipmentColors[equipment.id]}
            >
              {equipment.name}
            </FilterButton>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewType === "timeGridDay" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewType("timeGridDay");
              calendarRef.current?.getApi().changeView("timeGridDay");
            }}
          >
            오늘
          </Button>
          <Button
            variant={viewType === "timeGridWeek" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewType("timeGridWeek");
              calendarRef.current?.getApi().changeView("timeGridWeek");
            }}
          >
            이번 주
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {equipmentList.map((equipment) => (
          <div key={equipment.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: equipmentColors[equipment.id] }}
            />
            <span className="text-muted-foreground">{equipment.name}</span>
          </div>
        ))}
        <Badge variant="outline" className="ml-auto">
          빈 시간대를 드래그하여 예약
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewType}
          locale={koLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          selectable
          selectMirror
          dayMaxEvents
          weekends
          height="auto"
          contentHeight={640}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          slotDuration="00:30:00"
          snapDuration="00:30:00"
          nowIndicator
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: "09:00",
            endTime: "18:00",
          }}
        />
      </div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
  color,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {color && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );
}
