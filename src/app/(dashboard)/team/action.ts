"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createInviteAction(role: "admin" | "member") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to invite a teammate.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can invite teammates.");
  }

  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ organization_id: profile.organization_id, created_by: user.id, role })
    .select("token")
    .single();

  if (error || !invite) {
    console.error("🔥 COULD NOT CREATE INVITE:", error?.message);
    throw new Error("Could not create the invite. Please try again.");
  }

  revalidatePath("/team");
  return invite.token as string;
}

// Only 'member' role teammates need explicit assignment — an admin
// already sees every job in the org regardless of job_members, so
// listing them here too would be misleading (checking/unchecking an
// admin would visibly do nothing).
export async function updateJobMembersAction(jobId: string, memberIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can assign team members to a job.");
  }

  // Replace-all, same as the edit form's picker.
  const { error: clearError } = await supabase.from("job_members").delete().eq("job_id", jobId);
  if (clearError) {
    throw new Error("Could not update assignments. Please try again.");
  }
  if (memberIds.length > 0) {
    const { error: insertError } = await supabase.from("job_members").insert(
      memberIds.map((profile_id) => ({ job_id: jobId, profile_id }))
    );
    if (insertError) {
      throw new Error("Could not update assignments. Please try again.");
    }
  }

  revalidatePath("/jobs");
}

export async function getAssignableMembersAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) return [];

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile.organization_id)
    .eq("role", "member")
    .order("full_name", { ascending: true });

  return members || [];
}

export async function getJobMemberIdsAction(jobId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("job_members").select("profile_id").eq("job_id", jobId);
  return (data || []).map((row) => row.profile_id as string);
}

export async function removeTeamMemberAction(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }
  if (profileId === user.id) {
    throw new Error("You can't remove yourself from the team.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("Only admins can remove teammates.");
  }

  // Scoped to this admin's own organization — the .eq("organization_id", ...)
  // means this can never touch a profile in a different org even if the
  // profileId were somehow guessed/wrong.
  const { error } = await supabase
    .from("profiles")
    .update({ organization_id: null, role: "admin" })
    .eq("id", profileId)
    .eq("organization_id", profile.organization_id);

  if (error) {
    console.error("🔥 COULD NOT REMOVE TEAM MEMBER:", error.message);
    throw new Error("Could not remove that teammate. Please try again.");
  }

  revalidatePath("/team");
}