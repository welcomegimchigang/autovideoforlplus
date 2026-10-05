import { supabaseAdmin } from './supabase';
import { Cut, Episode, CharacterAssets } from './types';

// Next.js App Router 라우트 간 및 핫 리로드 시 상태 유지를 위한 globalThis 싱글톤
const globalStore = globalThis as unknown as {
  __memoryEpisodes?: Map<string, Episode>;
  __memoryCuts?: Map<string, Cut>;
  __characterAssets?: CharacterAssets;
};

if (!globalStore.__memoryEpisodes) {
  globalStore.__memoryEpisodes = new Map();
}
if (!globalStore.__memoryCuts) {
  globalStore.__memoryCuts = new Map();
}
if (!globalStore.__characterAssets) {
  globalStore.__characterAssets = {
    plue: null,
    beom: null,
    custom: [],
  };
}

const memoryEpisodes = globalStore.__memoryEpisodes;
const memoryCuts = globalStore.__memoryCuts;

export function getCharacterAssets(): CharacterAssets {
  return globalStore.__characterAssets || { plue: null, beom: null, custom: [] };
}

export async function fetchCharacterAssetsFromDB(): Promise<CharacterAssets> {
  try {
    const { data, error } = await supabaseAdmin
      .from('character_assets')
      .select('*')
      .eq('id', 'default')
      .single();

    if (!error && data) {
      let customList = [];
      if (Array.isArray(data.custom)) {
        customList = data.custom;
      } else if (typeof data.custom === 'string') {
        try { customList = JSON.parse(data.custom); } catch (e) {}
      }

      globalStore.__characterAssets = {
        plue: data.plue || null,
        beom: data.beom || null,
        custom: customList,
      };
    }
  } catch (e) {}

  return getCharacterAssets();
}

export function saveCharacterAssets(assets: Partial<CharacterAssets>): CharacterAssets {
  const current = getCharacterAssets();
  const merged: CharacterAssets = {
    ...current,
    ...assets,
    custom: assets.custom !== undefined ? assets.custom : (current.custom || []),
  };
  globalStore.__characterAssets = merged;

  // 비동기 Supabase DB 영구 동기화
  (async () => {
    try {
      const { error } = await supabaseAdmin
        .from('character_assets')
        .upsert({
          id: 'default',
          plue: merged.plue,
          beom: merged.beom,
          custom: merged.custom || [],
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.warn('[DB] Character assets Supabase save warning:', error.message);
      }
    } catch (e) {}
  })();

  return merged;
}

export async function saveEpisodeAndCuts(
  episode: Episode,
  cuts: Cut[]
): Promise<void> {
  // 1. 메모리 저장 (globalThis에 즉시 동기화)
  memoryEpisodes.set(episode.id, episode);
  cuts.forEach((cut) => memoryCuts.set(cut.id, cut));

  // 2. Supabase DB 저장 시도 (선택적)
  try {
    const { error: epError } = await supabaseAdmin
      .from('episodes')
      .upsert({
        id: episode.id,
        title: episode.title,
        created_at: episode.created_at,
      });

    if (epError) {
      console.warn('[DB] Supabase episodes upsert warning:', epError.message);
    }

    const { error: cutsError } = await supabaseAdmin
      .from('cuts')
      .upsert(
        cuts.map((c) => ({
          id: c.id,
          episode_id: c.episode_id,
          cut_id: c.cut_id,
          cut_order: c.cut_order,
          type: c.type,
          duration_target: c.duration_target,
          is_flashback: c.is_flashback,
          speaker: c.speaker,
          script_text: c.script_text,
          visual_prompt: c.visual_prompt,
          status: c.status,
          image_url: c.image_url || null,
          audio_url: c.audio_url,
          audio_duration: c.audio_duration,
          video_url: c.video_url,
          overlay_type: c.overlay_type,
          overlay_payload: c.overlay_payload,
          error_message: c.error_message,
          updated_at: c.updated_at,
        }))
      );

    if (cutsError) {
      console.warn('[DB] Supabase cuts upsert warning:', cutsError.message);
    }
  } catch (err: any) {
    console.warn('[DB] Supabase DB connection skipped (using memory storage):', err?.message);
  }
}

export async function getEpisodes(): Promise<Episode[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    // fallback
  }

  return Array.from(memoryEpisodes.values());
}

export async function getCutsByEpisode(episodeId: string): Promise<Cut[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cuts')
      .select('*')
      .eq('episode_id', episodeId)
      .order('cut_order', { ascending: true });

    if (!error && data && data.length > 0) {
      // Supabase 데이터와 메모리 동기화
      data.forEach((c: any) => memoryCuts.set(c.id, c as Cut));
      return data as Cut[];
    }
  } catch (err) {
    // fallback
  }

  return Array.from(memoryCuts.values())
    .filter((c) => c.episode_id === episodeId)
    .sort((a, b) => a.cut_order - b.cut_order);
}

export async function getNextPendingCut(episodeId?: string): Promise<Cut | null> {
  // 우선 memoryCuts에서 확인
  const memoryPending = Array.from(memoryCuts.values())
    .filter((c) => c.status === 'PENDING' && (!episodeId || c.episode_id === episodeId))
    .sort((a, b) => a.cut_order - b.cut_order);

  if (memoryPending.length > 0) {
    return memoryPending[0];
  }

  // Supabase 쿼리 시도
  try {
    let query = supabaseAdmin
      .from('cuts')
      .select('*')
      .eq('status', 'PENDING')
      .order('cut_order', { ascending: true })
      .limit(1);

    if (episodeId) {
      query = query.eq('episode_id', episodeId);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data[0] as Cut;
    }
  } catch (err) {
    // fallback
  }

  return null;
}

export async function updateCut(cutId: string, updates: Partial<Cut>): Promise<Cut | null> {
  let existing = memoryCuts.get(cutId);

  // ID 매칭이 안 되면 cut_id로 검색
  if (!existing) {
    for (const c of Array.from(memoryCuts.values())) {
      if (c.cut_id === cutId || c.id === cutId) {
        existing = c;
        break;
      }
    }
  }

  const updated: Cut = existing
    ? { ...existing, ...updates, updated_at: new Date().toISOString() }
    : ({
        id: cutId,
        episode_id: 'EP.00',
        cut_id: '00-01',
        cut_order: 1,
        type: 'video',
        duration_target: 5.0,
        is_flashback: false,
        speaker: 'plue',
        script_text: '',
        visual_prompt: '',
        status: updates.status || 'READY',
        audio_url: null,
        audio_duration: null,
        video_url: null,
        overlay_type: null,
        overlay_payload: null,
        error_message: null,
        ...updates,
        updated_at: new Date().toISOString(),
      } as Cut);

  memoryCuts.set(updated.id, updated);

  try {
    const { data, error } = await supabaseAdmin
      .from('cuts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id)
      .select()
      .single();

    if (!error && data) {
      return data as Cut;
    }
  } catch (err) {
    // fallback
  }

  return updated;
}
