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