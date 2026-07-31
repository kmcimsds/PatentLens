import type { Metadata } from "next";

import { ThemeProvider } from "@/contexts/theme-context";

import "./globals.css";

export const metadata: Metadata = {
  title: "PatentLens | 글로벌 특허 AI 요약/분석",
  description:
    "특허 번호 하나로 핵심 요약, 법적 상태, AI 추정 실험 조건을 확인하는 연구용 특허 분석 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
