import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/server/api-error";
import { analyzePatent } from "@/lib/server/patent-service";
import { checkRateLimit, getClientIp } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const RequestSchema = z.object({
  patentNumber: z.string().trim().min(1).max(32),
  serpApiKey: z.string().trim().min(1).max(256).optional(),
  geminiApiKey: z.string().trim().min(1).max(256).optional(),
});

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(clientIp);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message:
              "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요. (분당 분석 횟수 제한)",
            retryable: true,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSec ?? 60),
          },
        }
      );
    }

    const json: unknown = await request.json();
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PATENT_NUMBER",
            message:
              "특허 번호 형식을 확인해 주세요. 예: US10123456B2, KR20070116676A",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const data = await analyzePatent(parsed.data.patentNumber, {
      serpApiKey: parsed.data.serpApiKey,
      geminiApiKey: parsed.data.geminiApiKey,
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        },
        {
          status: error.status,
          headers: error.status === 429 ? { "Retry-After": "60" } : undefined,
        }
      );
    }

    console.error("Unexpected patent analysis error", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        error: {
          code: "ANALYSIS_FAILED",
          message: "특허 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
          retryable: true,
        },
      },
      { status: 500 }
    );
  }
}
