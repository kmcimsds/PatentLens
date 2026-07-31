export type EquipmentStatus = "available" | "in_use";

export interface Equipment {
  id: string;
  name: string;
  fullName: string;
  location: string;
  status: EquipmentStatus;
  currentUser?: string;
  remainingMinutes?: number;
  endTime?: Date;
  category: string;
}

export const currentUser = {
  name: "홍길동",
  role: "연구원",
  displayName: "홍길동 연구원",
  initials: "홍",
};

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export const equipmentList: Equipment[] = [
  {
    id: "gc-ms-01",
    name: "GC-MS",
    fullName: "Gas Chromatography–Mass Spectrometry",
    location: "분석실 A-201",
    status: "in_use",
    currentUser: "김민준 박사",
    remainingMinutes: 42,
    endTime: minutesFromNow(42),
    category: "질량분석",
  },
  {
    id: "hplc-01",
    name: "HPLC",
    fullName: "High Performance Liquid Chromatography",
    location: "분석실 A-203",
    status: "available",
    category: "크로마토그래피",
  },
  {
    id: "ftir-01",
    name: "FT-IR",
    fullName: "Fourier Transform Infrared Spectroscopy",
    location: "분석실 B-102",
    status: "in_use",
    currentUser: "이서연 연구원",
    remainingMinutes: 18,
    endTime: minutesFromNow(18),
    category: "분광분석",
  },
  {
    id: "icp-ms-01",
    name: "ICP-MS",
    fullName: "Inductively Coupled Plasma Mass Spectrometry",
    location: "분석실 A-205",
    status: "available",
    category: "원소분석",
  },
];

export const navItems = [
  {
    title: "기기 현황 & 예약",
    href: "/",
    icon: "layout-dashboard" as const,
  },
  {
    title: "예약 스케줄",
    href: "/schedule",
    icon: "calendar" as const,
  },
  {
    title: "기기 매뉴얼",
    href: "/manuals",
    icon: "book-open" as const,
  },
];
