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
    requestCv: boolean;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to edit a job.");
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
      request_cv: !!data.requestCv,
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