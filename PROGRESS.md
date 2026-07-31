# PatentLens 진행 상황 (Checkpoint)

최종 업데이트: 2026-07-29

## [완료된 작업]

1. **1단계 UI**
   - 검색 중심 초기 화면, 다크 모드, 위키형 목차/결과 섹션
2. **2단계 API 연동**
   - SerpApi Google Patents Details → Gemini 구조화 분석 → 프론트 표시
   - `.env.local` / BYOK(localStorage) API 키 설정
   - 오류 처리(미발견, 한도 초과, 타임아웃, 인증서/연결 실패)
3. **품질/개발 편의**
   - 한국어 출력 강제
   - React key 중복 경고 수정, `cross-env` + `NODE_OPTIONS=--use-system-ca` 개발 스크립트
4. **프롬프트 고도화 + 해외 특허 회귀**
   - `lib/server/gemini.ts` CTO·변리사급 프롬프트, `temperature` 0.15, 스키마 description 보강
   - US/EP/JP 회귀: `scripts/prompt-regression.mjs` (EP0415679A2 샘플)
5. **연관 특허 한국어 제목**
   - `translateRelatedPatentTitles()` — Gemini 배치 번역, 본문 분석과 병렬 실행
   - UI/PDF: `titleKo` 우선 표시, 원문 제목 보조 표기
6. **배포 준비**
   - `vercel.json` (analyze API maxDuration 90)
   - IP 기반 rate limit (`lib/server/rate-limit.ts`, 기본 10회/분)
   - README: Vercel 배포, 환경변수, 비용·한도 안내
7. **PDF 출력 방식 전환 (html2pdf → 브라우저 인쇄)**
   - `lib/print-patent-report.ts`: 숨김 iframe → **팝업 창** + 로컬 **Noto Sans KR** (`public/fonts`)
   - 원인(복사 불가): 0×0 iframe print 시 Chromium이 한글을 폰트가 아닌 벡터 윤곽선으로만 저장
   - 버튼: "인쇄 / PDF 저장" + 이미지로 인쇄 OFF 안내
   - `html2pdf.js` 제거

## [현재 상태]

- **실행:** `npm run dev` → API 키 설정 → 특허 검색 → 인쇄 / PDF 저장
- **회귀:** `node --use-system-ca --env-file=.env.local scripts/prompt-regression.mjs`
- **알려진 제약:** 크롬이 `@page`의 `@bottom-center`를 지원하지 않아 CSS로 페이지 번호를
  넣을 수 없음. 인쇄 창의 "머리글 및 바닥글" 옵션으로 대체.

## [다음 진행 예정 작업 (선택)]

1. (선택) 분석 이력 저장, 로딩 스트리밍, 예시 특허를 실제 공개번호로 교체
2. (선택) Redis 등 전역 rate limit, 배포 후 E2E smoke test
3. (선택) 페이지 번호·머리말이 필요하면 서버 Puppeteer `page.pdf()`로 이전
