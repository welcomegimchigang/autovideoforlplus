import Anthropic from '@anthropic-ai/sdk';
import { ParsedCutItem, ParseScriptResponse } from './types';

const CLAUDE_SYSTEM_PROMPT = `
당신은 웹소설 원작 숏폼(60초 세로형 9:16) 영상 제작 파이프라인의 최고 사령관 '헤드 에이전트'입니다.
사용자가 입력한 대본을 분석하여 약 60초 분량(보통 10~14개 컷)의 정교한 컷시트 JSON을 생성해야 합니다.

[세계관 및 캐릭터 설정]
1. 장르: 해양 생물 의인화 스타트업/기업 회귀 웹소설
2. 주인공 '플루 (Plue)':
   - 3D 외형: 광택 있는 3D 파란 아기 대왕고래 (Glossy 3D blue baby whale), 둥글고 귀여운 체형, 맑은 남색 눈, 양쪽 작은 지느러미로 서류나 만년필을 쥠.
   - 성격: 회귀 전 실패를 딛고 일어선 똑똑하고 결연한 전략가.
3. 공동창업자 '범 (Beom)':
   - 3D 외형: 3D 범고래 (Glossy 3D killer whale), 날렵한 흑백 가죽 무늬, 카리스마 있고 굳은 결의에 찬 표정.
4. 기본 영상 스타일:
   - Glossy 3D animation, round toy-like, smooth underwater cinematic light, floating particles.
5. 회상(1회차 과거 실패) 씬 규칙:
   - is_flashback = true 설정
   - 비주얼 프롬프트 앞단에 'indigo color tone, dark desaturated, dark vignetting' 강제 부여.
6. 무음 규칙:
   - 모든 비주얼 프롬프트의 끝은 반드시 ', silent clip'으로 끝나야 함.
7. 서류 카드 분리 규칙 (중요!):
   - AI 영상 자체에는 글자를 절대 렌더링하지 않고 흐림 처리된 종이나 태블릿만 들고 있게 묘사합니다.
   - 계약서, 등기부등본, 33% 지분 차트, 기업 검색창 등 글자/수치가 필요한 부분은 overlay_type과 overlay_payload로 완벽히 분리하십시오.
   - overlay_type 종류: 'contract' (계약서), 'registry' (등기부), 'graph_33' (33% 지분/지표 그래프), 'search_tab' (포털 검색/기업정보), null (일반 영상)

[컷 생성 규칙]
- 각 컷의 duration_target은 보통 3.5초~5.0초입니다. (대사가 길면 5~7초).
- speaker: 'plue' | 'beom' | 'none'
- type: 'video' | 'still' | 'edit'
- 대화(티키타카) 씬 규칙:
  * 플루와 범이 서로 대화하는 장면은 한 컷에 대사를 합치지 말고, 발화자 턴(Turn) 단위로 컷을 1:1 분할(Shot-Reverse-Shot)하십시오.
  * 범이 말할 때는 speaker: 'beom'과 범의 비주얼 프롬프트, 플루가 받아칠 때는 speaker: 'plue'와 플루의 비주얼 프롬프트를 배정하여 티키타카가 살아나도록 연출하십시오.

[출력 형식]
반드시 유효한 JSON 객체만 반환하십시오. 마크다운 백틱(\`\`\`json)이나 다른 설명글을 일절 포함하지 마십시오:
{
  "episode_id": "EP.00",
  "title": "에피소드 제목",
  "cuts": [
    {
      "cut_id": "00-01",
      "cut_order": 1,
      "type": "video",
      "duration_target": 4.5,
      "is_flashback": false,
      "speaker": "plue",
      "script_text": "우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?",
      "visual_prompt": "Glossy 3D animation, round toy-like baby blue whale holding a blank blurred paper with fins, shocked navy eyes, underwater office desk, cinematic light, silent clip",
      "overlay_type": "contract",
      "overlay_payload": {
        "title": "경영권 양도 계약서",
        "subtitle": "주식회사 오션테크 / 지분 51%",
        "highlight": "일방적 백지위임 조항 발견",
        "badge": "불공정 계약"
      }
    }
  ]
}
`;

/**
 * Claude 3.5 Sonnet을 호출하여 대본을 컷시트 JSON으로 파싱
 */
