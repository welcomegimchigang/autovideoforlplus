'use client';

import React from 'react';
import { Cut } from '@/lib/types';
import { Play, Pause, Film, CheckCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';

interface Props {
  cuts: Cut[];
  isQueueRunning: boolean;
  onToggleQueue: () => void;
  onOpenRenderModal: () => void;
  isRendering: boolean;
}

export const PipelineProgress: React.FC<Props> = ({
  cuts,
  isQueueRunning,
  onToggleQueue,
  onOpenRenderModal,
  isRendering,
}) => {
  const totalCuts = cuts.length;
  const readyCuts = cuts.filter((c) => c.status === 'READY').length;
  const processingCuts = cuts.filter((c) => c.status === 'PROCESSING').length;
  const pendingCuts = cuts.filter((c) => c.status === 'PENDING').length;
  const failedCuts = cuts.filter((c) => c.status === 'FAILED').length;

  const progressPercent = totalCuts > 0 ? Math.round((readyCuts / totalCuts) * 100) : 0;
  const allReady = totalCuts > 0 && readyCuts === totalCuts;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* 진행 통계 */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg font-black text-white">자동화 파이프라인 진행 상태</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {readyCuts} / {totalCuts} 컷 완료 ({progressPercent}%)
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="text-emerald-400">READY: {readyCuts}</span>
              <span className="text-amber-400">PROCESSING: {processingCuts}</span>
              <span className="text-slate-400">PENDING: {pendingCuts}</span>
              {failedCuts > 0 && <span className="text-red-400 font-bold">FAILED: {failedCuts}</span>}
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500 shadow-lg shadow-cyan-500/20"
            />
          </div>
        </div>

        {/* 액션 버튼 컨트롤러 */}
        <div className="flex items-center gap-3">
          {/* 1개씩 순차 생성 시작 / 정지 버튼 */}
          <button
            type="button"
            onClick={onToggleQueue}
            disabled={totalCuts === 0 || allReady}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-black text-sm transition shadow-lg ${
              isQueueRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {isQueueRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>순차 생성 일시정지</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>1개씩 순차 생성 시작</span>
              </>
            )}
          </button>

          {/* 최종 영상 합치기 & MP4 출력 버튼 (모든 컷이 READY일 때 활성화) */}
          <button
            type="button"
            onClick={onOpenRenderModal}
            disabled={!allReady || isRendering}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black text-sm transition shadow-xl ${
              allReady
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isRendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Remotion 렌더링 중...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                <span>최종 영상 합치기 & MP4 출력</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
