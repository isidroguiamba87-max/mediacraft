"use server";

import { revalidatePath } from "next/cache";
import { deletePanelMessage, setNewPanelToken } from "@/lib/supabase/panelRoom";

export async function newPanelLinkAction(eventId: string) {
  await setNewPanelToken(eventId);
  revalidatePath("/admin/interacao");
}

export async function deletePanelMessageAction(id: string) {
  await deletePanelMessage(id);
  revalidatePath("/admin/interacao");
}
