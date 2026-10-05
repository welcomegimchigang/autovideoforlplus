import React from 'react';
import { SpeakerType } from '@/lib/types';

interface Props {
  text: string;
  speaker: SpeakerType;
}

export const Subtitle: React.FC<Props> = ({ text, speaker }) => {
  if (!text) return null;

  const speakerName = speaker === 'plue' ? '🐳 플루' : speaker === 'beom' ? '🐋 범' : null;
  const speakerBadgeColor =
    speaker === 'plue'
      ? 'bg-blue-600/90 text-blue-100 border-blue-400/50'
      : 'bg-slate-800/90 text-slate-100 border-slate-600/50';

  return (
    <div
      style={{
        position: 'absolute',
        top: '1280px', // 쇼츠 하단 25% UI 침범 방지 세이프존 위치
        left: '40px',
        right: '40px',
        zIndex: 40,
        pointerEvents: 'none',
      }}
      className="flex flex-col items-center justify-center text-center"
    >
      {speakerName && (
        <span
          className={`px-4 py-1.5 rounded-full text-lg font-black border mb-3 shadow-lg ${speakerBadgeColor}`}
        >
          {speakerName}
        </span>
      )}

      <div className="px-6 py-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl max-w-[95%]">
        <p
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.6)',
            wordBreak: 'keep-all',
          }}
          className="text-3xl md:text-4xl font-black text-white leading-snug tracking-tight"
        >
          {text}
        </p>
      </div>
    </div>
  );
};
