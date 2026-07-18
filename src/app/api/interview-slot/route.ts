import { createAdminClient } from "@/utils/supabase/admin";

// Same 30-minute grace window as resetIfInterviewExpired in the recruiter
// action.ts — kept as a separate constant here since this route uses the
// admin client (no recruiter session available on the public apply page),
// so it can't import that session-bound server action directly.
const GRACE_MS = 30 * 60 * 1000;

// Deterministic, zero-AI-token endpoints for the candidate-facing interview
// slot picker. GET checks whether slots are waiting / already picked (used
// so the chat UI can show the picker even if the candidate closed the tab
// and comes back later, after the recruiter has scheduled). POST records
// the candidate's choice.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId");
  if (!candidateId) {
    return Response.json({ error: "Missing candidateId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("candidates")
    .select("status, interview_slots, selected_slot")
    .eq("id", candidateId)
    .single();

  if (error || !data) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Lazily reset a slot that's well past its scheduled time — the
  // candidate shouldn't see a stale "you're booked for 3 days ago".
  let selectedSlot = data.selected_slot || null;
  let interviewSlots = data.interview_slots || [];
  if (selectedSlot?.time && Date.now() - new Date(selectedSlot.time).getTime() > GRACE_MS) {
    await supabase
      .from("candidates")
      .update({ interview_slots: [], selected_slot: null, interview_scheduled_at: null })
      .eq("id", candidateId);
    selectedSlot = null;
    interviewSlots = [];
  }

  return Response.json({
    status: data.status,
    interviewSlots,
    selectedSlot,
  });
}

export async function POST(req: Request) {
  const { candidateId, slotId } = await req.json();
  if (!candidateId || !slotId) {
    return Response.json({ error: "Missing candidateId or slotId" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: candidate, error: fetchError } = await supabase
    .from("candidates")
    .select("interview_slots, selected_slot")
    .eq("id", candidateId)
    .single();

  if (fetchError || !candidate) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  // Already picked — don't let a stale/duplicate request from a slow
  // client silently reassign the interview to a different slot.
  if (candidate.selected_slot) {
    return Response.json({ selectedSlot: candidate.selected_slot });
  }

  const slots: { id: string; time: string; link: string }[] = candidate.interview_slots || [];
  const chosen = slots.find(s => s.id === slotId);
  if (!chosen) {
    return Response.json({ error: "That time is no longer available." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("candidates")
    .update({ selected_slot: chosen, interview_scheduled_at: chosen.time })
    .eq("id", candidateId);

  if (updateError) {
    console.error("🔥 COULD NOT SAVE SELECTED SLOT:", updateError.message);
    return Response.json({ error: "Failed to save your selection." }, { status: 500 });
  }

  return Response.json({ selectedSlot: chosen });
}