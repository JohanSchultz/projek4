import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipmentItemsContent } from "./EquipmentItemsContent";

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

async function getEquipmentTypes() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmenttypes")
      .select("id, descr, equipmentcategories_id")
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

async function insertEquipmentItem(
  equipmenttypes_id,
  mine_id,
  shaft_id,
  section_id,
  gang_id,
  serialno,
  pistonno,
  isactive
) {
  "use server";
  try {
    if (equipmenttypes_id == null || Number(equipmenttypes_id) === 0) {
      return { error: "Please select an equipment type." };
    }
    if (mine_id == null || Number(mine_id) === 0) {
      return { error: "Please select a Mine." };
    }
    if (shaft_id == null || Number(shaft_id) === 0) {
      return { error: "Please select a Shaft." };
    }
    if (section_id == null || Number(section_id) === 0) {
      return { error: "Please select a Section." };
    }
    const trimmedSerial =
      typeof serialno === "string" ? String(serialno).trim() : "";
    if (!trimmedSerial) {
      return { error: "Serial Number is required." };
    }
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("equipmentitems")
      .select("id")
      .eq("serialno", trimmedSerial)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return { error: "Duplicate serial number." };
    }
    const row = {
      equipmenttypes_id: Number(equipmenttypes_id),
      serialno: trimmedSerial || null,
      pistonno:
        typeof pistonno === "string" ? String(pistonno).trim() || null : null,
      isactive: Boolean(isactive),
    };
    if (mine_id != null && Number(mine_id) !== 0)
      row.mine_id = Number(mine_id);
    if (shaft_id != null && Number(shaft_id) !== 0)
      row.shaft_id = Number(shaft_id);
    if (section_id != null && Number(section_id) !== 0)
      row.section_id = Number(section_id);
    if (gang_id != null && Number(gang_id) !== 0)
      row.gang_id = Number(gang_id);
    const { error } = await supabase.from("equipmentitems").insert(row);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function updateEquipmentItem(
  id,
  equipmenttypes_id,
  mine_id,
  shaft_id,
  section_id,
  gang_id,
  serialno,
  pistonno,
  isactive
) {
  "use server";
  try {
    const numId = Number(id);
    if (equipmenttypes_id != null) {
      if (Number(equipmenttypes_id) === 0) {
        return { error: "Please select an equipment type." };
      }
    }
    if (mine_id != null && Number(mine_id) === 0) {
      return { error: "Please select a Mine." };
    }
    if (shaft_id != null && Number(shaft_id) === 0) {
      return { error: "Please select a Shaft." };
    }
    if (section_id != null && Number(section_id) === 0) {
      return { error: "Please select a Section." };
    }
    const trimmedSerial =
      typeof serialno === "string" ? String(serialno).trim() : "";
    if (typeof serialno === "string" && !trimmedSerial) {
      return { error: "Serial Number is required." };
    }
    const supabase = await createClient();
    if (trimmedSerial) {
      const { data: duplicate } = await supabase
        .from("equipmentitems")
        .select("id")
        .eq("serialno", trimmedSerial)
        .neq("id", numId)
        .limit(1)
        .maybeSingle();
      if (duplicate) {
        return { error: "Duplicate serial number." };
      }
    }
    const updates = {};
    if (equipmenttypes_id != null)
      updates.equipmenttypes_id = Number(equipmenttypes_id);
    if (mine_id != null) updates.mine_id = Number(mine_id) === 0 ? null : Number(mine_id);
    if (shaft_id != null) updates.shaft_id = Number(shaft_id) === 0 ? null : Number(shaft_id);
    if (section_id != null) updates.section_id = Number(section_id) === 0 ? null : Number(section_id);
    if (gang_id != null) updates.gang_id = Number(gang_id) === 0 ? null : Number(gang_id);
    if (typeof serialno === "string")
      updates.serialno = serialno.trim() || null;
    if (typeof pistonno === "string")
      updates.pistonno = pistonno.trim() || null;
    if (typeof isactive === "boolean") updates.isactive = isactive;
    const { error } = await supabase
      .from("equipmentitems")
      .update(updates)
      .eq("id", numId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function searchEquipmentItemsBySerial(searchText) {
  "use server";
  try {
    const term =
      typeof searchText === "string" ? searchText.trim() : "";
    if (term.length < 2) {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentitems")
      .select("id, serialno, equipmenttypes(descr)")
      .ilike("serialno", `%${term}%`)
      .order("serialno", { ascending: true });
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

export default async function EquipmentItemsPage() {
  const { data: categories } = await getEquipmentCategories();
  const { data: types } = await getEquipmentTypes();
  const { data: mines } = await getMines();
  const categoryList = categories ?? [];
  const typeList = types ?? [];
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
          Equipment Items
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
        <EquipmentItemsContent
          categories={categoryList}
          types={typeList}
          mines={minesList}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          insertEquipmentItem={insertEquipmentItem}
          updateEquipmentItem={updateEquipmentItem}
          searchEquipmentItemsBySerial={searchEquipmentItemsBySerial}
          getEquipmentItemById={getEquipmentItemById}
        />
      </main>
    </div>
  );
}
