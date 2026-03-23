import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFunctionAccess } from "@/lib/auth/requireFunctionAccess";
import { AddJobContent } from "./AddJobContent";

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

async function getTechnicians() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("technicians")
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

async function fetchEquipmentItemById(itemId) {
  "use server";
  try {
    const id = Number(itemId);
    if (Number.isNaN(id) || id === 0) return { data: null, error: null };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentitems")
      .select("mine_id, shaft_id, section_id, gang_id")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return { data: data ?? null, error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchPartsByTypeId(typeId) {
  "use server";
  try {
    const id = Number(typeId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_partspertype", {
      type_id: id,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchItemsPerType(typeId) {
  "use server";
  try {
    const id = Number(typeId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_itemspertype", {
      p_type_id: id,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function insertJob(
  p_equipmentitems_id,
  p_technician_id,
  p_datein,
  p_dateout,
  p_comments,
  p_mine_id,
  p_shaft_id,
  p_section_id,
  p_gang_id
) {
  "use server";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("insert_job", {
      p_equipmentitems_id: Number(p_equipmentitems_id) || null,
      p_technician_id: Number(p_technician_id) || null,
      p_datein: p_datein || null,
      p_dateout: p_dateout || null,
      p_comments: p_comments ?? null,
      p_mine_id: Number(p_mine_id) || null,
      p_shaft_id: Number(p_shaft_id) || null,
      p_section_id: Number(p_section_id) || null,
      p_gang_id: Number(p_gang_id) || null,
    });
    if (error) throw error;
    const result =
      typeof data === "number"
        ? data
        : data?.insert_job ?? (Array.isArray(data) ? data[0]?.insert_job : null);
    return { insertJob: result ?? null, error: null };
  } catch (err) {
    return { insertJob: null, error: err?.message ?? String(err) };
  }
}

async function insertPartsPerJob(
  p_equipmentitems_id,
  p_jobs_id,
  p_parts_id,
  p_qty,
  p_unitcost,
  p_isdamaged
) {
  "use server";
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("insert_partsperjob", {
      p_equipmentitems_id: Number(p_equipmentitems_id) || null,
      p_jobs_id: Number(p_jobs_id) || null,
      p_parts_id: Number(p_parts_id) ?? null,
      p_qty: Math.floor(Number(p_qty)) || 0,
      p_unitcost: Number(p_unitcost) ?? 0,
      p_isdamaged: Boolean(p_isdamaged),
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

export default async function AddJobPage() {
  await requireFunctionAccess(9);
  const { data: equipmentTypes, error: typesError } =
    await getEquipmentTypes();
  const { data: technicians, error: techniciansError } =
    await getTechnicians();
  const { data: mines, error: minesError } = await getMines();
  const types = equipmentTypes ?? [];
  const techList = technicians ?? [];
  const minesList = mines ?? [];
  const firstId = types.length > 0 ? types[0].id : null;
  const initialParts =
    firstId != null
      ? await (async () => {
          const result = await fetchPartsByTypeId(firstId);
          return result?.data ?? [];
        })()
      : [];

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
          Add Job
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
        {techniciansError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {techniciansError}
          </p>
        )}
        {minesError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {minesError}
          </p>
        )}
        <AddJobContent
          equipmentTypes={types}
          technicians={techList}
          mines={minesList}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          fetchEquipmentItemById={fetchEquipmentItemById}
          initialPartsData={initialParts}
          fetchPartsByTypeId={fetchPartsByTypeId}
          fetchItemsPerType={fetchItemsPerType}
          insertJob={insertJob}
          insertPartsPerJob={insertPartsPerJob}
        />
      </main>
    </div>
  );
}
