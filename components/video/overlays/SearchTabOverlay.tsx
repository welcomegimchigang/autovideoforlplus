import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OverlayPayload } from '@/lib/types';

interface Props {
  payload?: OverlayPayload | null;
}

export const SearchTabOverlay: React.FC<Props> = ({ payload }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  const queryText = payload?.highlight || '샤크벤처캐피탈 대표 먹튀 사기';
  // 타이핑 효과 (프레임에 맞춰 글자가 써짐)
  const charsShown = Math.floor(
    interpolate(frame, [5, 25], [0, queryText.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '280px',
        left: '50px',
        right: '50px',
        transform: `scale(${scale})`,
      }}
      className="p-6 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200 text-slate-800"
    >
      <div className="flex items-center space-x-2 mb-4">
        <span className="w-3 h-3 rounded-full bg-red-400"></span>
        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
        <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
        <span className="text-xs font-mono text-slate-400 pl-2">ocean-search.com</span>
      </div>

      {/* 검색창 */}
      <div className="flex items-center px-4 py-3 rounded-xl bg-slate-100 border-2 border-blue-500 mb-4 shadow-inner">
        <span className="text-blue-500 mr-2">🔍</span>
        <span className="font-bold text-slate-900 text-sm tracking-tight">
          {queryText.slice(0, charsShown)}
          {charsShown < queryText.length && <span className="animate-pulse">|</span>}
        </span>
      </div>

      {/* 검색 연관 결과 박스 */}
      <div className="space-y-2 text-xs">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
          <div className="font-bold text-red-600 mb-0.5">⚠️ 금융감독원 긴급 경보</div>
          <div>{payload?.subtitle || '투자금 유치 후 잠적 수법 다수 피해 접수'}</div>
        </div>
      </div>
    </div>
  );
};
