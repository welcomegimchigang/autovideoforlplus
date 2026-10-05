'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { MainComposition } from '@/components/video/MainComposition';
import { Cut } from '@/lib/types';
import { X, Download, Film, CheckCircle2, Sparkles, Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cuts: Cut[];
  episodeId: string;
}

export const RemotionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  cuts,
  episodeId,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // 전체 오디오 기반 총 프레임 수 계산 (30fps 기준)
  const totalFrames = Math.max(
    30,
    cuts.reduce((sum, cut) => {
      const dur = cut.audio_duration && cut.audio_duration > 0
        ? cut.audio_duration
        : cut.duration_target || 5.0;
      return sum + Math.ceil(dur * 30);
    }, 0)
  );

  const totalSeconds = (totalFrames / 30).toFixed(1);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      window.open(
        `/api/mock-media?type=video&name=${episodeId}_final_shorts.mp4`,
        '_blank'
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 모달 상단 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <Film className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">
              Remotion 9:16 세로형 숏폼 최종 렌더 프리뷰 ({episodeId})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 (좌측: 9:16 Remotion Player, 우측: 메타데이터 & 인포) */}
        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto items-center justify-center">
          {/* 9:16 비디오 플레이어 컨테이너 */}
          <div className="relative w-[280px] sm:w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-black flex-shrink-0">
            <Player
              component={MainComposition}
              inputProps={{ cuts }}
              durationInFrames={totalFrames}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={30}
              controls
              autoPlay
              loop
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>

          {/* 우측 인포 패널 */}
          <div className="flex flex-col justify-between space-y-5 flex-1">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                모든 컷 합성 완료
              </div>

              <h3 className="text-2xl font-black text-white leading-tight">
                가변 타임라인 오디오 싱크 컴포지션 완성
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">총 영상 길이</div>
                  <div className="text-lg font-black text-white">{totalSeconds}초</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">총 렌더 프레임</div>
                  <div className="text-lg font-black text-cyan-400">{totalFrames} frames</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">해상도</div>
                  <div className="text-lg font-black text-white">1080 × 1920 (9:16)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">프레임레이트</div>
                  <div className="text-lg font-black text-white">30 FPS</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  합성된 가드레일 요소
                </div>
                <p>• Typecast TTS 오디오 싱크 기반 가변 프레임 타임라인 적용</p>
                <p>• 회상(1회차) 컷 인디고 채도 저하 및 비네팅 필터 합성</p>
                <p>• 서류 카드 컴포넌트 (계약서, 등기부등본, 33% 차트) 오버레이</p>
                <p>• 쇼츠 세이프존 (top: 1280px) 볼드 자막 및 발화자 뱃지</p>
                <p>• 우측 상단 'AI 생성' 필수 워터마크 고정</p>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'MP4 패키징 중...' : '최종 1080×1920 MP4 다운로드'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
