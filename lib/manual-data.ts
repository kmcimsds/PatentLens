export interface WikiEditHistory {
  id: string;
  editorName: string;
  editedAt: string;
  summary: string;
}

export interface EquipmentWiki {
  equipmentId: string;
  content: string;
  history: WikiEditHistory[];
}

export interface QaItem {
  id: string;
  question: string;
  answer: string;
}

export interface EquipmentManualContent {
  equipmentId: string;
  officialGuide: string;
  wiki: EquipmentWiki;
  qa: QaItem[];
}

const hplcWikiContent = `# HPLC 연구원 노하우 위키

> **Tip:** 이 문서는 연구실 구성원 누구나 자유롭게 편집할 수 있습니다.

## 컬럼 세척 팁

| 상황 | 세척 용매 | 비고 |
|------|-----------|------|
| 일반 분석 후 | 메탄올 → 워터 | 30분 이상 흘려보내기 |
| 고분자 샘플 | DMSO → ACN → 메탄올 | 순서 변경 금지 |
| 이물질 의심 | 0.1M HCl → 워터 | **pH 2 이하** 주의 |

### 백프레셔 관리
- 정상 범위: **150–300 bar**
- 350 bar 초과 시 즉시 분석 중단 후 라인 점검

## 모바일 Phase 준비

1. **0.22 µm 필터**로 용매 2회 이상 여과
2. **초음파 탈기** 15분 (헬륨 대체 가능)
3. 라벨에 **조제일 + 조제자** 반드시 기재

---

*마지막으로 알려진 좋은 팁: 컬럼 온도 40°C 이상에서는 **유량을 10% 낮추면** 피크 형태가 안정적입니다.*`;

const gcMsWikiContent = `# GC-MS 연구원 노하우 위키

## 이온 소스 유지보수

- **Filament** 수명: 약 6개월 (사용 빈도에 따라 상이)
- 소스 온도 **230°C** 유지 시 감도 최적

## 시료 주입 팁

| 방법 | 장점 | 주의 |
|------|------|------|
| Split | 고농도 시료 | 분할비 확인 |
| Splitless | trace 분석 | 용매 피크 넓어짐 |
| SPME | 전처리 최소 | 섬유 수명 |

**bold 강조:** Carry-over 의심 시 **2 µL hexane blank** 3회 주입`;

const ftirWikiContent = `# FT-IR 연구원 노하우 위키

## KBr 프레스 팁

- **200 mg KBr + 1–2 mg 시료** 비율 준수
- 진공 **10 ton** 2분 유지

## 스펙트럼 품질 체크

- **SNR > 100:1** 목표
- 4000–400 cm⁻¹ 범위 baseline flat 확인`;

const icpMsWikiContent = `# ICP-MS 연구원 노하우 위키

## 내부표준(IS) 선택

| 원소군 | 권장 IS |
|--------|---------|
| 경원소 | Sc, Y |
| 중원소 | Rh, In |
| 중원소 | Bi, Tb |

## 메모리 효과 완화

1. **2% HNO₃** rinse 3분
2. 고농도 시료 후 **blank 5회**`;

function createWiki(
  equipmentId: string,
  content: string,
  history: WikiEditHistory[]
): EquipmentWiki {
  return { equipmentId, content, history };
}

