import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OverlayPayload } from '@/lib/types';

interface Props {
  payload?: OverlayPayload | null;
}

export const Graph33Overlay: React.FC<Props> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  const percentage = Math.min(33.4, Math.round(progress * 33.4 * 10) / 10);

  return (
    <div
      style={{
        position: 'absolute',
        top: '260px',
        left: '50px',
        right: '50px',
      }}
      className="p-7 rounded-3xl bg-gradient-to-br from-blue-950/90 to-indigo-950/95 backdrop-blur-xl border-2 border-blue-400/50 shadow-2xl text-white text-center"
    >
      <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold mb-3 border border-blue-400/30">
        {payload?.badge || '상법 제434조 특별결의 거부권'}
      </div>

      <h3 className="text-2xl font-black text-white mb-1">
        {payload?.title || '황금 거부권 33.4% 사수'}
      </h3>
      <p className="text-xs text-blue-200/80 mb-6">{payload?.subtitle || '적대적 M&A 방어선'}</p>

      {/* 원형 게이지 & 지분율 */}
      <div className="relative w-44 h-44 mx-auto mb-4 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-800"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke="url(#gradient)"
            strokeWidth="10"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * (percentage / 100))}
            strokeLinecap="round"
            fill="transparent"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            {percentage}%
          </span>
          <span className="text-[11px] font-bold text-blue-200">플루 & 범 지분</span>
        </div>
      </div>

      <div className="p-3 bg-blue-900/30 rounded-xl border border-blue-500/30 text-xs font-semibold text-blue-100">
        {payload?.highlight || '33.4% 이상 보유 시 정관 변경 및 합병 단독 거부 가능!'}
      </div>
    </div>
  );
};
