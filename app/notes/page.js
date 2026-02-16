import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotesContent } from "./NotesContent";

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

async function searchEquipmentItemsBySerial(searchText, equipmenttypesId) {
  "use server";
  try {
    const term =
      typeof searchText === "string" ? searchText.trim() : "";
    const typeId = Number(equipmenttypesId);
    if (term.length < 2 || !typeId || Number.isNaN(typeId)) {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("equipmentitems")
      .select("id, serialno, equipmenttypes(descr)")
      .ilike("serialno", `${term}%`)
      .eq("equipmenttypes_id", typeId)
      .eq("isactive", true)
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

async function getAllNotes() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_allnotes");
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function getNotesLikeSerialno(p_serialno) {
  "use server";
  try {
    const term = typeof p_serialno === "string" ? p_serialno.trim() : "";
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_noteslikeserialno", {
      p_serialno: term,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function getCommentsByNoteId(p_note_id) {
  "use server";
  try {
    const noteId = p_note_id != null ? Number(p_note_id) : null;
    if (noteId == null || Number.isNaN(noteId)) {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_commentsbynoteid", {
      p_note_id: noteId,
    });
    if (error) throw error;
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function updateNote(noteId, equipmentitemId, techniciansId, description, isfinalised) {
  "use server";
  try {
    const id = noteId != null ? Number(noteId) : null;
    if (id == null || Number.isNaN(id)) {
      return { error: "Invalid note." };
    }
    const itemId = equipmentitemId != null ? Number(equipmentitemId) : null;
    const techId = techniciansId != null ? Number(techniciansId) : null;
    if (itemId == null || Number.isNaN(itemId)) {
      return { error: "Please select an equipment item (search and choose from the list)." };
    }
    if (techId == null || Number.isNaN(techId) || techId === 0) {
      return { error: "Please select a technician." };
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("notes")
      .update({
        equipmentitems_id: itemId,
        technicians_id: techId,
        description: typeof description === "string" ? description.trim() || null : null,
        isfinalised: Boolean(isfinalised),
      })
      .eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function deleteNote(noteId) {
  "use server";
  try {
    const id = noteId != null ? Number(noteId) : null;
    if (id == null || Number.isNaN(id)) {
      return { error: "Invalid note." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    const msg = err?.message ?? String(err);
    if (
      typeof msg === "string" &&
      msg.includes("notecomments") &&
      (msg.includes("foreign key") || msg.includes("fk_notes"))
    ) {
      return { error: "Can't delete the Note because there are Comments against it." };
    }
    return { error: msg };
  }
}

async function insertNoteComment(techniciansId, comment, noteid) {
  "use server";
  try {
    const techId = techniciansId != null ? Number(techniciansId) : null;
    const noteId = noteid != null ? Number(noteid) : null;
    if (techId == null || Number.isNaN(techId) || techId === 0) {
      return { error: "Please select a commenting technician." };
    }
    if (noteId == null || Number.isNaN(noteId)) {
      return { error: "Please select a note (select a row in the grid or from Search Note)." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("notecomments").insert({
      technicians_id: techId,
      comment: typeof comment === "string" ? comment.trim() || null : null,
      noteid: noteId,
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function deleteNoteComment(commentId) {
  "use server";
  try {
    const id = commentId != null ? Number(commentId) : null;
    if (id == null || Number.isNaN(id)) {
      return { error: "No comment selected." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("notecomments").delete().eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function insertNote(equipmentitemId, techniciansId, description, isfinalised) {
  "use server";
  try {
    const itemId = equipmentitemId != null ? Number(equipmentitemId) : null;
    const techId = techniciansId != null ? Number(techniciansId) : null;
    if (itemId == null || Number.isNaN(itemId)) {
      return { error: "Please select an equipment item (search and choose from the list)." };
    }
    if (techId == null || Number.isNaN(techId) || techId === 0) {
      return { error: "Please select a technician." };
    }
    const supabase = await createClient();
    const { error } = await supabase.from("notes").insert({
      equipmentitems_id: itemId,
      technicians_id: techId,
      description: typeof description === "string" ? description.trim() || null : null,
      isfinalised: Boolean(isfinalised),
    });
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

export default async function NotesPage() {
  const { data: categories } = await getEquipmentCategories();
  const { data: types } = await getEquipmentTypes();
  const { data: technicians } = await getTechnicians();
  const { data: allNotes } = await getAllNotes();
  const categoryList = categories ?? [];
  const typeList = types ?? [];
  const techniciansList = technicians ?? [];
  const notesGridData = allNotes ?? [];

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
          Notes
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
        <NotesContent
          categories={categoryList}
          types={typeList}
          technicians={techniciansList}
          allNotes={notesGridData}
          searchEquipmentItemsBySerial={searchEquipmentItemsBySerial}
          getNotesLikeSerialno={getNotesLikeSerialno}
          getCommentsByNoteId={getCommentsByNoteId}
          getEquipmentItemById={getEquipmentItemById}
          insertNote={insertNote}
          insertNoteComment={insertNoteComment}
          deleteNoteComment={deleteNoteComment}
          updateNote={updateNote}
          deleteNote={deleteNote}
        />
      </main>
    </div>
  );
}
