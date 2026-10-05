'use client';

import React, { useRef, useState } from 'react';
import { CharacterAssets, CharacterItem } from '@/lib/types';
import {
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  X,
  UserPlus,
} from 'lucide-react';

interface Props {
  assets: CharacterAssets;
  onAssetUpdated: (type: string, url: string) => void;
  onRefresh?: () => void;
}

const DEFAULT_EMOJIS = ['🐯', '🦁', '🦊', '🐰', '🐶', '🐱', '🐻', '🦈', '🐬', '🐙', '🦖', '🌟'];

export const CharacterAssetBar: React.FC<Props> = ({ assets, onAssetUpdated, onRefresh }) => {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐯');
  const [isSaving, setIsSaving] = useState(false);

  // 동적 파일 인풋 관리
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    characterKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(characterKey);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('characterType', characterKey);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '업로드 실패');
      }

      onAssetUpdated(characterKey, data.url);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`이미지 업로드 오류: ${err.message}`);
    } finally {
      setUploadingType(null);
      if (fileInputRefs.current[characterKey]) {
        fileInputRefs.current[characterKey]!.value = '';
      }
    }
  };

  // 신규 캐릭터 추가 핸들러
  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCharName.trim();
    if (!trimmedName) {
      alert('캐릭터 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const charId = `char_${Date.now()}`;
      const newChar: CharacterItem = {
        id: charId,
        name: trimmedName,
        desc: newCharDesc.trim() || `${trimmedName} 캐릭터`,
        emoji: selectedEmoji,
        url: null,
        isFixed: false,
      };

      const currentCustom = assets.custom || [];
      const updatedCustom = [...currentCustom, newChar];

      const res = await fetch('/api/character-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom: updatedCustom }),
      });

      if (!res.ok) {
        throw new Error('캐릭터 저장에 실패했습니다.');
      }

      setNewCharName('');
      setNewCharDesc('');
      setIsAddModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`캐릭터 추가 오류: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 캐릭터 삭제 핸들러 (커스텀 캐릭터만)
  const handleDeleteCharacter = async (charId: string, charName: string) => {
    if (!confirm(`'${charName}' 캐릭터를 목록에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const currentCustom = assets.custom || [];
      const updatedCustom = currentCustom.filter((c) => c.id !== charId);

      const res = await fetch('/api/character-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom: updatedCustom }),
      });

      if (!res.ok) {
        throw new Error('캐릭터 삭제 실패');
      }

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`캐릭터 삭제 오류: ${err.message}`);
    }
  };

  // 기본 고정 캐릭터 2명 (플루, 범)
  const fixedCharacters: CharacterItem[] = [
    {
      id: 'plue',
      name: '플루 (주인공)',
      emoji: '🐳',
      desc: '광택 있는 3D 파란 아기 대왕고래',
      url: assets.plue,
      isFixed: true,
    },
    {
      id: 'beom',
      name: '범 (공동창업자)',
      emoji: '🐋',
      desc: '날렵한 3D 흑백 범고래',
      url: assets.beom,
      isFixed: true,
    },
  ];

  // 사용자 추가 커스텀 캐릭터 목록 (예: 어흥이 등)
  const customCharacters: CharacterItem[] = assets.custom || [];

  const allCharacters = [...fixedCharacters, ...customCharacters];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl mb-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800 gap-3">
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
              플루와 범 및 추가 인물의 기준 이미지를 등록해 두면, Kling이 컷마다 동일한 외형과 화풍을 100% 유지하며 영상을 생성합니다.
            </p>
          </div>
        </div>

        {/* 신규 캐릭터 추가 버튼 */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ 캐릭터 추가</span>
        </button>
      </div>

      {/* 캐릭터 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCharacters.map((char) => {
          const isUploading = uploadingType === char.id;

          return (
            <div
              key={char.id}
              className="relative flex items-center p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition group/card"
            >
              {/* 커스텀 캐릭터 삭제 버튼 (우측 상단) */}
              {!char.isFixed && (
                <button
                  type="button"
                  onClick={() => handleDeleteCharacter(char.id, char.name)}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-900 transition opacity-0 group-hover/card:opacity-100"
                  title="캐릭터 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 이미지 썸네일 */}
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 flex-shrink-0 flex items-center justify-center mr-3 group">
                {char.url ? (
                  <img
                    src={char.url}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                    <span className="text-xl mb-0.5">{char.emoji || '👤'}</span>
                    <span className="text-[9px]">미등록</span>
                  </div>
                )}

                {/* 마우스 호버 오버레이 */}
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[char.id]?.click()}
                  className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition text-[10px] font-bold"
                  title="이미지 변경"
                >
                  <Upload className="w-3.5 h-3.5 mb-0.5" />
                  <span>변경</span>
                </button>
              </div>

              {/* 텍스트 및 상태 */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-slate-200 truncate">
                    {char.emoji || '👤'} {char.name}
                  </span>
                  {char.url ? (
                    <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold ml-1">
                      <CheckCircle2 className="w-3 h-3 mr-0.5" /> 기준고정
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] text-slate-500 ml-1">
                      T2V 폴백
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mb-2">
                  {char.desc || '레퍼런스 이미지 미등록'}
                </p>

                {/* 업로드 버튼 */}
                <input
                  ref={(el) => {
                    fileInputRefs.current[char.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, char.id)}
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[char.id]?.click()}
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
                      <span>{char.url ? '기준 이미지 변경' : '기준 이미지 등록'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 캐릭터 추가 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
                <UserPlus className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-white">새 캐릭터 등록</h4>
            </div>

            <form onSubmit={handleAddCharacter} className="space-y-4">
              {/* 캐릭터 이름 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  캐릭터 이름 <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 어흥이, 샤크 대표 등"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              {/* 이모지 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  아이콘 이모지 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition border ${
                        selectedEmoji === emoji
                          ? 'bg-cyan-500/20 border-cyan-500 text-white scale-110'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* 설명 / 특징 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  캐릭터 외형/성격 특징 (프롬프트 참고용)
                </label>
                <input
                  type="text"
                  placeholder="예: 3D 귀여운 아기 호랑이, 주황색 줄무늬"
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newCharName.trim()}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>등록하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
