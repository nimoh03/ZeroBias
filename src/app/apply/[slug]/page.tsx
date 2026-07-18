import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import CandidateChatUI from "./CandidateChatUI";

export default async function CandidateApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  // 1. Await params to prevent Next.js routing crashes
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  // 2. Query the database using 'public_slug' specifically
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*, profiles(company_name)')
    .eq('public_slug', resolvedParams.slug)
    .single();

  // 3. Catch errors and log them to your VS Code terminal
  if (error) {
    console.error("🔥 SUPABASE DATABASE ERROR:", error.message);
  }

  // 4. If the job still doesn't exist, log the slug to ensure it matches
  if (!job) {
    console.error("🔥 JOB NOT FOUND FOR SLUG:", resolvedParams.slug);
    return notFound();
  }

  // 5. A paused job stays reachable by its link but stops taking new
  // applicants — surface that clearly instead of handing them to Nova.
  if (job.status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">{job.title}</h1>
          <p className="text-sm text-slate-500 mb-1">{job.location}</p>
          <p className="text-sm text-slate-600 mt-4">
            This role isn&apos;t accepting new applications right now. Check back later, or reach out to {job.profiles?.company_name || "the hiring team"} directly if you&apos;ve already applied.
          </p>
        </div>
      </div>
    );
  }

  // 6. If everything passes, load Nova!
  return <CandidateChatUI job={job} source={resolvedSearchParams.src || "direct"} />;
}