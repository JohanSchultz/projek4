import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditJobContent } from "./EditJobContent";

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

async function fetchPartsPerJob(pJobId) {
  "use server";
  try {
    const id = Number(pJobId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("partsperjob", {
      p_job_id: id,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchJobListPerItem(pEquipmentItemsId) {
  "use server";
  try {
    const id = Number(pEquipmentItemsId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("joblistperitem", {
      p_equipmentitems_id: id,
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

async function updateJob(
  p_job_id,
  p_technician_id,
  p_datein,
  p_dateout,
  p_comments
) {
  "use server";
  try {
    const jobId = Number(p_job_id);
    if (Number.isNaN(jobId)) return { error: "Invalid job ID" };
    const supabase = await createClient();
    const { error } = await supabase
      .from("jobs")
      .update({
        technician_id: p_technician_id ? Number(p_technician_id) : null,
        datein: p_datein || null,
        dateout: p_dateout || null,
        comments: p_comments ?? null,
      })
      .eq("id", jobId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function deletePartsPerJob(pJobId) {
  "use server";
  try {
    const id = Number(pJobId);
    if (Number.isNaN(id)) return { error: "Invalid job ID" };
    const supabase = await createClient();
    const { error } = await supabase.rpc("delete_partsperjob", {
      p_job_id: id,
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
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

export default async function EditJobPage() {
  const { data: equipmentTypes, error: typesError } =
    await getEquipmentTypes();
  const { data: technicians, error: techniciansError } =
    await getTechnicians();
  const types = equipmentTypes ?? [];
  const techList = technicians ?? [];
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
          Edit Job
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
        <EditJobContent
          equipmentTypes={types}
          technicians={techList}
          initialPartsData={initialParts}
          fetchPartsByTypeId={fetchPartsByTypeId}
          fetchItemsPerType={fetchItemsPerType}
          fetchJobListPerItem={fetchJobListPerItem}
          fetchPartsPerJob={fetchPartsPerJob}
          updateJob={updateJob}
          deletePartsPerJob={deletePartsPerJob}
          insertPartsPerJob={insertPartsPerJob}
        />
      </main>
    </div>
  );
}
