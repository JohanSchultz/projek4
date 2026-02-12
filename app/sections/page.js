import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionsContent } from "./SectionsContent";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
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
      .order("descr", { ascending: true });
    if (id !== 0) query = query.eq("mine_id", id);
    const { data, error } = await query;
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function insertSection(shaft_id, descr, costcode, isactive) {
  "use server";
  try {
    if (shaft_id == null || Number(shaft_id) === 0) {
      return { error: "Please select a shaft." };
    }
    const trimmedDescr = typeof descr === "string" ? descr.trim() : "";
    if (!trimmedDescr) {
      return { error: "Section is required." };
    }
    const supabase = await createClient();
    const trimmedCostcode =
      typeof costcode === "string" ? costcode.trim() : "";
    const { data: existing } = await supabase
      .from("sections")
      .select("id")
      .eq("shaft_id", Number(shaft_id))
      .eq("descr", trimmedDescr)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return {
        error: "A section with this description already exists for this shaft.",
      };
    }
    const { error } = await supabase.from("sections").insert({
      shaft_id: Number(shaft_id),
      descr: trimmedDescr,
      costcode: trimmedCostcode || null,
      isactive: Boolean(isactive),
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function updateSection(id, shaft_id, descr, costcode, isactive) {
  "use server";
  try {
    const supabase = await createClient();
    const updates = {};
    if (shaft_id != null) updates.shaft_id = Number(shaft_id);
    if (typeof descr === "string") updates.descr = descr.trim() || null;
    if (typeof costcode === "string") updates.costcode = costcode.trim() || null;
    if (typeof isactive === "boolean") updates.isactive = isactive;
    const { error } = await supabase
      .from("sections")
      .update(updates)
      .eq("id", Number(id));
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function fetchAllSections() {
  "use server";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_allsections");
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

export default async function SectionsPage() {
  const { data: mines, error: minesError } = await getMines();
  const mineList = mines ?? [];

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
          Sections
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
        {minesError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {minesError}
          </p>
        )}
        <SectionsContent
          mines={mineList}
          fetchShaftsByMineId={fetchShaftsByMineId}
          insertSection={insertSection}
          updateSection={updateSection}
          fetchAllSections={fetchAllSections}
        />
      </main>
    </div>
  );
}
