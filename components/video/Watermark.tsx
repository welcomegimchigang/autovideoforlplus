import React from 'react';

export const Watermark: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        right: '50px',
        zIndex: 50,
      }}
      className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg pointer-events-none"
    >
      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
      <span className="text-base font-extrabold tracking-wide text-slate-100">AI 생성</span>
    </div>
  );
};
