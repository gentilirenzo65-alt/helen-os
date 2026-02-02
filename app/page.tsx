import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        <h1 className="text-6xl font-bold text-white tracking-tighter drop-shadow-2xl">
          Helen OS <span className="text-xl font-light opacity-70 block mt-2 tracking-widest uppercase">Sistema Unificado</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/admin" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass p-8 rounded-3xl border border-white/10 hover:border-white/30 transition-all group-hover:-translate-y-1">
              <div className="text-4xl mb-4">🎛️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
              <p className="text-white/60 text-sm">Gestión de contenido, métricas y usuarios.</p>
            </div>
          </Link>

          <Link href="/user" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative glass p-8 rounded-3xl border border-white/10 hover:border-white/30 transition-all group-hover:-translate-y-1">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-2xl font-bold text-white mb-2">User Experience</h2>
              <p className="text-white/60 text-sm">Timeline gamificado y contenido exclusivo.</p>
            </div>
          </Link>
        </div>

        <div className="text-white/40 text-xs uppercase tracking-widest">
          v1.0.0 • Next.js • Prisma • Tailwind v4
        </div>
      </div>
    </div>
  );
}
