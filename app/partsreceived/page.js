import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFunctionAccess } from "@/lib/auth/requireFunctionAccess";
import { PartsReceivedContent } from "./PartsReceivedContent";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getPartSuppliers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partsuppliers")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchPartsByStockCodePrefix(prefix) {
  "use server";
  try {
    const p = typeof prefix === "string" ? prefix.trim() : "";
    const supabase = await createClient();
    let query = supabase
      .from("parts")
      .select("id, stockcode, part")
      .eq("isactive", true)
      .order("stockcode", { ascending: true });
    if (p) query = query.ilike("stockcode", p + "%");
    const { data, error } = await query;
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchPartsByPartPrefix(prefix) {
  "use server";
  try {
    const p = typeof prefix === "string" ? prefix.trim() : "";
    const supabase = await createClient();
    let query = supabase
      .from("parts")
      .select("id, stockcode, part")
      .eq("isactive", true)
      .order("part", { ascending: true });
    if (p) query = query.ilike("part", p + "%");
    const { data, error } = await query;
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function fetchPartsTakeOn(p_month) {
  "use server";
  try {
    const monthStr = typeof p_month === "string" ? p_month.trim() : "";
    //const dateVal = monthStr ? `${monthStr}-01` : null;
    const dateVal = monthStr;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("partstakeon", {
      p_month: dateVal,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function insertPartTakeOn(
  p_part_id,
  p_datein,
  p_waybillno,
  p_suppliers_id,
  p_unitcost,
  p_qty
) {
  "use server";
  try {
    const partId = p_part_id != null && p_part_id !== "" ? Number(p_part_id) : null;
    const supabase = await createClient();
    const { error } = await supabase.rpc("insert_partstakeon", {
      p_part_id: partId,
      p_datein: p_datein || null,
      p_waybillno: p_waybillno ?? null,
      p_suppliers_id: p_suppliers_id != null ? Number(p_suppliers_id) : null,
      p_unitcost: p_unitcost != null && p_unitcost !== "" ? Number(p_unitcost) : null,
      p_qty: p_qty != null && p_qty !== "" ? Math.floor(Number(p_qty)) : null,
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function deletePartStockInRecord(p_id) {
  "use server";
  try {
    const id = p_id != null && p_id !== "" ? Number(p_id) : null;
    if (id == null) return { error: "No record id to delete." };
    const supabase = await createClient();
    const { error } = await supabase.from("partstockin").delete().eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function decrementPartStockLevel(p_part_id, p_qty) {
  "use server";
  try {
    const partId = p_part_id != null && p_part_id !== "" ? Number(p_part_id) : null;
    const qty = p_qty != null && p_qty !== "" ? Math.floor(Number(p_qty)) : 0;
    if (partId == null || qty <= 0) return { error: null };
    const supabase = await createClient();
    const { data: row, error: fetchError } = await supabase
      .from("parts")
      .select("stocklevel")
      .eq("id", partId)
      .single();
    if (fetchError) throw fetchError;
    const current = row?.stocklevel != null ? Number(row.stocklevel) : 0;
    const newLevel = Math.max(0, current - qty);
    const { error: updateError } = await supabase
      .from("parts")
      .update({ stocklevel: newLevel })
      .eq("id", partId);
    if (updateError) throw updateError;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

export default async function PartsReceivedPage() {
  await requireFunctionAccess(17);
  const { data: suppliers } = await getPartSuppliers();
  const suppliersList = suppliers ?? [];

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
          Parts Received
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
        <PartsReceivedContent
          suppliers={suppliersList}
          fetchPartsByStockCodePrefix={fetchPartsByStockCodePrefix}
          fetchPartsByPartPrefix={fetchPartsByPartPrefix}
          fetchPartsTakeOn={fetchPartsTakeOn}
          insertPartTakeOn={insertPartTakeOn}
          deletePartStockInRecord={deletePartStockInRecord}
          decrementPartStockLevel={decrementPartStockLevel}
        />
      </main>
    </div>
  );
}

