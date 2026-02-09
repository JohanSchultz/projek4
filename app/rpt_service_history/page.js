import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceHistoryGrid } from "./ServiceHistoryGrid";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getServiceHistoryData() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmenttypes")
      .select("descr, isactive, created_at, equipmentcategories(descr)");
    if (error) throw error;
    const rows = (data ?? []).map((row) => ({
      cat: row.equipmentcategories?.descr ?? "—",
      typ: row.descr ?? "—",
      isactive: row.isactive,
      created_at: row.created_at,
    }));
    rows.sort((a, b) =>
      String(a.cat).localeCompare(String(b.cat), undefined, {
        sensitivity: "base",
      })
    );
    return { data: rows, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export default async function RptServiceHistoryPage() {
  const { data: rows, error } = await getServiceHistoryData();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/menu"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Menu
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Service history
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {error && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        )}
        {!error && rows && rows.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No data.
          </p>
        )}
        {!error && rows && rows.length > 0 && (
          <ServiceHistoryGrid data={rows} />
        )}
      </main>
    </div>
  );
}
