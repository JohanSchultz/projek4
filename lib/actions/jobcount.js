"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetches job count per equipment item from Supabase RPC.
 * @param {string | null} p_fromdate - From date (YYYY-MM-DD)
 * @param {string | null} p_todate - To date (YYYY-MM-DD)
 * @returns {{ data: Array<{ type, serialno, pistonno, mine, shaft, section, gang, jobcount }> | null, error: string | null }}
 */
export async function getJobCountPerItem(p_fromdate, p_todate) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
    .rpc("get_jobcountper_item", {
      p_fromdate: p_fromdate || null,
      p_todate: p_todate || null,
    })
    .range(0,10000)
    ;
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}
