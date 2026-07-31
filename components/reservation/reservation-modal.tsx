"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { equipmentList } from "@/lib/equipment-data";
import {
  formatReservationDateTime,
  reservationFormSchema,
  toDatetimeLocalValue,
  type ReservationFormValues,
} from "@/lib/reservation-form-schema";
import {
  purposeOptions,
  sampleTypeOptions,
  type Reservation,
} from "@/lib/reservation-types";
import { useReservations } from "@/contexts/reservation-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getDefaultTimes(defaultStart?: Date, defaultEnd?: Date) {
  const start = defaultStart ?? new Date();
  if (!defaultStart) {
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
  }
  const end = defaultEnd ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    startTime: toDatetimeLocalValue(start),
    endTime: toDatetimeLocalValue(end),
  };
}

function ReservationFormFields({
  equipmentId,
  allowEquipmentSelect,
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  equipmentId: string;
  allowEquipmentSelect?: boolean;
  defaultValues: Partial<ReservationFormValues>;
  onSubmit: (values: ReservationFormValues, equipmentId: string) => void;
  submitLabel: string;
}) {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(equipmentId);
  const equipment = equipmentList.find((e) => e.id === selectedEquipmentId);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      reservatorName: defaultValues.reservatorName ?? "",
      purpose: defaultValues.purpose ?? "정량 분석",
      startTime: defaultValues.startTime ?? "",
      endTime: defaultValues.endTime ?? "",
      sampleType: defaultValues.sampleType ?? "유기화합물",
      sampleCount: defaultValues.sampleCount ?? 1,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit(values, selectedEquipmentId)
        )}
        className="space-y-4"
      >
        {allowEquipmentSelect ? (
          <div className="space-y-2">
            <FormLabel>예약 기기</FormLabel>
            <Select
              value={selectedEquipmentId}
              onValueChange={setSelectedEquipmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="기기 선택" />
              </SelectTrigger>
              <SelectContent>
                {equipmentList.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          equipment && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">예약 기기</p>
              <p className="font-semibold">{equipment.name}</p>
              <p className="text-xs text-muted-foreground">
                {equipment.location}
              </p>
            </div>
          )
        )}

        <FormField
          control={form.control}
          name="reservatorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>예약자 이름</FormLabel>
              <FormControl>
                <Input placeholder="예: 홍길동 연구원" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>사용 목적</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="목적 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {purposeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작 시간</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료 시간</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sampleType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>샘플 종류</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="샘플 종류 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sampleTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sampleCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>샘플 개수</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function ReservationDetailView({
  reservation,
  onEdit,
  onCancel,
  onClose,
}: {
  reservation: Reservation;
  onEdit: () => void;
  onCancel: () => void;
  onClose: () => void;
}) {
  const { isOwner } = useReservations();
  const equipment = equipmentList.find((e) => e.id === reservation.equipmentId);
  const owned = isOwner(reservation);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">예약 기기</p>
          <p className="text-lg font-semibold">{equipment?.name}</p>
        </div>
        <Badge variant={owned ? "default" : "secondary"}>
          {owned ? "내 예약" : "타인 예약"}
        </Badge>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
        <DetailRow label="예약자" value={reservation.reservatorName} />
        <DetailRow label="사용 목적" value={reservation.purpose} />
        <DetailRow
          label="시작 시간"
          value={formatReservationDateTime(reservation.startTime)}
        />
        <DetailRow
          label="종료 시간"
          value={formatReservationDateTime(reservation.endTime)}
        />
        <DetailRow label="샘플 종류" value={reservation.sampleType} />
        <DetailRow label="샘플 개수" value={`${reservation.sampleCount}개`} />
        <DetailRow label="작성자" value={reservation.createdBy} />
      </div>

      {!owned && (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          본인이 작성한 예약만 수정 및 취소할 수 있습니다.
        </p>
      )}

      <DialogFooter className="gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
        {owned && (
          <>
            <Button variant="secondary" onClick={onEdit}>
              수정
            </Button>
            <Button variant="destructive" onClick={onCancel}>
              예약 취소
            </Button>
          </>
        )}
      </DialogFooter>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function ReservationModal() {
  const {
    modalState,
    closeModal,
    addReservation,
    updateReservation,
    cancelReservation,
    openEditModal,
    getReservation,
  } = useReservations();

  const reservation = modalState.reservationId
    ? getReservation(modalState.reservationId)
    : undefined;

  const equipmentId =
    modalState.equipmentId ?? reservation?.equipmentId ?? "";

  const handleCreate = (
    values: ReservationFormValues,
    selectedEquipmentId: string
  ) => {
    addReservation({
      equipmentId: selectedEquipmentId,
      reservatorName: values.reservatorName,
      purpose: values.purpose as Reservation["purpose"],
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      sampleType: values.sampleType as Reservation["sampleType"],
      sampleCount: values.sampleCount,
    });
    closeModal();
  };

  const handleUpdate = (
    values: ReservationFormValues,
    selectedEquipmentId: string
  ) => {
    if (!reservation) return;
    updateReservation(reservation.id, {
      equipmentId: selectedEquipmentId,
      reservatorName: values.reservatorName,
      purpose: values.purpose as Reservation["purpose"],
      startTime: new Date(values.startTime).toISOString(),
      endTime: new Date(values.endTime).toISOString(),
      sampleType: values.sampleType as Reservation["sampleType"],
      sampleCount: values.sampleCount,
    });
    closeModal();
  };

  const handleCancel = () => {
    if (!reservation) return;
    cancelReservation(reservation.id);
    closeModal();
  };

  const titles: Record<string, string> = {
    create: "기기 예약 등록",
    detail: "예약 상세 정보",
    edit: "예약 수정",
  };

  const descriptions: Record<string, string> = {
    create: "분석기기 사용 예약 정보를 입력해주세요.",
    detail: "예약된 시간대의 상세 정보를 확인할 수 있습니다.",
    edit: "예약 정보를 수정합니다. 본인 작성 예약만 수정 가능합니다.",
  };

  const defaultTimes = getDefaultTimes(
    modalState.defaultStart,
    modalState.defaultEnd
  );

  return (
    <Dialog
      open={modalState.open}
      onOpenChange={(open) => !open && closeModal()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titles[modalState.mode]}</DialogTitle>
          <DialogDescription>
            {descriptions[modalState.mode]}
          </DialogDescription>
        </DialogHeader>

        {modalState.mode === "create" && equipmentId && (
          <ReservationFormFields
            key={`create-${equipmentId}-${defaultTimes.startTime}`}
            equipmentId={equipmentId}
            allowEquipmentSelect={modalState.allowEquipmentSelect}
            defaultValues={{
              reservatorName: "홍길동 연구원",
              ...defaultTimes,
            }}
            onSubmit={handleCreate}
            submitLabel="예약 등록"
          />
        )}

        {modalState.mode === "edit" && reservation && (
          <ReservationFormFields
            key={`edit-${reservation.id}`}
            equipmentId={reservation.equipmentId}
            defaultValues={{
              reservatorName: reservation.reservatorName,
              purpose: reservation.purpose,
              startTime: toDatetimeLocalValue(new Date(reservation.startTime)),
              endTime: toDatetimeLocalValue(new Date(reservation.endTime)),
              sampleType: reservation.sampleType,
              sampleCount: reservation.sampleCount,
            }}
            onSubmit={handleUpdate}
            submitLabel="수정 저장"
          />
        )}

        {modalState.mode === "detail" && reservation && (
          <ReservationDetailView
            reservation={reservation}
            onEdit={() => openEditModal(reservation.id)}
            onCancel={handleCancel}
            onClose={closeModal}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
