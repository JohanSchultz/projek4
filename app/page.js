import { createSupabaseClient } from "@/lib/supabase";

async function getEquipmentCategories() {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from("equipmentcategories")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

function getCategoryLabel(row) {
  // Table columns: id, created_at, descr, isactive
  const label = row.descr;
  if (label != null) return String(label);
  return String(row.id ?? "—");
}

export default async function Home() {
  const { data: categories, error } = await getEquipmentCategories();
  const supabaseAnonKey =
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 5)
      : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Dagsê Maatjies
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Welcome to your Next.js app.
        </p>

        <label className="mt-4 flex flex-col items-center gap-1 text-left">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Anon key (first 10 chars)
          </span>
          <input
            type="text"
            readOnly
            defaultValue={supabaseAnonKey}
            className="w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            aria-label="First 10 characters of Supabase anon key"
          />
        </label>

        <section
          className="mt-8 w-full max-w-md rounded-lg border border-zinc-200 bg-white px-6 py-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
          aria-label="Equipment categories"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Equipment categories
          </h2>
          {error && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              {error}
            </p>
          )}
          {!error && categories && categories.length === 0 && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              No categories yet.
            </p>
          )}
          {!error && categories && categories.length > 0 && (
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              {categories.map((row, index) => (
                <li key={row.id ?? `row-${index}`}>
                  {getCategoryLabel(row)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
