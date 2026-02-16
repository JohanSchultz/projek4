import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FullServiceHistoryContent } from "./FullServiceHistoryContent";

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

async function getMines() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mines")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchShaftsByMineId(mineId) {
  "use server";
  try {
    const id = Number(mineId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    let query = supabase
      .from("shafts")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (id !== 0) query = query.eq("mine_id", id);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchSectionsByShaftId(shaftId) {
  "use server";
  try {
    const id = Number(shaftId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    let query = supabase
      .from("sections")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (id !== 0) query = query.eq("shaft_id", id);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchGangsBySectionId(sectionId) {
  "use server";
  try {
    const id = Number(sectionId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    let query = supabase
      .from("gangs")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (id !== 0) query = query.eq("section_id", id);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchJobsWithParts(
  p_mine_id,
  p_shaft_id,
  p_section_id,
  p_gang_id,
  p_equipmenttypes_id,
  p_datefrom,
  p_dateto
) {
  "use server";
  try {
    const mineId = p_mine_id != null ? Number(p_mine_id) : 0;
    const shaftId = p_shaft_id != null ? Number(p_shaft_id) : 0;
    const sectionId = p_section_id != null ? Number(p_section_id) : 0;
    const gangId = p_gang_id != null ? Number(p_gang_id) : 0;
    const typeIds = Array.isArray(p_equipmenttypes_id)
      ? p_equipmenttypes_id.map(Number).filter((n) => !Number.isNaN(n))
      : [];
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("jobswithparts", {
      p_mine_id: mineId,
      p_shaft_id: shaftId,
      p_section_id: sectionId,
      p_gang_id: gangId,
      p_equipmenttypes_id: typeIds,
      p_datefrom: p_datefrom || null,
      p_dateto: p_dateto || null,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

export default async function RptFullServiceHistoryPage() {
  const { data: equipmentTypes, error: typesError } =
    await getEquipmentTypes();
  const { data: mines, error: minesError } = await getMines();
  const types = equipmentTypes ?? [];
  const minesList = mines ?? [];

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
          Full Service History
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
        {minesError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {minesError}
          </p>
        )}
        <FullServiceHistoryContent
          equipmentTypes={types}
          mines={minesList}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          fetchJobsWithParts={fetchJobsWithParts}
        />
      </main>
    </div>
  );
}
