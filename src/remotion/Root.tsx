import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from '@/components/video/MainComposition';
import { Cut } from '@/lib/types';

const defaultMockCuts: Cut[] = [
  {
    id: '1',
    episode_id: 'EP.00',
    cut_id: '00-01',
    cut_order: 1,
    type: 'video',
    duration_target: 4.5,
    is_flashback: true,
    speaker: 'plue',
    script_text: '우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?',
    visual_prompt: 'baby blue whale contract',
    status: 'READY',
    audio_url: null,
    audio_duration: 4.5,
    video_url: null,
    overlay_type: 'contract',
    overlay_payload: {
      title: '경영권 포기 및 신주발행 동의서',
      subtitle: '오션 홀딩스 vs 플루 테크놀로지',
      highlight: '지분율 33% -> 4.9% 희석',
      badge: '1회차 파멸',
    },
    error_message: null,
    updated_at: new Date().toISOString(),
  },
];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainComposition"
        component={MainComposition as any}
        durationInFrames={30 * 25} // 기본 25초
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          cuts: defaultMockCuts,
        }}
      />
    </>
  );
};
