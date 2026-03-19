import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F8]">
      <div className="text-center px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-indigo/10 to-brand-violet/10 mb-6">
          <span className="text-4xl font-bold text-brand-indigo/40 font-mono">
            404
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight mb-2">
          Halaman tidak ditemukan
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-brand-indigo/30 hover:shadow-xl transition-shadow"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
