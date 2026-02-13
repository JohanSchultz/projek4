import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartsContent } from "./PartsContent";

async function getActiveEquipmentTypes() {
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

async function getPartsPerTypeByPartId(partId) {
  "use server";
  try {
    const id = Number(partId);
    if (Number.isNaN(id)) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partspertype")
      .select("typeid")
      .eq("partid", id);
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function searchPartsByStockCode(prefix) {
  "use server";
  try {
    const trimmed = typeof prefix === "string" ? prefix.trim() : "";
    if (trimmed.length < 2) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parts")
      .select("id, stockcode, part, matcatno, lastpurchaseprice, costa, binno, stocklevel, reorder, isactive")
      .ilike("stockcode", trimmed + "%")
      .order("stockcode", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function searchPartsByDescription(prefix) {
  "use server";
  try {
    const trimmed = typeof prefix === "string" ? prefix.trim() : "";
    if (trimmed.length < 3) return { data: [], error: null };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parts")
      .select("id, stockcode, part, matcatno, lastpurchaseprice, costa, binno, stocklevel, reorder, isactive")
      .ilike("part", trimmed + "%")
      .order("part", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function insertPart(
  stockcode,
  part,
  matcatno,
  lastpurchaseprice,
  costa,
  binno,
  stocklevel,
  reorder,
  isactive
) {
  "use server";
  try {
    const trimmedStockcode = stockcode != null ? String(stockcode).trim() : "";
    const trimmedPart = part != null ? String(part).trim() : "";
    if (!trimmedStockcode) return { error: "Stock Code is required." };
    if (!trimmedPart) return { error: "Description is required." };

    const supabase = await createClient();
    const { data: existingStockcode } = await supabase
      .from("parts")
      .select("id")
      .eq("stockcode", trimmedStockcode)
      .limit(1)
      .maybeSingle();
    if (existingStockcode) return { error: "A part with this Stock Code already exists." };

    const trimmedMatcatno = matcatno != null ? String(matcatno).trim() : "";
    if (trimmedMatcatno !== "") {
      const { data: existingMatcatno } = await supabase
        .from("parts")
        .select("id")
        .eq("matcatno", trimmedMatcatno)
        .limit(1)
        .maybeSingle();
      if (existingMatcatno) return { error: "A part with this Mat Cat Number already exists." };
    }

    const row = {
      stockcode: trimmedStockcode,
      part: trimmedPart,
      matcatno: trimmedMatcatno || null,
      lastpurchaseprice:
        lastpurchaseprice != null && String(lastpurchaseprice).trim() !== ""
          ? Number(String(lastpurchaseprice).trim()) || null
          : null,
      costa:
        costa != null && String(costa).trim() !== ""
          ? Number(String(costa).trim()) || null
          : null,
      binno: binno != null ? String(binno).trim() || null : null,
      stocklevel:
        stocklevel != null && String(stocklevel).trim() !== ""
          ? Number(String(stocklevel).trim()) || null
          : null,
      reorder:
        reorder != null && String(reorder).trim() !== ""
          ? Number(String(reorder).trim()) || null
          : null,
      isactive: Boolean(isactive),
    };
    const { data: inserted, error } = await supabase
      .from("parts")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { data: { id: inserted?.id }, error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function deletePartsPerTypeByPartId(partId) {
  "use server";
  try {
    const partIdNum = Number(partId);
    if (Number.isNaN(partIdNum)) return { error: "Invalid part id." };
    const supabase = await createClient();
    const { error } = await supabase
      .from("partspertype")
      .delete()
      .eq("partid", partIdNum);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function insertPartsPerType(partId, typeIds) {
  "use server";
  try {
    const partIdNum = Number(partId);
    if (Number.isNaN(partIdNum)) return { error: "Invalid part id." };
    const ids = Array.isArray(typeIds) ? typeIds.filter((id) => id != null && Number(id) > 0) : [];
    if (ids.length === 0) return { error: null };
    const supabase = await createClient();
    const rows = ids.map((typeid) => ({
      partid: partIdNum,
      typeid: Number(typeid),
    }));
    const { error } = await supabase.from("partspertype").insert(rows);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function updatePart(
  id,
  stockcode,
  part,
  matcatno,
  lastpurchaseprice,
  costa,
  binno,
  stocklevel,
  reorder,
  isactive
) {
  "use server";
  try {
    const numId = Number(id);
    if (Number.isNaN(numId)) return { error: "Invalid part id." };

    if (stockcode !== undefined) {
      const trimmed = stockcode != null ? String(stockcode).trim() : "";
      if (!trimmed) return { error: "Stock Code is required." };
    }
    if (part !== undefined) {
      const trimmed = part != null ? String(part).trim() : "";
      if (!trimmed) return { error: "Description is required." };
    }

    const supabase = await createClient();
    if (stockcode !== undefined) {
      const trimmedStockcode = stockcode != null ? String(stockcode).trim() : "";
      const { data: existing } = await supabase
        .from("parts")
        .select("id")
        .eq("stockcode", trimmedStockcode)
        .neq("id", numId)
        .limit(1)
        .maybeSingle();
      if (existing) return { error: "A part with this Stock Code already exists." };
    }
    if (matcatno !== undefined) {
      const trimmedMatcatno = matcatno != null ? String(matcatno).trim() : "";
      if (trimmedMatcatno !== "") {
        const { data: existing } = await supabase
          .from("parts")
          .select("id")
          .eq("matcatno", trimmedMatcatno)
          .neq("id", numId)
          .limit(1)
          .maybeSingle();
        if (existing) return { error: "A part with this Mat Cat Number already exists." };
      }
    }

    const updates = {};
    if (stockcode !== undefined) updates.stockcode = stockcode != null ? String(stockcode).trim() || null : null;
    if (part !== undefined) updates.part = part != null ? String(part).trim() || null : null;
    if (matcatno !== undefined) updates.matcatno = matcatno != null ? String(matcatno).trim() || null : null;
    if (lastpurchaseprice !== undefined)
      updates.lastpurchaseprice =
        lastpurchaseprice != null && String(lastpurchaseprice).trim() !== ""
          ? Number(String(lastpurchaseprice).trim()) || null
          : null;
    if (costa !== undefined)
      updates.costa =
        costa != null && String(costa).trim() !== ""
          ? Number(String(costa).trim()) || null
          : null;
    if (binno !== undefined) updates.binno = binno != null ? String(binno).trim() || null : null;
    if (stocklevel !== undefined)
      updates.stocklevel =
        stocklevel != null && String(stocklevel).trim() !== ""
          ? Number(String(stocklevel).trim()) || null
          : null;
    if (reorder !== undefined)
      updates.reorder =
        reorder != null && String(reorder).trim() !== ""
          ? Number(String(reorder).trim()) || null
          : null;
    if (isactive !== undefined) updates.isactive = Boolean(isactive);
    const { error } = await supabase.from("parts").update(updates).eq("id", numId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function PartsPage() {
  const { data: equipmentTypes } = await getActiveEquipmentTypes();
  const equipmentTypeList = equipmentTypes ?? [];

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
          Parts
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
        <PartsContent
          equipmentTypes={equipmentTypeList}
          insertPart={insertPart}
          insertPartsPerType={insertPartsPerType}
          deletePartsPerTypeByPartId={deletePartsPerTypeByPartId}
          updatePart={updatePart}
          searchPartsByStockCode={searchPartsByStockCode}
          searchPartsByDescription={searchPartsByDescription}
          getPartsPerTypeByPartId={getPartsPerTypeByPartId}
        />
      </main>
    </div>
  );
}
