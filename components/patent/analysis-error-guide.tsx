"use client";

import { CircleHelp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ErrorRow = {
  message: string;
  reason: string;
  fix: string;
};

const KEY_ROWS: ErrorRow[] = [
  {
    message: "API 키를 먼저 설정해 주세요",
    reason: "SerpApi 또는 Gemini 키가 입력되지 않음",
    fix: "상단 API 키 설정에서 두 키 모두 저장",
  },
  {
    message: "특허 번호 형식을 확인해 주세요",
    reason: "번호 형식이 틀림 (국가코드 누락, 32자 초과 등)",
    fix: "US10123456B2처럼 국가코드+번호+종류코드로 입력",
  },
  {
    message: "요청이 너무 많습니다 (분당 분석 횟수 제한)",
    reason: "같은 IP에서 1분에 10회 넘게 분석함 (앱 자체 제한)",
    fix: "1분 정도 기다렸다가 재시도",
  },
];

const SERP_ROWS: ErrorRow[] = [
  {
    message: "해당 특허 번호를 Google Patents에서 찾을 수 없습니다",
    reason: "없는 번호이거나 Google Patents에 등록되지 않은 번호",
    fix: "Google Patents에서 번호를 검색해 정확한 공개번호 확인",
  },
  {
    message: "SerpApi 요청 한도를 초과했습니다",
    reason: "SerpApi 월간 검색 횟수 소진 또는 짧은 시간 내 과다 요청",
    fix: "SerpApi 대시보드에서 잔여 횟수 확인, 필요하면 요금제 변경",
  },
  {
    message: "Google Patents 데이터를 가져오지 못했습니다",
    reason:
      "SerpApi가 에러를 응답함. SerpApi 키가 틀린 경우가 가장 흔하고, 특정 번호 조회 실패일 수도 있음",
    fix: "SerpApi 키 재확인, 다른 번호로 시험",
  },
  {
    message: "Google Patents 서비스에 연결할 수 없습니다",
    reason:
      "서버가 SerpApi에 접속 자체를 못 함. 회사망 SSL 인증서 문제가 대표적",
    fix: "로컬에서는 npm run dev로 실행(--use-system-ca 포함), 네트워크 확인",
  },
  {
    message: "Google Patents 조회 시간이 초과되었습니다",
    reason: "SerpApi 응답이 25초 넘게 걸림",
    fix: "잠시 후 재시도",
  },
];

const GEMINI_ROWS: ErrorRow[] = [
  {
    message: "Gemini API 키가 유효하지 않습니다",
    reason: "키 오타 또는 삭제된 키",
    fix: "Google AI Studio에서 키 확인 후 다시 입력",
  },
  {
    message: "이 Gemini API 키는 사용 제한이 설정되지 않아 차단되었습니다",
    reason: "키가 외부에 노출되는 등의 이유로 Google이 키를 차단함",
    fix: "AI Studio에서 키를 새로 발급",
  },
  {
    message: "Gemini API가 비활성화되어 있습니다",
    reason: "키가 속한 Google Cloud 프로젝트에서 Gemini API가 꺼져 있음",
    fix: "AI Studio에서 키를 새로 발급",
  },
  {
    message: "Gemini API 키에 사용 권한이 없습니다",
    reason: "키에 IP·리퍼러 제한이 걸려 있음",
    fix: "키 제한 해제 또는 새 키 발급",
  },
  {
    message: "Gemini API 요청 한도를 초과했습니다",
    reason: "무료 등급의 분당·일일 호출 한도 초과",
    fix: "잠시 후 재시도, 자주 발생하면 유료 등급 검토",
  },
  {
    message: "AI 모델이 일시적으로 혼잡합니다",
    reason: "Google 쪽 서버 과부하 (503)",
    fix: "잠시 후 재시도. 사용자 쪽 문제 아님",
  },
  {
    message: "AI 분석 시간이 초과되었습니다",
    reason: "특허 원문이 길어 Gemini 응답이 제한 시간을 넘김",
    fix: "재시도. 반복되면 다른 특허로 시험",
  },
  {
    message: "AI 분석 결과 형식을 확인할 수 없습니다",
    reason: "Gemini가 정해진 JSON 형식을 지키지 않고 응답함",
    fix: "대부분 재시도하면 해결됨",
  },
  {
    message: "AI 모델을 사용할 수 없습니다",
    reason: "서버에 설정된 모델 이름(GEMINI_MODEL)이 없거나 종료된 모델",
    fix: "관리자가 환경 변수의 모델명 수정",
  },
  {
    message: "AI 분석에 실패했습니다",
    reason: "위에 해당하지 않는 기타 Gemini 오류",
    fix: "재시도. 반복되면 서버 로그에서 원인 확인",
  },
];

const BROWSER_ROWS: ErrorRow[] = [
  {
    message: "분석 시간이 초과되었습니다",
    reason: "서버 응답이 95초 안에 오지 않음",
    fix: "재시도. Vercel Hobby 플랜이면 함수 실행 시간 제한일 수 있음",
  },
  {
    message:
      "특허 분석 중 오류가 발생했습니다 / 특허 분석에 실패했습니다",
    reason: "예상하지 못한 서버 오류 또는 응답 해석 실패",
    fix: "재시도. 반복되면 서버 로그 확인",
  },
];

function ErrorTable({ rows }: { rows: ErrorRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="w-[34%] px-3 py-2.5 font-medium">화면 메시지</th>
            <th className="w-[33%] px-3 py-2.5 font-medium">이유</th>
            <th className="w-[33%] px-3 py-2.5 font-medium">해결법</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.message}
              className="border-t border-border/60 align-top"
            >
              <td className="px-3 py-2.5 font-medium leading-6 text-foreground">
                {row.message}
              </td>
              <td className="px-3 py-2.5 leading-6 text-muted-foreground">
                {row.reason}
              </td>
              <td className="px-3 py-2.5 leading-6 text-foreground/90">
                {row.fix}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalysisErrorGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-10 gap-2 rounded-full border-border/80 bg-card/80 px-3 backdrop-blur-sm"
        aria-label="오류 대처 안내"
        title="오류 대처 안내"
      >
        <CircleHelp className="h-4 w-4" />
        <span className="hidden sm:inline">오류 안내</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>분석 오류 대처 안내</DialogTitle>
            <DialogDescription>
              분석은 입력 확인 → Google Patents 조회(SerpApi) → AI 분석(Gemini)
              순서로 진행됩니다. 단계마다 화면에 나오는 메시지가 다릅니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-1">
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                1. 입력·API 키
              </h3>
              <ErrorTable rows={KEY_ROWS} />
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                2. Google Patents 조회 (SerpApi)
              </h3>
              <ErrorTable rows={SERP_ROWS} />
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                3. AI 분석 (Gemini)
              </h3>
              <ErrorTable rows={GEMINI_ROWS} />
            </section>
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                4. 브라우저
              </h3>
              <ErrorTable rows={BROWSER_ROWS} />
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
