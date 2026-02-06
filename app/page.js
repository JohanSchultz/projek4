export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Hello World
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Welcome to your Next.js app.
        </p>
      </main>
    </div>
  );
}
