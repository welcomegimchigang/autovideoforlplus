import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '웹 기반 숏폼 영상 제작 완전 자동화 파이프라인 (Plue Shorts Studio)',
  description: '웹소설 원작 숏폼(60초 세로형 9:16) 제작 파이프라인 자동화 관리자 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
