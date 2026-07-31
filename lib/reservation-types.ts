export type ReservationPurpose =
  | "정량 분석"
  | "정성 분석"
  | "표준물질 분석"
  | "방법 개발"
  | "기타";

export type SampleType =
  | "유기화합물"
  | "금속이온"
  | "고분자"
  | "수질 시료"
  | "기타";

export interface Reservation {
  id: string;
  equipmentId: string;
  reservatorName: string;
  createdBy: string;
  purpose: ReservationPurpose;
  startTime: string;
  endTime: string;
  sampleType: SampleType;
  sampleCount: number;
  note?: string;
}

export type ReservationModalMode = "create" | "detail" | "edit";

export interface ReservationModalState {
  open: boolean;
  mode: ReservationModalMode;
  equipmentId?: string;
  reservationId?: string;
  defaultStart?: Date;
  defaultEnd?: Date;
  allowEquipmentSelect?: boolean;
}

export const purposeOptions: ReservationPurpose[] = [
  "정량 분석",
  "정성 분석",
  "표준물질 분석",
  "방법 개발",
  "기타",
];

export const sampleTypeOptions: SampleType[] = [
  "유기화합물",
  "금속이온",
  "고분자",
  "수질 시료",
  "기타",
];

export const equipmentColors: Record<string, string> = {
  "gc-ms-01": "#2563eb",
  "hplc-01": "#059669",
  "ftir-01": "#d97706",
  "icp-ms-01": "#7c3aed",
};

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function tomorrowAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function createInitialReservations(): Reservation[] {
  const now = new Date();
  const gcEnd = new Date(now.getTime() + 42 * 60 * 1000);

  return [
    {
      id: "res-001",
      equipmentId: "gc-ms-01",
      reservatorName: "김민준 박사",
      createdBy: "김민준 박사",
      purpose: "정량 분석",
      startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      endTime: gcEnd.toISOString(),
      sampleType: "유기화합물",
      sampleCount: 12,
    },
    {
      id: "res-002",
      equipmentId: "ftir-01",
      reservatorName: "이서연 연구원",
      createdBy: "이서연 연구원",
      purpose: "정성 분석",
      startTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() + 18 * 60 * 1000).toISOString(),
      sampleType: "고분자",
      sampleCount: 5,
    },
    {
      id: "res-003",
      equipmentId: "hplc-01",
      reservatorName: "홍길동 연구원",
      createdBy: "홍길동 연구원",
      purpose: "정량 분석",
      startTime: todayAt(14, 0).toISOString(),
      endTime: todayAt(16, 0).toISOString(),
      sampleType: "유기화합물",
      sampleCount: 8,
    },
    {
      id: "res-004",
      equipmentId: "icp-ms-01",
      reservatorName: "박지훈 연구원",
      createdBy: "박지훈 연구원",
      purpose: "표준물질 분석",
      startTime: tomorrowAt(10, 0).toISOString(),
      endTime: tomorrowAt(12, 30).toISOString(),
      sampleType: "금속이온",
      sampleCount: 20,
    },
    {
      id: "res-005",
      equipmentId: "gc-ms-01",
      reservatorName: "홍길동 연구원",
      createdBy: "홍길동 연구원",
      purpose: "방법 개발",
      startTime: tomorrowAt(9, 0).toISOString(),
      endTime: tomorrowAt(11, 0).toISOString(),
      sampleType: "유기화합물",
      sampleCount: 3,
    },
  ];
}
