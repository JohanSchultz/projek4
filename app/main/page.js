import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function addEquipmentCategory(formData) {
  "use server";
  const descr = formData.get("descr");
  const isactive = formData.get("isactive") === "on";
  const descrStr =
    typeof descr === "string" ? descr.trim() : "";
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("equipmentcategories").insert({
      descr: descrStr || null,
      isactive,
    });
    if (error) throw error;
    revalidatePath("/main");
  } catch (err) {
    console.error("Insert failed:", err.message);
  }
}

async function getEquipmentCategories() {
  try {
    const supabase = await createClient();
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
  const label = row.descr;
  if (label != null) return String(label);
  return String(row.id ?? "—");
}

function sortCategories(rows, sortKey, direction) {
  if (!rows || rows.length === 0) return rows;
  const asc = direction === "asc";
  return [...rows].sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === "created_at") {
      va = va ? new Date(va).getTime() : 0;
      vb = vb ? new Date(vb).getTime() : 0;
      return asc ? va - vb : vb - va;
    }
    if (sortKey === "isactive") {
      va = va === true ? 1 : 0;
      vb = vb === true ? 1 : 0;
      return asc ? va - vb : vb - va;
    }
    va = va != null ? String(va) : "";
    vb = vb != null ? String(vb) : "";
    const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
    return asc ? cmp : -cmp;
  });
}

export default async function MainPage({ searchParams: searchParamsProp }) {
  const searchParams = await (searchParamsProp ?? {});
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "id";
  const dir = searchParams.dir === "desc" ? "desc" : "asc";

  const { data: categories, error } = await getEquipmentCategories();
  const sortedCategories =
    categories && categories.length > 0
      ? sortCategories(categories, sort, dir)
      : categories;

  const basePath = "/main";
  const sortHref = (key) =>
    `${basePath}?sort=${key}&dir=${sort === key && dir === "asc" ? "desc" : "asc"}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="grid w-full max-w-2xl grid-cols-3 items-center gap-4">
          <Link
            href="/menu"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Menu
          </Link>
          <h1 className="text-center text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Dagsê Maatjies
          </h1>
          <form action={signOut} className="flex justify-end">
            <button
              type="submit"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Sign out
            </button>
          </form>
        </div>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Welcome to your Next.js app.
        </p>

        <section
          className="mt-8 w-full max-w-2xl rounded-lg border border-zinc-200 bg-white px-6 py-4 text-left dark:border-zinc-800 dark:bg-zinc-900"
          aria-label="Equipment categories"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Equipment categories
          </h2>
          <form
            action={addEquipmentCategory}
            className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description
              </span>
              <input
                type="text"
                name="descr"
                placeholder="New category"
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                aria-label="Description"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="isactive"
                defaultChecked
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900"
                aria-label="Active"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Active
              </span>
            </label>
            <button
              type="submit"
              className="rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              Save
            </button>
          </form>
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
            <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-zinc-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <Link href={sortHref("descr")} className="hover:text-zinc-900 dark:hover:text-zinc-200">
                  Description {sort === "descr" && (dir === "asc" ? "↑" : "↓")}
                </Link>
                <Link href={sortHref("isactive")} className="min-w-[5rem] hover:text-zinc-900 dark:hover:text-zinc-200">
                  Active {sort === "isactive" && (dir === "asc" ? "↑" : "↓")}
                </Link>
                <Link href={sortHref("created_at")} className="min-w-[10rem] hover:text-zinc-900 dark:hover:text-zinc-200">
                  Created {sort === "created_at" && (dir === "asc" ? "↑" : "↓")}
                </Link>
              </div>
              {sortedCategories.map((row, index) => (
                <div
                  key={row.id ?? `row-${index}`}
                  className={`grid grid-cols-[1fr_auto_auto] gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-200 ${
                    index % 2 === 0 ? "bg-pink-100 dark:bg-pink-900/20" : "bg-sky-100 dark:bg-sky-900/20"
                  }`}
                >
                  <div className="min-w-0 truncate">
                    {row.descr != null ? String(row.descr) : "—"}
                  </div>
                  <div className="min-w-[5rem]">
                    <span
                      className={
                        row.isactive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                      }
                    >
                      {row.isactive ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="min-w-[10rem] text-zinc-600 dark:text-zinc-400">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
