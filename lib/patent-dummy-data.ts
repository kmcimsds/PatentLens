import type { PatentAnalysis } from "@/lib/patent-types";

/** 데모용 예시 특허 번호 */
export const EXAMPLE_PATENT_NUMBER = "US10123456B2";

/**
 * 1단계 UI용 더미 분석 데이터.
 * 실제 SerpApi / Gemini 연동 전 화면 검증용입니다.
 */
export const DUMMY_PATENT: PatentAnalysis = {
  number: "US10123456B2",
  title:
    "Method and composition for enhanced catalytic conversion of biomass-derived sugars",
  titleKo: "바이오매스 유래 당의 촉매 전환 효율을 향상시키는 방법 및 조성물",
  assignee: "GreenChem Research Institute",
  inventors: ["Elena Vasquez", "Min-Jun Park", "Hiroshi Tanaka"],
  filingDate: "2018-03-14",
  publicationDate: "2019-09-19",
  grantDate: "2021-11-02",
  status: "registered",
  statusLabel: "등록",
  ipc: ["C07C 29/00", "B01J 23/46", "C13K 1/02"],
  googlePatentsUrl: "https://patents.google.com/patent/US10123456B2",
  abstract:
    "본 발명은 리그노셀룰로오스 바이오매스에서 추출한 단당류를 고선택성 금속 촉매 존재하에서 플랫폼 화학물질로 전환하는 방법 및 그에 적합한 촉매 조성물에 관한 것이다. 특히 루테늄-니켈 이원 촉매와 특정 pH 완충 시스템을 조합하여 기존 대비 전환율과 선택도를 동시에 향상시킨다.",
  problem:
    "기존 바이오매스 당 전환 공정은 고온·고압 조건이 필요하고, 부반응(카라멜화, 휴민 형성)으로 인해 목표 생성물 선택도가 낮은 문제가 있었다. 또한 촉매 재사용 시 활성 저하가 빨라 공정 경제성이 떨어졌다.",
  solution:
    "Ru-Ni/Al₂O₃ 이원 촉매에 약산성 인산 완충액을 병용하고, 반응 온도를 140–160 °C로 낮춘 완만한 수소화 조건을 제시한다. 이를 통해 5-HMF 및 레불린산으로의 선택적 전환과 촉매 수명 연장을 동시에 달성한다.",
  technicalOverview:
    "발명은 (1) 전처리된 셀룰로오스 가수분해물 준비, (2) 이원 금속 촉매 고정상 반응, (3) 연속 또는 배치식 수소화/탈수 반응의 세 축으로 구성된다. 핵심은 금속 비율(Ru:Ni = 1:3–1:5)과 완충 시스템(pH 4.5–5.5)의 상호작용으로, 특허 청구범위는 촉매 조성·반응 조건·생성물 회수 방법에 걸쳐 있다.",
  methods: [
    {
      title: "촉매 제조",
      steps: [
        "γ-Al₂O₃ 지지체에 질산루테늄 및 질산니켈 수용액을 함침한다.",
        "80 °C에서 건조 후 400 °C에서 4시간 소성한다.",
        "반응 직전 10% H₂/N₂ 분위기에서 300 °C, 2시간 환원한다.",
      ],
    },
    {
      title: "배치 반응 절차",
      steps: [
        "글루코스 또는 자일로스 수용액(5–15 wt%)을 오토클레이브에 투입한다.",
        "촉매를 기질 대비 2–5 wt% 투입하고 인산 완충액으로 pH를 조정한다.",
        "수소 2–4 MPa를 충전한 뒤 목표 온도까지 승온하여 2–6시간 반응한다.",
        "냉각 후 여과·추출하여 생성물을 분리·정량한다.",
      ],
    },
    {
      title: "분석 방법",
      steps: [
        "HPLC(RID/UV)로 당·중간체·생성물 농도를 정량한다.",
        "GC-MS로 부생성물 프로파일을 확인한다.",
        "ICP-OES로 반응액 내 금속 용출을 모니터링한다.",
      ],
    },
  ],
  compositions: [
    {
      name: "Ru-Ni/Al₂O₃",
      role: "이원 수소화 촉매",
      disclosedRange: "Ru 0.5–2 wt%, Ni 2–8 wt%",
    },
    {
      name: "인산 완충액",
      role: "pH 제어 및 부반응 억제",
      disclosedRange: "pH 4.5–5.5",
    },
    {
      name: "기질 수용액",
      role: "단당류 공급원",
      disclosedRange: "5–15 wt%",
    },
  ],
  estimatedConditions: [
    {
      parameter: "용매 조성",
      estimatedValue: "물 단독 또는 물:γ-발레로락톤 = 9:1 (v/v)",
      confidence: "high",
      rationale:
        "청구범위와 실시예에서 수계 반응이 중심이며, 유사 Ru 촉매 문헌에서 GVL 소량 첨가가 휴민 억제에 유리하다는 패턴이 반복됩니다.",
    },
    {
      parameter: "최적 촉매 로딩",
      estimatedValue: "기질 대비 3.0–3.5 wt%",
      confidence: "medium",
      rationale:
        "실시예 범위(2–5 wt%) 중 중간값 부근에서 전환율/선택도 균형이 가장 좋게 기술되어 있으며, 과도한 로딩은 과수소화 부반응을 암시합니다.",
    },
    {
      parameter: "교반 속도",
      estimatedValue: "600–800 rpm (배치 오토클레이브)",
      confidence: "medium",
      rationale:
        "특허에 명시되지 않았으나 유사 고압 수소화 실험에서 물질전달 한계를 피하기 위해 흔히 사용되는 범위입니다.",
    },
    {
      parameter: "반응 농도(권장)",
      estimatedValue: "글루코스 10 wt%, pH 5.0, 150 °C, H₂ 3 MPa, 4 h",
      confidence: "high",
      rationale:
        "대표 실시예에서 반복적으로 등장하는 조건 조합이며, 청구범위의 중심값에 가깝습니다.",
    },
    {
      parameter: "미개시 첨가제",
      estimatedValue: "NaCl 또는 KCl 10–50 mM (선택적)",
      confidence: "low",
      rationale:
        "명세서에 직접 기재는 없으나, 동종 분야 특허에서 할라이드가 Ru 분산/선택도에 영향을 준다는 보고가 있어 추가 검증이 필요합니다.",
    },
  ],
  results: {
    summary:
      "대표 조건에서 글루코스 전환율 92% 이상, 목표 플랫폼 화합물 선택도 78–85%를 달성했으며, 촉매는 5회 재사용 후에도 활성 유지율이 90% 이상으로 보고되었다.",
    highlights: [
      "기존 Ni 단독 촉매 대비 선택도 약 1.4배 향상",
      "반응 온도를 180 °C → 150 °C로 낮추면서도 동등 이상의 전환율 확보",
      "금속 용출량 검출 한계 이하로 공정 안정성 개선",
    ],
    quantitative: [
      {
        metric: "글루코스 전환율",
        value: "92–96%",
        note: "150 °C, 4 h, H₂ 3 MPa",
      },
      {
        metric: "목표 생성물 선택도",
        value: "78–85%",
        note: "실시예 3–7 평균",
      },
      {
        metric: "촉매 재사용",
        value: "5회 / 활성 ≥90%",
        note: "세척·재환원 포함",
      },
    ],
  },
  relatedKeywords: [
    "바이오매스 전환",
    "이원 금속 촉매",
    "수계 수소화",
    "플랫폼 화학물질",
  ],
  relatedPatents: [
    {
      number: "US9876543B1",
      title: "Bimetallic catalysts for aqueous-phase sugar hydrogenation",
      titleKo: "수상 수소화용 이원 금속 촉매",
      assignee: "Nordic Catalysts AB",
      relevance: "이원 금속 촉매 조성 유사, 수계 수소화 조건 비교에 유용",
      url: "https://patents.google.com/patent/US9876543B1",
    },
    {
      number: "EP3123456A1",
      title: "Process for producing levulinic acid from cellulose hydrolysate",
      titleKo: "셀룰로오스 가수분해물로부터 레불린산을 제조하는 방법",
      assignee: "EuroBio Chemicals GmbH",
      relevance: "레불린산 경로 및 전처리 가수분해물 활용 관점",
      url: "https://patents.google.com/patent/EP3123456A1",
    },
    {
      number: "KR102234567B1",
      title: "바이오매스 유래 당의 선택적 탈수 촉매 및 이를 이용한 전환 방법",
      titleKo: "바이오매스 유래 당의 선택적 탈수 촉매 및 이를 이용한 전환 방법",
      assignee: "한국그린케미컬(주)",
      relevance: "국내 유사 기술, pH·용매 조건 교차 검토용",
      url: "https://patents.google.com/patent/KR102234567B1",
    },
  ],
};

/** 검색 번호에 따라 더미 결과를 반환 (실제 API 연동 전) */
export function getDummyAnalysis(query: string): PatentAnalysis {
  const normalized = query.trim().toUpperCase().replace(/\s+/g, "");
  return {
    ...DUMMY_PATENT,
    number: normalized || DUMMY_PATENT.number,
    googlePatentsUrl: `https://patents.google.com/patent/${normalized || DUMMY_PATENT.number}`,
  };
}
