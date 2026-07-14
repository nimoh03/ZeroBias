import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import CandidateChatUI from "./CandidateChatUI";

export default async function CandidateApplyPage({ params }: { params: { slug: string } }) {
  // 1. Await params to prevent Next.js routing crashes
  const resolvedParams = await params;
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

  // 5. If everything passes, load Nova!
  return <CandidateChatUI job={job} />;
}