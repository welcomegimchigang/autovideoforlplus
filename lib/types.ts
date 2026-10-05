export type CutStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export type CutType = 'video' | 'still' | 'edit';

export type SpeakerType = 'plue' | 'beom' | 'none';

export type OverlayType = 'contract' | 'registry' | 'graph_33' | 'search_tab' | null;

export interface OverlayPayload {
  title?: string;
  subtitle?: string;
  data?: Record<string, any>;
  highlight?: string;
  badge?: string;
}

export interface Episode {
  id: string; // 'EP.00'
  title: string;
  created_at: string;
}

export interface CharacterItem {
  id: string;
  name: string;
  desc?: string;
  emoji?: string;
  url: string | null;
  isFixed?: boolean;
}

export interface CharacterAssets {
  plue: string | null;
  beom: string | null;
  custom?: CharacterItem[];
  [key: string]: any;
}

export interface Cut {
  id: string; // uuid
  episode_id: string;
  cut_id: string; // '00-01'
  cut_order: number;
  type: CutType;
  duration_target: number; // in seconds
  is_flashback: boolean;
  speaker: SpeakerType;
  script_text: string;
  visual_prompt: string;
  status: CutStatus;
  image_url?: string | null; // Kling I2V 시작 기준 이미지 URL
  audio_url: string | null;
  audio_duration: number | null;
  video_url: string | null;
  overlay_type: OverlayType;
  overlay_payload: OverlayPayload | null;
  error_message: string | null;
  updated_at: string;
}

export interface ParsedCutItem {
  cut_id: string;
  cut_order: number;
  type: CutType;
  duration_target: number;
  is_flashback: boolean;
  speaker: SpeakerType;
  script_text: string;
  visual_prompt: string;
  overlay_type?: OverlayType;
  overlay_payload?: OverlayPayload;
}

export interface ParseScriptResponse {
  episode_id: string;
  title: string;
  cuts: ParsedCutItem[];
}
