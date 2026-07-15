"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCandidateStatus(candidateId: string, status: "qualified" | "rejected" | "needs_review") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({ status })
    .eq("id", candidateId);

  if (error) {
    console.error("🔥 COULD NOT UPDATE CANDIDATE STATUS:", error.message);
    throw new Error("Failed to update candidate status.");
  }

  revalidatePath(`/candidates/${candidateId}`);
  revalidatePath("/candidates");
  revalidatePath("/dashboard");
}