"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateJobAction(
  jobId: string,
  data: {
    title: string;
    location: string;
    jobType: string;
    description: string;
    mustHaves: string;
    niceToHaves: string;
    finalAction: string;
    interviewSlots?: { time: string; link: string }[];
    requestCv: boolean;
    screeningRigor?: "thorough" | "trusting";
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to edit a job.");
  }

  // Same rule as job creation: don't let an edit leave a live job with
  // neither must-haves nor nice-to-haves — the screening would have
  // nothing left to actually check candidates against.
  if (!data.mustHaves?.trim() && !data.niceToHaves?.trim()) {
    throw new Error("Add at least one must-have or nice-to-have before saving — the screening needs something to check candidates against.");
  }

  // Only touch a job that actually belongs to this recruiter.
  const { error } = await supabase
    .from('jobs')
    .update({
      title: data.title,
      location: data.location,
      job_type: data.jobType,
      description: data.description,
      must_haves: data.mustHaves,
      nice_to_haves: data.niceToHaves,
      final_action: data.finalAction || null,
      interview_slots_template: (data.interviewSlots || [])
        .filter(s => s.time && s.link)
        .map(s => ({ time: new Date(s.time).toISOString(), link: s.link.trim() })),
      request_cv: !!data.requestCv,
      screening_rigor: data.screeningRigor === "trusting" ? "trusting" : "thorough",
    })
    .eq('id', jobId)
    .eq('recruiter_id', user.id);

  if (error) {
    console.error("Job Update Error:", error.message);
    throw new Error("Failed to update the job. Please try again.");
  }

  // Clear caches so the change shows up immediately, then head back.
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}/edit`);
  redirect("/jobs");
}

// Pause a job so it stops accepting new applications without deleting it —
// useful the moment a role is filled or put on hold but might reopen.
// Existing candidates, transcripts, and interview bookings are untouched;
// only the public /apply/[slug] page starts turning new applicants away.
export async function setJobStatusAction(jobId: string, status: "active" | "paused") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to change a job's status.");
  }

  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)
    .eq('recruiter_id', user.id);

  if (error) {
    console.error("Job Status Update Error:", error.message);
    throw new Error("Failed to update the job's status. Please try again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}/edit`);
}

export async function deleteJobAction(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete a job.");
  }

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId)
    .eq('recruiter_id', user.id);

  if (error) {
    console.error("Job Delete Error:", error.message);
    throw new Error("Failed to delete the job. Please try again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  redirect("/jobs");
}