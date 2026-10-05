'use client';

import React, { useRef, useState } from 'react';
import { CharacterAssets } from '@/lib/types';
import { Image as ImageIcon, Upload, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface Props {
  assets: CharacterAssets;
  onAssetUpdated: (type: 'plue' | 'beom' | 'flashback', url: string) => void;
}

export const CharacterAssetBar: React.FC<Props> = ({ assets, onAssetUpdated }) => {
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const fileInputRefs = {
    plue: useRef<HTMLInputElement>(null),
    beom: useRef<HTMLInputElement>(null),
    flashback: useRef<HTMLInputElement>(null),
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'plue' | 'beom' | 'flashback'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('characterType', type);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '업로드 실패');
      }

      onAssetUpdated(type, data.url);
    } catch (err: any) {
      alert(`이미지 업로드 오류: ${err.message}`);
    } finally {
      setUploadingType(null);
      if (fileInputRefs[type].current) {
        fileInputRefs[type].current.value = '';
      }
    }
  };

  const characterCards = [
    {
      key: 'plue' as const,
      name: '플루 (주인공)',
      emoji: '🐳',
      desc: '광택 있는 3D 파란 아기 대왕고래',
      url: assets.plue,
      badgeColor: 'border-blue-500/40 bg-blue-950/40 text-blue-300',
    },
    {
      key: 'beom' as const,
      name: '범 (공동창업자)',
      emoji: '🐋',
      desc: '날렵한 3D 흑백 범고래',
      url: assets.beom,
      badgeColor: 'border-slate-600 bg-slate-900/60 text-slate-300',
    },
    {
      key: 'flashback' as const,
      name: '회상 씬 플루',
      emoji: '🌫️',
      desc: '인디고 톤 & 비네팅 1회차 과거 씬',
      url: assets.flashback,
      badgeColor: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-300',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              캐릭터 일관성 레퍼런스 에셋 (Kling I2V 고정 기준)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Image-to-Video 자동 주입
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              각 캐릭터의 기준 이미지를 등록해 두면, Kling이 컷마다 동일한 외형과 화풍을 100% 유지하며 비디오를 생성합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {characterCards.map((card) => {
          const isUploading = uploadingType === card.key;

          return (
            <div
              key={card.key}
              className="relative flex items-center p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
            >
              {/* 이미지 썸네일 */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 flex-shrink-0 flex items-center justify-center mr-3 group">
                {card.url ? (
                  <img
                    src={card.url}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                    <span className="text-xl mb-0.5">{card.emoji}</span>
                    <span className="text-[9px]">미등록</span>
                  </div>
                )}

                {/* 마우스 호버 오버레이 */}
                <button
                  type="button"
                  onClick={() => fileInputRefs[card.key].current?.click()}
                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition text-[10px] font-bold"
                  title="이미지 변경"
                >
                  <Upload className="w-3.5 h-3.5 mb-0.5" />
                  <span>변경</span>
                </button>
              </div>

              {/* 텍스트 및 상태 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-200 truncate">
                    {card.emoji} {card.name}
                  </span>
                  {card.url ? (
                    <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> 기준고정
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] text-slate-500">
                      T2V 폴백
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mb-2">{card.desc}</p>

                {/* 업로드 버튼 */}
                <input
                  ref={fileInputRefs[card.key]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, card.key)}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRefs[card.key].current?.click()}
                  className="w-full py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-semibold transition flex items-center justify-center space-x-1 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>업로드 중...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 text-cyan-400" />
                      <span>{card.url ? '기준 이미지 변경' : '기준 이미지 등록'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
