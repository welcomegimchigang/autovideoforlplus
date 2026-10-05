'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '비밀번호가 일치하지 않습니다.');
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || '인증 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 mb-4 shadow-xl shadow-blue-500/25">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <span className="text-3xl">🐳</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">PLUE AUTO PIPELINE</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          웹소설 원작 숏폼 완전 자동화 관리자 게이트
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">
            관리자 접근 패스코드 (ACCESS_PASSWORD)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요 (기본: plue2026!)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-white placeholder-slate-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition font-mono"
              required
              autoFocus
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-black shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>접근 권한 검증 중...</span>
            </>
          ) : (
            <>
              <span>스튜디오 입장하기</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-[11px] text-slate-500">
          Claude 3.5 Head Agent • Typecast Voice • Kling I2V • Remotion
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[380px] h-[380px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">로딩 중...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
