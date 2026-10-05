'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CharacterAssetBar } from '@/components/admin/CharacterAssetBar';
import { CutCard } from '@/components/admin/CutCard';
import { PipelineProgress } from '@/components/admin/PipelineProgress';
import { ScriptInputModal } from '@/components/admin/ScriptInputModal';
import { RemotionModal } from '@/components/admin/RemotionModal';
import { CharacterAssets, Cut, Episode } from '@/lib/types';
import {
  Sparkles,
  Layers,
  LogOut,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>('EP.00');
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [characterAssets, setCharacterAssets] = useState<CharacterAssets>({
    plue: null,
    beom: null,
    flashback: null,
  });
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isRemotionModalOpen, setIsRemotionModalOpen] = useState(false);

  // 파이프라인 순차 큐 제어기 상태
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const queueLoopRef = useRef<boolean>(false);

  // 에피소드 및 컷 목록 조회
  const fetchCuts = async (epId = currentEpisodeId) => {
    try {
      const res = await fetch(`/api/episodes?episodeId=${epId}`);
      if (res.ok) {
        const data = await res.json();
        setCuts(data.cuts || []);
      }
    } catch (e) {
      console.error('Failed to fetch cuts:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const res = await fetch('/api/episodes');
      if (res.ok) {
        const data = await res.json();
        if (data.episodes && data.episodes.length > 0) {
          setEpisodes(data.episodes);
          if (!currentEpisodeId || currentEpisodeId === 'EP.00') {
            setCurrentEpisodeId(data.episodes[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch episodes:', e);
    }
  };

  const fetchCharacterAssets = async () => {
    try {
      const res = await fetch('/api/character-assets');
      if (res.ok) {
        const data = await res.json();
        if (data.assets) {
          setCharacterAssets(data.assets);
        }
      }
    } catch (e) {
      console.error('Failed to fetch character assets:', e);
    }
  };

  useEffect(() => {
    fetchEpisodes();
    fetchCuts();
    fetchCharacterAssets();
  }, [currentEpisodeId]);

  // 실시간 컷 상태 주기적 동기화 (3초 간격)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCuts();
    }, 3000);
    return () => clearInterval(timer);
  }, [currentEpisodeId]);

  // 1개씩 순차 처리 워커 루프
  const startSequentialQueue = async () => {
    setIsQueueRunning(true);
    queueLoopRef.current = true;

    while (queueLoopRef.current) {
      try {
        const res = await fetch('/api/process-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episodeId: currentEpisodeId }),
        });

        const data = await res.json();
        await fetchCuts(currentEpisodeId);

        // 큐가 모두 비었거나 에러 시 루프 종료
        if (!data.has_pending || !res.ok) {
          console.log('[Queue] Finished or paused:', data.message || data.error);
          break;
        }
      } catch (err) {
        console.error('[Queue Loop Error]:', err);
        break;
      }

      // 워커 호출 간 1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsQueueRunning(false);
    queueLoopRef.current = false;
  };

  const stopSequentialQueue = () => {
    queueLoopRef.current = false;
    setIsQueueRunning(false);
  };

  const handleToggleQueue = () => {
    if (isQueueRunning) {
      stopSequentialQueue();
    } else {
      startSequentialQueue();
    }
  };

  // 단일 컷 Re-roll 핸들러
  const handleRerollCut = async (cutId: string, mode: 'all' | 'video' | 'audio') => {
    try {
      // 낙관적 UI 업데이트
      setCuts((prev) =>
        prev.map((c) => (c.id === cutId ? { ...c, status: 'PROCESSING' } : c))
      );

      const res = await fetch('/api/reroll-cut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutId,
          episodeId: currentEpisodeId,
          mode,
        }),
      });

      if (res.ok) {
        await fetchCuts(currentEpisodeId);
      }
    } catch (e) {
      console.error('Reroll failed:', e);
      await fetchCuts(currentEpisodeId);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  // 대본 파싱 완료 콜백
  const handleScriptParsed = (result: any) => {
    if (result.episode) {
      setCurrentEpisodeId(result.episode.id);
      setEpisodes((prev) => [result.episode, ...prev.filter((e) => e.id !== result.episode.id)]);
    }
    if (result.cuts) {
      setCuts(result.cuts);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg">
                🐳
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-base tracking-tight">
                  PLUE SHORTS AUTO-PIPELINE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  STUDIO v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Claude 3.5 Head • Typecast Voice • Kling 9:16 I2V • Remotion Synth
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 새 에피소드 대본 입력 버튼 */}
            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-500/20 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>대본 입력 & 헤드 에이전트 실행</span>
            </button>

            {/* 새로고침 */}
            <button
              onClick={() => fetchCuts()}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 대시보드 메인 본문 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 캐릭터 일관성 레퍼런스 에셋 바 */}
        <CharacterAssetBar
          assets={characterAssets}
          onAssetUpdated={(type, url) => {
            setCharacterAssets((prev) => ({ ...prev, [type]: url }));
          }}
        />

        {/* 파이프라인 진행 상태 및 컨트롤 바 */}
        <PipelineProgress
          cuts={cuts}
          isQueueRunning={isQueueRunning}
          onToggleQueue={handleToggleQueue}
          onOpenRenderModal={() => setIsRemotionModalOpen(true)}
          isRendering={isRendering}
        />

        {/* 컷 목록 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-black text-white">
              에피소드 컷시트 검수 & 9:16 모니터링 ({cuts.length} cuts)
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
              9:16 비디오/오디오/서류카드/I2V 결합
            </span>
          </div>
        </div>

        {/* 컷 목록이 비어있을 때 */}
        {cuts.length === 0 && !loading && (
          <div className="p-12 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/50 flex items-center justify-center text-3xl mb-4 border border-blue-800/40">
              📜
            </div>
            <h3 className="text-lg font-bold text-white mb-2">등록된 컷시트가 없습니다</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              [대본 입력 & 헤드 에이전트 실행] 버튼을 클릭하여 웹소설 대본을 입력하면,
              Claude 3.5 Sonnet이 자동으로 컷시트를 분해하고 3D 프롬프트와 서류 카드를 세팅합니다.
            </p>
            <button
              onClick={() => setIsScriptModalOpen(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>대본 입력 및 헤드 에이전트 시작하기</span>
            </button>
          </div>
        )}

        {/* 컷 그리드 (2열 반응형 그리드) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cuts.map((cut) => (
            <CutCard
              key={cut.id}
              cut={cut}
              onReroll={handleRerollCut}
              onImageChange={(cutId, url) => {
                setCuts((prev) =>
                  prev.map((c) => (c.id === cutId ? { ...c, image_url: url } : c))
                );
              }}
              isProcessing={isQueueRunning}
            />
          ))}
        </div>
      </main>

      {/* 대본 입력 모달 */}
      <ScriptInputModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onParsed={handleScriptParsed}
      />

      {/* Remotion 최종 렌더 & 프리뷰 모달 */}
      <RemotionModal
        isOpen={isRemotionModalOpen}
        onClose={() => setIsRemotionModalOpen(false)}
        cuts={cuts}
        episodeId={currentEpisodeId}
      />
    </div>
  );
}
