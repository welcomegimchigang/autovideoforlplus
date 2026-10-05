import React from 'react';
import {
  Audio,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
  AbsoluteFill,
} from 'remotion';
import { Cut } from '@/lib/types';
import { Watermark } from './Watermark';
import { Subtitle } from './Subtitle';
import { ContractOverlay } from './overlays/ContractOverlay';
import { RegistryOverlay } from './overlays/RegistryOverlay';
import { Graph33Overlay } from './overlays/Graph33Overlay';
import { SearchTabOverlay } from './overlays/SearchTabOverlay';

export interface MainCompositionProps {
  cuts: Cut[];
}

export const MainComposition: React.FC<MainCompositionProps> = ({ cuts = [] }) => {
  const { fps } = useVideoConfig();

  // 컷들의 프레임 시작점 누적 계산
  let currentStartFrame = 0;

  return (
    <AbsoluteFill className="bg-slate-950 overflow-hidden font-sans">
      {cuts.map((cut) => {
        // 1. Audio-Driven Timeline: 오디오 길이를 우선하여 프레임 동적 결정
        const targetSeconds = cut.audio_duration && cut.audio_duration > 0
          ? cut.audio_duration
          : cut.duration_target || 5.0;

        const durationInFrames = Math.max(15, Math.ceil(targetSeconds * fps));
        const cutStart = currentStartFrame;
        currentStartFrame += durationInFrames;

        // 2. 비디오 싱크 보정: 오디오보다 비디오 생성 길이가 짧을 경우 0.85배속으로 미세 감속
        const needsSlowdown = cut.audio_duration && cut.audio_duration > 5.0;
        const playbackRate = needsSlowdown ? 0.85 : 1.0;

        // 3. 회상(1회차) 씬 스타일 필터 적용
        const videoFilterStyle = cut.is_flashback
          ? {
              filter: 'saturate(0.35) contrast(1.15) brightness(0.85) hue-rotate(210deg)',
            }
          : undefined;

        // 비디오 소스 결정
        const videoSource =
          cut.video_url ||
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

        return (
          <Sequence
            key={cut.id || cut.cut_id}
            from={cutStart}
            durationInFrames={durationInFrames}
            name={`Cut ${cut.cut_id}`}
          >
            {/* 레이어 1: 배경 비디오 */}
            <AbsoluteFill style={videoFilterStyle}>
              <OffthreadVideo
                src={videoSource}
                playbackRate={playbackRate}
                className="w-full h-full object-cover"
                muted // AI 비디오 무음 강제
              />

              {/* 회상 씬 비네팅 오버레이 */}
              {cut.is_flashback && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    boxShadow: 'inset 0 0 140px rgba(10, 15, 45, 0.9)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </AbsoluteFill>

            {/* 레이어 2: 서류 카드 컴포넌트 (상단 2/3 세이프존) */}
            {cut.overlay_type === 'contract' && (
              <ContractOverlay payload={cut.overlay_payload} />
            )}
            {cut.overlay_type === 'registry' && (
              <RegistryOverlay payload={cut.overlay_payload} />
            )}
            {cut.overlay_type === 'graph_33' && (
              <Graph33Overlay payload={cut.overlay_payload} />
            )}
            {cut.overlay_type === 'search_tab' && (
              <SearchTabOverlay payload={cut.overlay_payload} />
            )}

            {/* 레이어 3: 자막 레이어 (top: 1280px 쇼츠 세이프존) */}
            <Subtitle text={cut.script_text} speaker={cut.speaker} />

            {/* 레이어 4: 오디오 (TTS 음성) */}
            {cut.audio_url && <Audio src={cut.audio_url} />}
          </Sequence>
        );
      })}

      {/* 레이어 5: 고정 워터마크 (우측 상단 'AI 생성' 뱃지 필수 오버레이) */}
      <Watermark />
    </AbsoluteFill>
  );
};
