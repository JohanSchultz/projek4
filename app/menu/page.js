import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuTree } from "./MenuTree";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getMenuData() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return { userId: null, data: [], error: null };
    const { data: rows, error } = await supabase.rpc("get_permissions_by_user", {
      p_user_id: user.id,
    });
    if (error) throw error;
    const gridRows = Array.isArray(rows) ? rows : [];
    return { userId: user.id, data: gridRows, error: null };
  } catch (err) {
    return { userId: null, data: [], error: err?.message ?? String(err) };
  }
}

function hasFunctionId(gridRows, n) {
  const idSet = new Set(
    (gridRows ?? []).map((row) => {
      const id = row.function_id ?? row.id;
      if (id == null) return null;
      const num = Number(id);
      return Number.isNaN(num) ? id : num;
    })
  );
  return idSet.has(n) || idSet.has(String(n));
}

export default async function MenuPage() {
  const { userId, data: userFunctions } = await getMenuData();
  const gridRows = userFunctions ?? [];

  const menuVisibility = {
    equipmentCategories: hasFunctionId(gridRows, 1),
    equipmentTypes: hasFunctionId(gridRows, 2),
    equipmentItems: hasFunctionId(gridRows, 3),
    mines: hasFunctionId(gridRows, 4),
    shafts: hasFunctionId(gridRows, 5),
    sections: hasFunctionId(gridRows, 6),
    gangs: hasFunctionId(gridRows, 7),
    parts: hasFunctionId(gridRows, 8),
    addJob: hasFunctionId(gridRows, 9),
    notes: hasFunctionId(gridRows, 10),
    equipmentList: hasFunctionId(gridRows, 11),
    serviceList: hasFunctionId(gridRows, 12),
    permissions: hasFunctionId(gridRows, 13),
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="relative flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Menu
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
      <div className="flex flex-1">
      <aside
        className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-[#00008B] dark:border-zinc-700 dark:bg-[#00008B]"
        aria-label="Navigation"
      >
        <div className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-200">
            Navigation
          </h2>
        </div>
        <MenuTree menuVisibility={menuVisibility} />
      </aside>
      <main className="relative flex min-h-0 flex-1 flex-col items-center overflow-auto px-8 py-4">
        <div className="w-full max-w-4xl">
          <div className="relative h-[60vh] min-h-[200px] w-full">
            <Image
              src="/MT%20Menu.png"
              alt="MT Menu"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          {userId != null && (
            <input
              type="text"
              name="usr"
              readOnly
              value={userId}
              className="hidden mt-2 block w-full max-w-xs border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Logged on user"
            />
          )}
        </div>
        {gridRows.length > 0 && (
          <div className="hidden mt-4 w-full max-w-2xl overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <th className="px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    function_id
                  </th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((row, index) => (
                  <tr
                    key={row.function_id ?? index}
                    className="border-b border-zinc-200 dark:border-zinc-700"
                  >
                    <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200">
                      {row.function_id != null ? String(row.function_id) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
