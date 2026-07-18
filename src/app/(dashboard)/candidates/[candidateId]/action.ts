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

export type InterviewSlotInput = { time: string; link: string };

// Recruiter offers one or more interview time slots. Resets any prior
// selection — if the recruiter is re-scheduling, the candidate needs to
// pick again from the fresh list. No AI involved anywhere in this path.
export async function setInterviewSlots(candidateId: string, slots: InterviewSlotInput[]) {
  const supabase = await createClient();

  const normalized = slots
    .filter(s => s.time && s.link)
    .map(s => ({ id: crypto.randomUUID(), time: new Date(s.time).toISOString(), link: s.link.trim() }));

  if (normalized.length === 0) {
    throw new Error("Add at least one valid time and link.");
  }

  const { error } = await supabase
    .from("candidates")
    .update({ interview_slots: normalized, selected_slot: null, interview_scheduled_at: null })
    .eq("id", candidateId);

  if (error) {
    console.error("🔥 COULD NOT SAVE INTERVIEW SLOTS:", error.message);
    throw new Error("Failed to save interview slots.");
  }

  revalidatePath(`/candidates/${candidateId}`);
}

// Recruiter clears/cancels the offered interview entirely.
export async function clearInterviewSlots(candidateId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidates")
    .update({ interview_slots: [], selected_slot: null, interview_scheduled_at: null })
    .eq("id", candidateId);

  if (error) {
    console.error("🔥 COULD NOT CLEAR INTERVIEW SLOTS:", error.message);
    throw new Error("Failed to clear interview slots.");
  }

  revalidatePath(`/candidates/${candidateId}`);
}

// A scheduled interview that's more than GRACE_MS past its time is treated
// as expired — the window to actually run it has passed. Rather than a
// background cron, this resets it lazily the next time anyone (recruiter
// page or candidate chat poll) touches this candidate. After the reset,
// the candidate falls back to "our team will get back to you shortly" and
// the recruiter sees an empty scheduler ready to be re-filled.
const GRACE_MS = 30 * 60 * 1000; // 30 minutes past the scheduled time

export async function resetIfInterviewExpired(candidateId: string, selectedSlot: { time: string } | null) {
  if (!selectedSlot?.time) return false;
  const isExpired = Date.now() - new Date(selectedSlot.time).getTime() > GRACE_MS;
  if (!isExpired) return false;

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidates")
    .update({ interview_slots: [], selected_slot: null, interview_scheduled_at: null })
    .eq("id", candidateId);

  if (error) {
    console.error("🔥 COULD NOT RESET EXPIRED INTERVIEW:", error.message);
    return false;
  }
  return true;
}