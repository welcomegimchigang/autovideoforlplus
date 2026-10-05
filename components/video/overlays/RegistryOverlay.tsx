import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OverlayPayload } from '@/lib/types';

interface Props {
  payload?: OverlayPayload | null;
}

export const RegistryOverlay: React.FC<Props> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const translateY = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.9 },
  });

  const opacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '250px',
        left: '50px',
        right: '50px',
        opacity,
        transform: `translateY(${(1 - translateY) * 40}px)`,
      }}
      className="p-7 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl text-white font-mono"
    >
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
          <span className="text-xs font-bold text-amber-400">대법원 인터넷등기소 열람용</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
          {payload?.badge || '유령 페이퍼 컴퍼니'}
        </span>
      </div>

      <h3 className="text-xl font-black text-amber-300 mb-1">
        {payload?.title || '법인 등기사항전부증명서 (말소사항 포함)'}
      </h3>
      <p className="text-xs text-slate-400 mb-4">{payload?.subtitle || '상호: (주)샤크벤처스피탈'}</p>

      {/* 등기 내역 테이블 */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-2 mb-3">
        <div className="flex justify-between border-b border-slate-800 pb-1 text-slate-400">
          <span>등기 항목</span>
          <span>내용</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">법인설립연월일</span>
          <span className="text-red-400 font-bold">2026년 10월 02일 (설립 3일차)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">자본금의 총액</span>
          <span className="text-red-400 font-bold">금 1,000,000원</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">대표이사</span>
          <span className="text-amber-200">김샤크 (바지사장 의심)</span>
        </div>
      </div>

      <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl">
        <div className="text-xs text-red-300 font-bold">
          [플루의 통찰]: {payload?.highlight || '설립 3일 된 자본금 100만원짜리 페이퍼 컴퍼니!'}
        </div>
      </div>
    </div>
  );
};
