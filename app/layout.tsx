import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Box Office · 일일 박스오피스",
  description: "날짜별 영화 순위, 관객 수, 매출과 영화 상세정보를 확인하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
