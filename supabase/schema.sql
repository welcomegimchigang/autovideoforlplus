-- ==========================================
-- AutoVideoForPlus: Supabase Database Schema
-- ==========================================

-- 1. 에피소드 테이블
CREATE TABLE IF NOT EXISTS public.episodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 컷(Cut) 테이블
CREATE TABLE IF NOT EXISTS public.cuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    cut_id TEXT NOT NULL,
    cut_order INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'video',
    duration_target NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    is_flashback BOOLEAN NOT NULL DEFAULT false,
    speaker TEXT NOT NULL DEFAULT 'plue',
    script_text TEXT NOT NULL,
    visual_prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    image_url TEXT,
    audio_url TEXT,
    audio_duration NUMERIC(5, 2),
    video_url TEXT,
    overlay_type TEXT,
    overlay_payload JSONB,
    error_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 캐릭터 레퍼런스 에셋 테이블
CREATE TABLE IF NOT EXISTS public.character_assets (
    id TEXT PRIMARY KEY DEFAULT 'default',
    plue TEXT,
    beom TEXT,
    flashback TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_cuts_episode_order ON public.cuts (episode_id, cut_order);
CREATE INDEX IF NOT EXISTS idx_cuts_status ON public.cuts (status);

-- 5. RLS (Row Level Security) 접근 허용 정책
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_assets ENABLE ROW LEVEL SECURITY;

-- 익명/인증 사용자 읽기 및 서비스 롤 전체 제어 허용
CREATE POLICY "Allow all episodes" ON public.episodes FOR ALL USING (true);
CREATE POLICY "Allow all cuts" ON public.cuts FOR ALL USING (true);
CREATE POLICY "Allow all character_assets" ON public.character_assets FOR ALL USING (true);
