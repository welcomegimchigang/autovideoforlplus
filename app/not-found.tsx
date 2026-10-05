import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-3xl font-black text-white mb-2">404 - 페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-slate-400 mb-6">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      <Link
        href="/admin"
        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
      >
        관리자 대시보드로 돌아가기
      </Link>
    </div>
  );
}
