'use client';

import React, { useState, useRef } from 'react';
import { Cut, SpeakerType } from '@/lib/types';
import {
  RotateCcw,
  Sparkles,
  Volume2,
  Film,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface Props {
  cut: Cut;
  onReroll: (cutId: string, mode: 'all' | 'video' | 'audio') => Promise<void>;
  onImageChange?: (cutId: string, imageUrl: string | null) => void;
  isProcessing: boolean;
}

export const CutCard: React.FC<Props> = ({
  cut,
  onReroll,
  onImageChange,
  isProcessing,
}) => {
  const [rerollMenuOpen, setRerollMenuOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cutId', cut.id);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '이미지 업로드 실패');
      }

      if (onImageChange) {
        onImageChange(cut.id, data.url);
      }
    } catch (err: any) {
      alert(`이미지 업로드 에러: ${err.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      await fetch(`/api/episodes?episodeId=${cut.episode_id}`); // refresh
      if (onImageChange) {
        onImageChange(cut.id, null);
      }
    } catch (e) {
      // ignore
    }
  };

  const getStatusBadge = () => {
    switch (cut.status) {
      case 'READY':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            READY
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600/40">
            <Clock className="w-3.5 h-3.5 mr-1" />
            PENDING
          </span>
        );
    }
  };

  const getSpeakerBadge = (speaker: SpeakerType) => {
    if (speaker === 'plue') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
          🐳 플루 (아기고래)
        </span>
      );
    }
    if (speaker === 'beom') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-700 text-slate-200 border border-slate-600">
          🐋 범 (공동창업자)
        </span>
      );
    }
    if (!speaker || speaker === 'none') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-slate-800 text-slate-400">
          무음 / 내레이션
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
        ✨ {speaker}
      </span>
    );
  };

  return (
    <div className="relative flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl transition hover:border-slate-700">
      {/* 컷 헤더 바 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black px-2 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
            #{cut.cut_order}
          </span>
          <span className="text-sm font-bold text-slate-200">{cut.cut_id}</span>
          {cut.is_flashback && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
              회상 (인디고톤)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">{getStatusBadge()}</div>
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-4 flex-1">
        {/* 좌측: 9:16 비디오 미리보기 및 레퍼런스 이미지 슬롯 */}
        <div className="flex flex-col gap-2 w-full md:w-44 flex-shrink-0">
          {/* 9:16 비디오 플레이어 */}
          <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center group shadow-inner">
            {cut.video_url ? (
              <video
                src={cut.video_url}
                className={`w-full h-full object-cover ${
                  cut.is_flashback ? 'filter contrast-110 saturate-50 hue-rotate-[210deg]' : ''
                }`}
                controls
                muted
                playsInline
              />
            ) : cut.status === 'PROCESSING' ? (
              <div className="flex flex-col items-center justify-center p-3 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                <span className="text-xs text-blue-300 font-bold">Kling I2V 생성 중...</span>
                <span className="text-[10px] text-slate-500 mt-1">6초 간격 폴링</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-600 p-2 text-center">
                <Film className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium">9:16 무음 비디오</span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {cut.duration_target}s 예정
                </span>
              </div>
            )}

            {/* 오버레이 종류 뱃지 */}
            {cut.overlay_type && (
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-md">
                  {cut.overlay_type.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* I2V 시작 기준 이미지 (First Frame) 슬롯 */}
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-300 flex items-center">
                <ImageIcon className="w-3 h-3 mr-1 text-cyan-400" />
                I2V 기준 이미지
              </span>
              {cut.image_url ? (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                  title="개별 이미지 삭제 (기본 대표 이미지 사용)"
                >
                  초기화
                </button>
              ) : (
                <span className="text-[10px] text-slate-500">기본에셋</span>
              )}
            </div>

            {cut.image_url ? (
              <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-700 group mb-1.5">
                <img
                  src={cut.image_url}
                  alt="I2V reference"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition"
                >
                  이미지 교체
                </button>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 mb-1.5 leading-tight">
                {cut.speaker === 'plue' ? '🐳 플루 기본 대표 이미지 자동 매핑' : cut.speaker === 'beom' ? '🐋 범 기본 대표 이미지 자동 매핑' : '기본 캐릭터 적용'}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 font-bold text-[10px] flex items-center justify-center space-x-1 transition disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>업로드 중...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 text-cyan-400" />
                  <span>{cut.image_url ? '기준 이미지 교체' : '이 컷 전용 이미지 첨부'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 우측: 대사/오디오/서류카드 인스펙터 */}
        <div className="flex flex-col justify-between flex-1 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {getSpeakerBadge(cut.speaker)}
              <span className="text-xs text-slate-400 font-mono">
                길이: {formatDuration(cut.audio_duration || cut.duration_target)}
              </span>
            </div>

            {/* 대사 텍스트 */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center">
                <FileText className="w-3 h-3 mr-1 text-slate-400" />
                대사 / 내레이션
              </div>
              <p className="text-sm font-bold text-white leading-relaxed">
                "{cut.script_text}"
              </p>
            </div>

            {/* 비주얼 프롬프트 (Kling 전송용) */}
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-400">
              <div className="text-[10px] font-semibold text-slate-500 mb-0.5 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-cyan-400" />
                Kling 모션 프롬프트
              </div>
              <p className="line-clamp-2 text-slate-300 font-mono text-[11px]">
                {cut.visual_prompt}
              </p>
            </div>

            {/* 서류 카드 페이로드 미리보기 */}
            {cut.overlay_payload && (
              <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-200">
                <span className="font-bold text-blue-300">📄 서류 카드: </span>
                {cut.overlay_payload.title} - {cut.overlay_payload.highlight}
              </div>
            )}

            {/* 오디오 플레이어 컨트롤 */}
            {cut.audio_url && (
              <div className="flex items-center space-x-2 pt-1">
                <audio
                  src={cut.audio_url}
                  controls
                  className="h-8 w-full rounded-lg filter invert hue-rotate-180 opacity-80"
                />
              </div>
            )}

            {/* 에러 메시지 */}
            {cut.error_message && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/50 text-xs text-red-300 flex items-start space-x-1.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{cut.error_message}</span>
              </div>
            )}
          </div>

          {/* 하단 Re-roll 컨트롤 버튼 */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {cut.status === 'READY' ? '검수 완료' : '생성 대기'}
            </div>

            <div className="relative">
              <button
                type="button"
                disabled={isProcessing || cut.status === 'PROCESSING'}
                onClick={() => setRerollMenuOpen(!rerollMenuOpen)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>이 컷만 다시 생성 (Re-roll)</span>
              </button>

              {rerollMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-30">
                  <button
                    onClick={() => {
                      setRerollMenuOpen(false);
                      onReroll(cut.id, 'all');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-blue-600 hover:text-white transition flex items-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-cyan-400" />
                    전체 재생성 (음성+비디오)
                  </button>
                  <button
                    onClick={() => {
                      setRerollMenuOpen(false);
                      onReroll(cut.id, 'video');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-blue-600 hover:text-white transition flex items-center"
                  >
                    <Film className="w-3.5 h-3.5 mr-2 text-amber-400" />
                    Kling 비디오만 다시 생성 (I2V)
                  </button>
                  <button
                    onClick={() => {
                      setRerollMenuOpen(false);
                      onReroll(cut.id, 'audio');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-blue-600 hover:text-white transition flex items-center"
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                    Typecast 음성만 다시 생성
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
