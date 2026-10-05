import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/supabase';
import { updateCut, saveCharacterAssets } from '@/lib/db';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const cutId = formData.get('cutId') as string | null;
    const characterType = formData.get('characterType') as 'plue' | 'beom' | 'flashback' | null;

    if (!file) {
      return NextResponse.json(
        { error: '업로드할 이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // 1. Supabase Storage에 업로드 (media-assets/reference-images/)
    const publicUrl = await uploadImageToStorage(buffer, fileName, file.type || 'image/png');

    // 2. 캐릭터 전역 에셋으로 지정된 경우 저장
    if (characterType) {
      if (characterType === 'plue' || characterType === 'beom') {
        saveCharacterAssets({ [characterType]: publicUrl });
      } else {
        const { getCharacterAssets } = await import('@/lib/db');
        const current = getCharacterAssets();
        const customList = current.custom || [];
        const updatedCustom = customList.map((c) =>
          c.id === characterType ? { ...c, url: publicUrl } : c
        );
        if (!customList.some((c) => c.id === characterType)) {
          updatedCustom.push({
            id: characterType,
            name: characterType,
            url: publicUrl,
            isFixed: false,
          });
        }
        saveCharacterAssets({ custom: updatedCustom });
      }
      console.log(`[Upload] Updated character asset for ${characterType}: ${publicUrl}`);
    }

    // 3. 특정 컷의 시작 이미지로 지정된 경우 컷 레코드 업데이트
    if (cutId) {
      await updateCut(cutId, { image_url: publicUrl });
      console.log(`[Upload] Updated cut ${cutId} image_url: ${publicUrl}`);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      cutId,
      characterType,
    });
  } catch (error: any) {
    console.error('[Upload Image Error]:', error);
    return NextResponse.json(
      { error: error?.message || '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
