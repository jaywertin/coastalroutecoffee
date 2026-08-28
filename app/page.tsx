export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-stone-50">
      <div className="max-w-xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-300">
          Coastal Route Coffee
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          A fresh site is brewing.
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-300">
          This temporary page confirms the new application is running while the
          existing WordPress site stays live.
        </p>
      </div>
    </main>
  );
}
