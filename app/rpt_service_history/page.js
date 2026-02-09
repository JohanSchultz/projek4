import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceHistoryGrid } from "./ServiceHistoryGrid";
import { EquipmentTypesGrid } from "./EquipmentTypesGrid";

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
      .select("descr, isactive, created_at, equipmentcategories_id, equipmentcategories(descr)");
    if (error) throw error;
    const rows = (data ?? []).map((row) => ({
      descr: row.equipmentcategories?.descr ?? "—",
      cat: row.equipmentcategories?.descr ?? "—",
      typ: row.descr ?? "—",
      isactive: row.isactive,
      created_at: row.created_at,
      equipmentcategories_id: row.equipmentcategories_id ?? null,
    }));
    rows.sort((a, b) =>
      String(a.descr).localeCompare(String(b.descr), undefined, {
        sensitivity: "base",
      })
    );
    return { data: rows, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

async function getEquipmentTypesAll() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("equipmenttypes").select("*");
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export default async function RptServiceHistoryPage() {
  const { data: rows, error } = await getServiceHistoryData();
  const { data: equipmentTypesRows, error: equipmentTypesError } =
    await getEquipmentTypesAll();

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
      <main className="flex-1 overflow-auto p-6 space-y-8">
        {error && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        )}
        {!error && rows && rows.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No data.
          </p>
        )}
        {!error && rows && rows.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
              By category (row spanning)
            </h2>
            <ServiceHistoryGrid data={rows} />
          </section>
        )}

        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Equipment types (all columns)
          </h2>
          {equipmentTypesError && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {equipmentTypesError}
            </p>
          )}
          {!equipmentTypesError && equipmentTypesRows && equipmentTypesRows.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No equipment types.
            </p>
          )}
          {!equipmentTypesError && equipmentTypesRows && equipmentTypesRows.length > 0 && (
            <EquipmentTypesGrid data={equipmentTypesRows} />
          )}
        </section>
      </main>
    </div>
  );
}
