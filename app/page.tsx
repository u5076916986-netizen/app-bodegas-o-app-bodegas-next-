import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">APP Bodegas</h1>
      <p className="text-sm opacity-70 mt-2">
        MVP: ver bodegas → ver productos → crear pedido.
      </p>

      <div className="mt-6">
        <Link
          className="rounded-xl border px-4 py-3 inline-block hover:bg-white/5"
          href="/bodegas"
        >
          Ver bodegas
        </Link>
      </div>
    </main>
  );
}
