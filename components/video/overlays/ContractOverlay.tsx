import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OverlayPayload } from '@/lib/types';

interface Props {
  payload?: OverlayPayload | null;
}

export const ContractOverlay: React.FC<Props> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 등장 스프링 애니메이션
  const scale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const stampScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '260px',
        left: '54px',
        right: '54px',
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
      className="p-8 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border-2 border-red-500/40 text-slate-900"
    >
      {/* 상단 뱃지 */}
      <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-200">
        <span className="px-3 py-1 bg-red-600 text-white font-extrabold text-xs tracking-wider rounded-md uppercase">
          {payload?.badge || '불공정 계약서 발견'}
        </span>
        <span className="text-xs text-slate-500 font-mono">DOC-NO. 2026-OCEAN-88</span>
      </div>

      {/* 계약서 본문 */}
      <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight">
        {payload?.title || '경영권 포기 및 신주발행 동의서'}
      </h3>
      <p className="text-sm font-semibold text-slate-600 mb-5">
        {payload?.subtitle || '오션 홀딩스(갑) ↔ 플루 테크놀로지(을)'}
      </p>

      {/* 핵심 독소 조항 하이라이트 박스 */}
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
        <div className="text-xs font-bold text-red-600 mb-1">제 7조 [의결권 백지위임]</div>
        <div className="text-sm font-black text-red-950 underline decoration-red-500 decoration-2">
          {payload?.highlight || '지분율 33% → 4.9%로 일방적 희석 및 대표이사 사임 조항'}
        </div>
      </div>

      {/* 하단 인감 도장 (쾅 찍히는 효과) */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-400">날짜: 2026년 10월 05일</div>
        {frame > 15 && (
          <div
            style={{
              transform: `scale(${Math.max(0, stampScale)}) rotate(-12deg)`,
            }}
            className="w-16 h-16 rounded-full border-4 border-red-600 flex items-center justify-center text-red-600 font-black text-xs shadow-lg bg-red-50/50"
          >
            무효확인
          </div>
        )}
      </div>
    </div>
  );
};
