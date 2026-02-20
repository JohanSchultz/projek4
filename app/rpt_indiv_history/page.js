import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IndivHistoryContent } from "./IndivHistoryContent";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getEquipmentTypes() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmenttypes")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function searchEquipmentItemsBySerial(searchText, equipmenttypesId) {
  "use server";
  try {
    const term =
      typeof searchText === "string" ? searchText.trim() : "";
    const typeId = Number(equipmenttypesId);
    if (term.length < 2 || !typeId || Number.isNaN(typeId)) {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentitems")
      .select("id, serialno, equipmenttypes(descr)")
      .ilike("serialno", `${term}%`)
      .eq("equipmenttypes_id", typeId)
      .eq("isactive", true)
      .order("serialno", { ascending: true });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchIndivHistory(
  p_equipmenttypes_id,
  p_equipmentitems_id,
  p_datefrom,
  p_dateto
) {
  "use server";
  try {
    const typeId = p_equipmenttypes_id != null ? Number(p_equipmenttypes_id) : 0;
    const itemId = p_equipmentitems_id != null ? Number(p_equipmentitems_id) : 0;
    if (!typeId || !itemId || Number.isNaN(typeId) || Number.isNaN(itemId)) {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("rpt_indivhistory", {
      p_equipmenttypes_id: typeId,
      p_equipmentitems_id: itemId,
      p_datefrom: p_datefrom || null,
      p_dateto: p_dateto || null,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function getEquipmentItemById(id) {
  "use server";
  try {
    const numId = Number(id);
    if (numId == null || Number.isNaN(numId)) {
      return { data: null, error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentitems")
      .select("*")
      .eq("id", numId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

export default async function RptIndivHistoryPage() {
  const { data: equipmentTypes, error: typesError } = await getEquipmentTypes();
  const types = equipmentTypes ?? [];
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
          Individual Item History
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
        {typesError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {typesError}
          </p>
        )}
        <IndivHistoryContent
          equipmentTypes={types}
          searchEquipmentItemsBySerial={searchEquipmentItemsBySerial}
          getEquipmentItemById={getEquipmentItemById}
          fetchIndivHistory={fetchIndivHistory}
        />
      </main>
    </div>
  );
}