export async function parseScriptWithClaude(
  scriptText: string,
  episodeId = 'EP.00'
): Promise<ParseScriptResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.startsWith('sk-ant-...')) {
    console.warn('[Claude] No API key found. Using default parsed template cut sheet.');
    return getFallbackCutSheet(episodeId, scriptText);
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    temperature: 0.2,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `에피소드 ID: ${episodeId}\n\n[원본 대본]:\n${scriptText}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Claude response is not text');
  }

  let rawJson = contentBlock.text.trim();
  // 마크다운 코드블록 제거
  if (rawJson.startsWith('```')) {
    rawJson = rawJson.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();
  }

  try {
    const parsed: ParseScriptResponse = JSON.parse(rawJson);
    return parsed;
  } catch (err: any) {
    console.error('Failed to parse Claude JSON output:', rawJson);
    throw new Error(`Claude response JSON parse failed: ${err.message}`);
  }
}

/**
 * 기본 템플릿 대본 컷시트 (API 키 미설정 시 또는 테스트용 기본 데이터)
 */
export function getFallbackCutSheet(episodeId: string, userScript: string): ParseScriptResponse {
  return {
    episode_id: episodeId || 'EP.00',
    title: '회귀한 아기 고래의 33% 지분 방어전',
    cuts: [
      {
        cut_id: '00-01',
        cut_order: 1,
        type: 'video',
        duration_target: 4.5,
        is_flashback: true,
        speaker: 'plue',
        script_text: '우리가 피땀 흘려 세운 회사가, 고작 종이 한 장에 넘어갔다고?',
        visual_prompt:
          'indigo color tone, dark desaturated, dark vignetting, Glossy 3D animation, round toy-like baby blue whale in despair holding blurred contract paper, dark ocean ruins, silent clip',
        overlay_type: 'contract',
        overlay_payload: {
          title: '경영권 포기 및 신주발행 동의서',
          subtitle: '오션 홀딩스 vs 플루 테크놀로지',
          highlight: '지분율 33% -> 4.9% 희석',
          badge: '1회차 파멸'
        },
      },
      {
        cut_id: '00-02',
        cut_order: 2,
        type: 'video',
        duration_target: 4.8,
        is_flashback: false,
        speaker: 'plue',
        script_text: '하지만 눈을 떠보니... 투자 계약서 도장을 찍기 딱 3시간 전이다.',
        visual_prompt:
          'Glossy 3D animation, round toy-like baby blue whale waking up at modern neon underwater office, looking at wall clock, determined shining navy eyes, floating air bubbles, silent clip',
        overlay_type: null,
      },
      {
        cut_id: '00-03',
        cut_order: 3,
        type: 'video',
        duration_target: 5.2,
        is_flashback: false,
        speaker: 'beom',
        script_text: '플루, 왜 그래? 대표님 오셨어. 지금 안 찍으면 투자금 날아간다고!',
        visual_prompt:
          'Glossy 3D animation, round toy-like killer whale Beom holding red stamp, stern urgent facial expression, modern coral startup office, cinematic rim light, silent clip',
        overlay_type: null,
      },
      {
        cut_id: '00-04',
        cut_order: 4,
        type: 'video',
        duration_target: 5.5,
        is_flashback: false,
        speaker: 'plue',
        script_text: '잠깐, 범아. 그 사람 등기부등본 확인해 봤어? 페이퍼 컴퍼니야.',
        visual_prompt:
          'Glossy 3D animation, baby blue whale holding glowing transparent digital tablet with flippers, highlighting registry data, serious look, floating particles, silent clip',
        overlay_type: 'registry',
        overlay_payload: {
          title: '법인 등기사항전부증명서',
          subtitle: '(주)샤크벤처캐피탈',
          highlight: '자본금 100만원 / 설립 3일 전',
          badge: '위험 기업'
        },
      },
      {
        cut_id: '00-05',
        cut_order: 5,
        type: 'video',
        duration_target: 5.0,
        is_flashback: false,
        speaker: 'plue',
        script_text: '우리의 지분 33%는 거부권의 마지노선이야. 1%도 양보 못 해!',
        visual_prompt:
          'Glossy 3D animation, round baby blue whale clenching fin with confidence, holographic 3D neon pie chart glowing in ocean boardroom, silent clip',
        overlay_type: 'graph_33',
        overlay_payload: {
          title: '스타트업 지분 방어선',
          subtitle: '주주총회 특별결의 저지선: 33.4%',
          highlight: '플루 & 범 공동지분 33.4% 유지',
          badge: '황금 거부권'
        },
      },
    ],
  };
}
