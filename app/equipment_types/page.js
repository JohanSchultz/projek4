import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipmentTypesContent } from "./EquipmentTypesContent";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getEquipmentCategories() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentcategories")
      .select("id, descr")
      .eq("isactive", true)
      .order("descr", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function insertEquipmentType(equipmentcategories_id, descr, isactive) {
  "use server";
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("equipmenttypes").insert({
      equipmentcategories_id: equipmentcategories_id ?? null,
      descr: descr ?? null,
      isactive: Boolean(isactive),
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function fetchAllequipmenttypes() {
  "use server";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_allequipmenttypes");
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

export default async function EquipmentTypesPage() {
  const { data: categories, error: categoriesError } =
    await getEquipmentCategories();
  const categoryList = categories ?? [];

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
          Equipment types
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
        {categoriesError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {categoriesError}
          </p>
        )}
        <EquipmentTypesContent
          categories={categoryList}
          insertEquipmentType={insertEquipmentType}
          fetchAllequipmenttypes={fetchAllequipmenttypes}
        />
      </main>
    </div>
  );
}
