'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, Send, X, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onParsed: (result: any) => void;
}

const SAMPLE_SCRIPT = `[EP.00: 회귀한 아기 고래의 33% 지분 방어전]
(회상: 1회차 파멸의 기억)
플루(독백): "우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고...?"
플루의 눈앞에서 경영권 양도 계약서가 불타오르고, 샤크벤처스는 대표 자리를 빼앗아갔다.

(현실 복귀: 스타트업 사무실)
플루(독백): "하지만 눈을 떠보니... 투자 계약서 도장을 찍기 딱 3시간 전이다!"
범: "플루, 왜 멍하니 있어? 대표님 곧 오셔. 지금 서명 안 하면 이번 브릿지 투자 무산된다고!"
플루: "잠깐, 범아. 그 사람 등기부등본 확인해 봤어? 설립 3일 된 자본금 100만원짜리 페이퍼 컴퍼니야!"
플루: "우리의 지분 33.4%는 정관 변경과 합병을 막는 최후의 거부권이야. 1%도 양보 못 해!"`;

export const ScriptInputModal: React.FC<Props> = ({ isOpen, onClose, onParsed }) => {
  const [episodeId, setEpisodeId] = useState('EP.00');
  const [title, setTitle] = useState('회귀한 아기 고래의 33% 지분 방어전');
  const [script, setScript] = useState(SAMPLE_SCRIPT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parse-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          title,
          script,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '대본 파싱에 실패했습니다.');
      }

      onParsed(data);
      onClose();
    } catch (err: any) {
      setError(err?.message || '대본 처리 중 에러가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-white">헤드 에이전트 대본 파싱 (Claude 3.5 Sonnet)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">에피소드 ID</label>
              <input
                type="text"
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                placeholder="EP.00"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">에피소드 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="에피소드 제목 입력"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-400">웹소설 대본 텍스트</label>
              <button
                type="button"
                onClick={() => setScript(SAMPLE_SCRIPT)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>샘플 대본 불러오기</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-sans leading-relaxed focus:border-blue-500 focus:outline-none"
              placeholder="대본 전문을 입력하세요..."
              required
            />
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 space-y-1">
            <div className="font-bold text-blue-300">💡 헤드 에이전트 자동 주입 규칙</div>
            <p>• 3D 플루(아기 대왕고래) 및 범(범고래) 캐릭터 스타일 자동 적용</p>
            <p>• 회상 씬 감지 시 '인디고 톤 & 비네팅' 프롬프트 및 비디오 필터 부여</p>
            <p>• 계약서, 등기부등본, 33% 지분 차트 등 서류 카드 자동 분리</p>
            <p>• 무음 강제(silent clip) 및 네거티브 프롬프트 적용</p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-black shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Claude 3.5 컷시트 분해 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>에이전트 실행 (대본 파싱)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
