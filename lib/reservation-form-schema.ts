import { z } from "zod";

import {
  purposeOptions,
  sampleTypeOptions,
  type ReservationPurpose,
  type SampleType,
} from "@/lib/reservation-types";

const purposeEnum = z.enum(
  purposeOptions as [ReservationPurpose, ...ReservationPurpose[]]
);

const sampleTypeEnum = z.enum(
  sampleTypeOptions as [SampleType, ...SampleType[]]
);

export const reservationFormSchema = z
  .object({
    reservatorName: z.string().min(1, "예약자 이름을 입력해주세요"),
    purpose: purposeEnum,
    startTime: z.string().min(1, "시작 시간을 선택해주세요"),
    endTime: z.string().min(1, "종료 시간을 선택해주세요"),
    sampleType: sampleTypeEnum,
    sampleCount: z
      .number()
      .int("정수를 입력해주세요")
      .min(1, "1개 이상 입력해주세요"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "종료 시간은 시작 시간 이후여야 합니다",
    path: ["endTime"],
  });

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatReservationDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
