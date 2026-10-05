import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.local';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// 클라이언트 사이드 Supabase 인스턴스 (Anon Key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버 사이드 백그라운드 워커 및 Storage 업로드용 관리자 인스턴스 (Service Role Key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const STORAGE_BUCKET_MEDIA = 'media-assets';
export const STORAGE_BUCKET_RENDERS = 'final-renders';

import fs from 'fs';
import path from 'path';

/**
 * Supabase Storage에 오디오 파일 업로드 (실패 시 public/generated-audios 로컬 저장소로 자동 서빙)
 */
export async function uploadAudioToStorage(
  buffer: Buffer | Uint8Array,
  fileName: string,
  contentType = 'audio/wav'
): Promise<string> {
  const filePath = `audios/${fileName}`;

  // 1. 로컬 public/generated-audios에 안전 보관 (브라우저 즉시 재생 보장)
  try {
    const publicAudioDir = path.join(process.cwd(), 'public', 'generated-audios');
    if (!fs.existsSync(publicAudioDir)) {
      fs.mkdirSync(publicAudioDir, { recursive: true });
    }
    const localFilePath = path.join(publicAudioDir, fileName);
    fs.writeFileSync(localFilePath, Buffer.from(buffer));
  } catch (localErr: any) {
    console.warn('[Storage] Local audio save warning:', localErr.message);
  }

  // 2. Supabase Storage 업로드 시도
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Audio upload warning (${error.message}). Serving from local /generated-audios.`);
      return `/generated-audios/${encodeURIComponent(fileName)}`;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn(`[Supabase Storage] Audio upload error (${err?.message}). Serving from local /generated-audios.`);
    return `/generated-audios/${encodeURIComponent(fileName)}`;
  }
}

/**
 * Supabase Storage에 비디오 파일 업로드
 */
export async function uploadVideoToStorage(
  buffer: Buffer | Uint8Array,
  fileName: string,
  contentType = 'video/mp4'
): Promise<string> {
  const filePath = `videos/${fileName}`;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase Storage upload warning (using fallback mock URL):`, error.message);
      return `/api/mock-media?type=video&name=${encodeURIComponent(fileName)}`;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn(`Supabase Storage error (fallback):`, err?.message);
    return `/api/mock-media?type=video&name=${encodeURIComponent(fileName)}`;
  }
}

/**
 * Supabase Storage에 캐릭터 및 컷 시작 기준 이미지 업로드
 */
export async function uploadImageToStorage(
  buffer: Buffer | Uint8Array,
  fileName: string,
  contentType = 'image/png'
): Promise<string> {
  const filePath = `reference-images/${fileName}`;

  try {
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Reference image upload warning:`, error.message);
      // Data URL fallback if storage bucket issue
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET_MEDIA)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn(`[Supabase Storage] Reference image upload error:`, err?.message);
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  }
}

