"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createJobAction(data: {
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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a job.");
  }

  // Generate a clean, unique URL slug (e.g., "senior-frontend-engineer-a4f2b")
  const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const randomString = Math.random().toString(36).substring(2, 7);
  const public_slug = `${slugBase}-${randomString}`;

  const { error } = await supabase.from('jobs').insert({
    recruiter_id: user.id,
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
    public_slug: public_slug,
    status: 'active'
  });

  if (error) {
    console.error("Job Creation Error:", error.message);
    throw new Error("Failed to create the job. Please try again.");
  }

  // Clear the dashboard cache so the new job appears immediately, then redirect
  revalidatePath("/dashboard");
  redirect("/dashboard");
}