export function createInitialManuals(): Record<string, EquipmentManualContent> {
  return {
    "gc-ms-01": {
      equipmentId: "gc-ms-01",
      officialGuide: `# GC-MS 공식 운영 가이드 (SOP)

**문서 버전:** v2.1 · **작성:** 기기 관리팀 · **수정 불가**

## 1. 기기 개요

Gas Chromatography–Mass Spectrometry (GC-MS)는 휘발성/半휘발성 화합물의 **분리·동정·정량**을 수행하는 핵심 분석 장비입니다.

## 2. 시동 절차

1. He 가스 압력 **99.999%** 확인 (≥ 5 bar)
2. MS 전원 ON → **Tune** 파일 로드
3. GC Oven **50°C** 유지 10분
4. Autosampler **Ready** 확인

## 3. 안전 수칙

- **고독성 시료**는 반드시 후드 내 준비
- Ion source 온도 **250°C 초과** 설정 금지
- Vent 시 **5분 이상** 대기 후 커버 개방

## 4. 비상 연락

| 상황 | 담당 |
|------|------|
| 가스 누출 | 기기 관리팀 (내선 201) |
| MS 튜닝 실패 | Agilent AS (080-xxxx-xxxx) |`,
      wiki: createWiki("gc-ms-01", gcMsWikiContent, [
        {
          id: "wh-gc-1",
          editorName: "김민준 박사",
          editedAt: "2026-07-10T14:30:00.000Z",
          summary: "SPME 주입 방법 표 추가",
        },
        {
          id: "wh-gc-2",
          editorName: "홍길동 연구원",
          editedAt: "2026-07-12T09:15:00.000Z",
          summary: "Carry-over 대처 blank 주입 팁 추가",
        },
      ]),
      qa: [
        {
          id: "qa-gc-1",
          question: "Tune 실패 (EM Voltage error) 시 대처법?",
          answer:
            "1) He 유량 재확인 2) Ion source 재시작 3) 2회 실패 시 관리팀 연락. EM Voltage는 **1800V 이하** 유지 권장.",
        },
        {
          id: "qa-gc-2",
          question: "Peak tailing이 심할 때",
          answer:
            "Inlet liner 교체 여부 확인. **Split ratio 10:1 이상**에서 tailing 감소하는 경우 liner 오염 의심.",
        },
      ],
    },
    "hplc-01": {
      equipmentId: "hplc-01",
      officialGuide: `# HPLC 공식 운영 가이드 (SOP)

**문서 버전:** v3.0 · **작성:** 기기 관리팀 · **수정 불가**

## 1. 기기 개요

High Performance Liquid Chromatography (HPLC)는 액체 이동상을 이용한 **고분해능 크로마토그래피** 장비입니다.

## 2. 일일 점검

- Leak 센서 **Pass** 확인
- Pump 압력 **< 400 bar** (정상 idle)
- Waste bottle 용량 **80% 미만**

## 3. 분석 전 체크리스트

- [ ] Mobile phase 여과 완료
- [ ] Column 온도 설정 확인
- [ ] Autosampler needle wash 3 cycle
- [ ] Blank injection 1회

## 4. 컬럼 보관

| 컬럼 종류 | 보관 용매 |
|-----------|-----------|
| C18 | ACN/H₂O (80/20) |
| NH₂ | ACN 100% |
| SEC | PBS + 0.02% NaN₃ |`,
      wiki: createWiki("hplc-01", hplcWikiContent, [
        {
          id: "wh-hplc-1",
          editorName: "이서연 연구원",
          editedAt: "2026-07-08T11:20:00.000Z",
          summary: "컬럼 세척 표 최초 작성",
        },
        {
          id: "wh-hplc-2",
          editorName: "홍길동 연구원",
          editedAt: "2026-07-15T08:45:00.000Z",
          summary: "HPLC 컬럼 세척 팁 추가",
        },
        {
          id: "wh-hplc-3",
          editorName: "박지훈 연구원",
          editedAt: "2026-07-14T16:00:00.000Z",
          summary: "모바일 phase 탈기 시간 15분으로 수정",
        },
      ]),
      qa: [
        {
          id: "qa-hplc-1",
          question: "Baseline drift가 심할 때",
          answer:
            "Mobile phase 탈기 불충분 또는 컬럼 온도 미안정. **초음파 탈기 20분** 재실시 후 blank 확인.",
        },
        {
          id: "qa-hplc-2",
          question: "Pressure spike (> 600 bar)",
          answer:
            "즉시 Pump STOP. In-line filter / guard column 막힘 가능성. **역방향 flush** 금지 — 관리팀 호출.",
        },
        {
          id: "qa-hplc-3",
          question: "Retention time shift",
          answer:
            "Column equilibration 부족 (최소 **10 column volume**). pH drift 시 mobile phase 재조제.",
        },
      ],
    },
    "ftir-01": {
      equipmentId: "ftir-01",
      officialGuide: `# FT-IR 공식 운영 가이드 (SOP)

**문서 버전:** v1.5 · **작성:** 기기 관리팀 · **수정 불가**

## 1. 기기 개요

Fourier Transform Infrared Spectroscopy (FT-IR)는 분자의 **진동 스펙트럼**을 측정하여 관능기 분석을 수행합니다.

## 2. 측정 모드

| 모드 | 용도 |
|------|------|
| ATR | 고체/액체 film |
| KBr pellet | 분말 시료 |
| Liquid cell | 휘발성 용액 |

## 3. Background 수집

- **64 scans** 권장
- ATR crystal **이론/알코올** 세척 후 건조

## 4. 품질 기준

- Resolution **4 cm⁻¹**
- Water vapor band (1900–1300 cm⁻¹) baseline flat`,
      wiki: createWiki("ftir-01", ftirWikiContent, [
        {
          id: "wh-ftir-1",
          editorName: "이서연 연구원",
          editedAt: "2026-07-11T10:00:00.000Z",
          summary: "KBr 프레스 팁 섹션 추가",
        },
      ]),
      qa: [
        {
          id: "qa-ftir-1",
          question: "ATR crystal에 시료가 안 닿을 때",
          answer:
            "Pressure tip **균일하게** 조이기. 연성 시료는 **얇게 펴서** 접촉면 확보.",
        },
        {
          id: "qa-ftir-2",
          question: "CO₂ peak (2349 cm⁻¹) 간섭",
          answer:
            "실험실 환기 후 background 재수집. Door 개폐 **5분 전** background 권장.",
        },
      ],
    },
    "icp-ms-01": {
      equipmentId: "icp-ms-01",
      officialGuide: `# ICP-MS 공식 운영 가이드 (SOP)

**문서 버전:** v2.0 · **작성:** 기기 관리팀 · **수정 불가**

## 1. 기기 개요

Inductively Coupled Plasma Mass Spectrometry (ICP-MS)는 **ppt~ppb** 수준의 원소 분석을 수행합니다.

## 2. Plasma 점화

1. Exhaust ON → **5분** 대기
2. Ar flow **15 L/min** (plasma)
3. RF power **1600 W** ramp
4. **CeO/Ce ratio < 3%** 확인 (tuning)

## 3. 시료 준비

- **2% HNO₃** 매트릭스
- TDS **< 0.2%** (고염 시료 희석)
- Internal standard **온라인 추가** 권장

## 4. QC 기준

| 항목 | 기준 |
|------|------|
| RSD (n=5) | < 5% |
| Recovery | 90–110% |
| Carry-over | < 1% |`,
      wiki: createWiki("icp-ms-01", icpMsWikiContent, [
        {
          id: "wh-icp-1",
          editorName: "박지훈 연구원",
          editedAt: "2026-07-09T13:30:00.000Z",
          summary: "내부표준 선택 표 작성",
        },
      ]),
      qa: [
        {
          id: "qa-icp-1",
          question: "Doubly charged interference (Ba²⁺ on As⁺)",
          answer:
            "Collision cell **He mode** 사용. Ba 농도 높은 시료는 **희석** 또는 alternative isotope (75As).",
        },
        {
          id: "qa-icp-2",
          question: "Plasma extinguished during run",
          answer:
            "Nebulizer clog 또는 Ar supply 문제. **Pump off** → Ar 재확인 → 재점화. 시료 rack 위치 확인.",
        },
      ],
    },
  };
}

export function formatEditDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
