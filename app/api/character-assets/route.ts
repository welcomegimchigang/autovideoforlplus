import { NextRequest, NextResponse } from 'next/server';
import { fetchCharacterAssetsFromDB, saveCharacterAssets } from '@/lib/db';

export async function GET() {
  const assets = await fetchCharacterAssetsFromDB();
  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assets = saveCharacterAssets(body);
    return NextResponse.json({ success: true, assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
