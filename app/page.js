import { createSupabaseClient } from "@/lib/supabase";

async function getExampleItems() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .limit(5);
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export default async function Home() {
  const { data: items, error } = await getExampleItems();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Hello World
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Welcome to your Next.js app.
        </p>
        <section
          className="mt-8 rounded-lg border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900"
          aria-label="Supabase example"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Supabase example
          </h2>
          {error && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              {error}
            </p>
          )}
          {!error && items && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Fetched {items.length} row(s) from table <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">items</code>.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
