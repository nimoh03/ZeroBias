import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TeamPageClient from "./TeamPageCleint";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!myProfile) redirect("/login");

  // RLS already scopes this to "profiles in my own organization" — no
  // extra .eq needed, but being explicit here costs nothing and makes
  // the intent obvious to anyone reading this later.
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", myProfile.organization_id)
    .order("role", { ascending: true }); // admins first

  return (
    <TeamPageClient
      members={members || []}
      currentUserId={user.id}
      isAdmin={myProfile.role === "admin"}
    />
  );
}