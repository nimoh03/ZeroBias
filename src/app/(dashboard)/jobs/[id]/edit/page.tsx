import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import EditJobForm from "./EditJobForm";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // Editing is admin-only. A member could technically SELECT this job
    // (they can see it if they're assigned to it), but the UPDATE policy
    // is admin-only — better to redirect cleanly here than let them load
    // a form whose Save button would silently fail against RLS.
    redirect("/jobs");
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) {
    console.error("🔥 JOB NOT FOUND:", error?.message);
    return notFound();
  }

  // must_haves / nice_to_haves are stored as "- item\n- item" text blobs —
  // turn them back into arrays for the tag inputs.
  const parseTags = (raw: string | null) =>
    (raw || "")
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);

  return (
    <EditJobForm
      jobId={job.id}
      initialData={{
        title: job.title || "",
        location: job.location || "",
        jobType: job.job_type || "Full-time",
        description: job.description || "",
        finalAction: job.final_action || "",
        interviewSlots: (job.interview_slots_template || []).map((s: { time: string; link: string }) => ({ time: s.time, link: s.link })),
        status: job.status === "paused" ? "paused" : "active",
        requestCv: !!job.request_cv,
        screeningRigor: job.screening_rigor === "trusting" ? "trusting" : "thorough",
        mustHaves: parseTags(job.must_haves),
        niceToHaves: parseTags(job.nice_to_haves),
      }}
      publicSlug={job.public_slug}
    />
  );
}