# PatentLens

특허 번호를 입력하면 Google Patents 데이터를 가져와 Gemini가 한국어로 분석하는
Next.js 애플리케이션입니다.

## 처음 실행하는 방법

### 1. API 키 발급

1. [SerpApi API Key](https://serpapi.com/manage-api-key)를 발급합니다.
2. [Google AI Studio API Key](https://aistudio.google.com/app/apikey)를 발급합니다.

API 키는 비밀번호와 같습니다. 화면 공유, 이메일, GitHub 등에 노출하지 마세요.

### 2. 실행

```bash
npm install
npm run dev
```

브라우저에서 표시된 주소(보통 `http://localhost:3000`)를 엽니다.

### 3. 화면에서 API 키 설정 (권장)

1. 우측 상단 **API 키 설정**을 클릭합니다.
2. SerpApi Key와 Gemini API Key를 입력하고 저장합니다.
3. 키는 브라우저 `localStorage`에만 저장되며, 검색 시 서버로 전달되어 해당 사용자 키로 API를 호출합니다.

선택적으로 서버 기본 키를 `.env.local`에 둘 수 있습니다. 사용자 키가 있으면 사용자 키가 우선합니다.

```text
SERPAPI_KEY=발급받은_SerpApi_키
GEMINI_API_KEY=발급받은_Gemini_키
GEMINI_MODEL=gemini-2.5-flash
```

회사/학교 네트워크에서 HTTPS 인증서 오류가 나면 PowerShell에서 다음으로 실행하세요.

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm run dev
```

또는 `npm run dev` 스크립트에 이미 `cross-env NODE_OPTIONS=--use-system-ca`가 포함되어 있습니다.

## 주요 기능

- 해외 특허도 Gemini 분석 결과는 **한국어**로 출력
- 연관 특허 제목도 한국어 번역(`titleKo`)으로 표시
- 분석 결과 화면의 **인쇄 / PDF 저장**
- 사용자 개별 API 키 입력 (BYOK)

### 보고서 인쇄 / PDF 저장

결과 화면 우측 상단의 **인쇄 / PDF 저장** 버튼을 누르면 인쇄용 팝업과 브라우저 인쇄 창이 열립니다.
대상(Destination)을 **"PDF로 저장"** 으로 선택하면 A4 보고서가 저장됩니다.

Noto Sans KR 폰트가 PDF에 임베드되어 텍스트를 복사·검색할 수 있습니다.

- 팝업이 차단되면 이 사이트 팝업을 허용하세요.
- **"이미지로 인쇄"(Print as image)** 가 있으면 **끄세요.** 켜면 복사가 안 됩니다.
- 테두리·배경색이 빠지면 **"배경 그래픽"** 을 켜세요.
- 페이지 번호는 **"머리글 및 바닥글"** 옵션으로 넣을 수 있습니다.

## 처리 흐름

1. 브라우저가 `POST /api/patents/analyze`에 특허 번호와 (선택) 사용자 API 키를 보냅니다.
2. 서버가 SerpApi의 `google_patents_details` 엔진으로 원문을 조회합니다.
3. 서버가 초록·청구항·상세 설명을 Gemini에 전달하고, 연관 특허 제목 번역을 병렬로 수행합니다.
4. Gemini의 구조화 JSON 결과와 SerpApi 서지 정보를 합쳐 화면에 반환합니다.

## Vercel 배포

### 1. 저장소 연결

1. GitHub 등에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에서 New Project → 저장소를 Import합니다.
3. Framework Preset은 **Next.js**를 그대로 사용합니다.

### 2. 환경 변수 (선택)

배포 환경에서도 BYOK(사용자 키 입력)만 쓸 수 있습니다. 서버 기본 키를 쓰려면 Vercel Project Settings → Environment Variables에 추가하세요.

| 변수 | 설명 |
|------|------|
| `SERPAPI_KEY` | (선택) 서버 기본 SerpApi 키 |
| `GEMINI_API_KEY` | (선택) 서버 기본 Gemini 키 |
| `GEMINI_MODEL` | (선택) 기본 `gemini-2.5-flash` |
| `RATE_LIMIT_MAX` | (선택) IP당 분당 분석 횟수, 기본 `10` |
| `RATE_LIMIT_WINDOW_MS` | (선택) 제한 창(ms), 기본 `60000` |

`vercel.json`에 분석 API `maxDuration: 90`초가 설정되어 있습니다. Hobby 플랜은 함수 실행 시간 제한이 더 짧을 수 있으니, Pro 또는 Edge/Serverless 설정을 확인하세요.

### 3. 배포 후 확인

- `/` 접속 → API 키 설정 → 예: `US11734097B1` 검색
- 429 응답 시 앱 자체 rate limit 또는 SerpApi/Gemini 한도 초과를 확인

## 비용·사용량 안내 (대략)

| 서비스 | 1회 분석당 | 참고 |
|--------|-----------|------|
| SerpApi | Google Patents Details 1회 | [SerpApi 요금제](https://serpapi.com/pricing) — 무료 티어는 월 검색 수 제한 |
| Gemini | 본문 분석 1회 + 연관 제목 번역 1회 | [Google AI 가격](https://ai.google.dev/pricing) — `gemini-2.5-flash`는 비교적 저렴 |

- **BYOK 권장:** 키와 비용을 사용자/팀 단위로 분리할 수 있습니다.
- **앱 rate limit:** 기본 IP당 분당 10회(`RATE_LIMIT_MAX`)로 남용을 완화합니다. 서버리스 인스턴스마다 메모리 기반이라 완전한 전역 제한은 아닙니다.
- **Upstream 한도:** SerpApi·Gemini 각각의 429는 별도로 발생하며, UI에 “요청 한도 초과”로 표시됩니다.

## 품질 회귀 테스트 (개발자용)

```bash
node --use-system-ca --env-file=.env.local scripts/prompt-regression.mjs
```

샘플: US11734097B1, EP0415679A2, JP2015526364A

## 주요 오류 안내

- `API 키를 먼저 설정해 주세요`: 상단 API 키 설정에서 두 키를 모두 저장하세요.
- `해당 특허 번호를 ... 찾을 수 없습니다`: 번호와 공개번호 형식을 확인하세요.
- `요청 한도를 초과했습니다`: SerpApi/Gemini 사용량 또는 앱 rate limit. 잠시 후 재시도하세요.
- `요청이 너무 많습니다`: 동일 IP에서 분당 허용 횟수를 초과했습니다.
- `시간이 초과되었습니다`: 외부 API가 지연된 경우입니다. 잠시 후 다시 시도하세요.
- `Google Patents 서비스에 연결할 수 없습니다`: 네트워크/인증서 문제를 확인하고 `--use-system-ca`로 재실행하세요.
- `인쇄 창이 차단되었습니다`: 브라우저에서 이 사이트의 팝업을 허용하세요.
