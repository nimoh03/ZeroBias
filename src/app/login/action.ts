"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function login(formData: FormData) {
  // Added await here
  const supabase = await createClient();
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Invalid login credentials");
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  // Present only when this signup came from an invite link
  // (/login?invite=<token>) — see page.tsx for where this gets set.
  const inviteToken = formData.get("inviteToken") as string | null;

  // Admin client for everything past this point: invite lookup needs to
  // work for a visitor with no session yet, and the org creation +
  // profile insert both bypass any RLS timing issue (if email
  // confirmation is ever turned on, there's no active session at the
  // instant signUp() returns, which would silently break a
  // session-client insert).
  const admin = createAdminClient();

  // Validate the invite BEFORE creating the auth user — no point
  // creating an account for a link that's already used or expired.
  let organizationId: string | null = null;
  let role: "admin" | "member" = "admin";
  let inviteId: string | null = null;

  if (inviteToken) {
    const { data: invite } = await admin
      .from("invites")
      .select("id, organization_id, role, used_by, expires_at")
      .eq("token", inviteToken)
      .single();

    if (!invite || invite.used_by || new Date(invite.expires_at) < new Date()) {
      redirect("/login?error=This invite link is invalid or has expired.");
    }

    organizationId = invite.organization_id;
    role = invite.role as "admin" | "member";
    inviteId = invite.id;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Could not create account");
  }

  if (data.user) {
    // No invite — this is a brand new agency signing up for the first
    // time. They become the founding admin of their own new org.
    if (!organizationId) {
      const { data: newOrg, error: orgError } = await admin
        .from("organizations")
        .insert({ name: `${firstName}'s Team` })
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("🔥 COULD NOT CREATE ORGANIZATION:", orgError?.message);
        redirect("/login?error=Could not set up your account. Please try again.");
      }
      organizationId = newOrg!.id;
      role = "admin";
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      full_name: `${firstName} ${lastName}`.trim(),
      organization_id: organizationId,
      role,
    });
    if (profileError) {
      console.error("🔥 COULD NOT CREATE PROFILE:", profileError.message);
    }

    if (inviteId) {
      const { error: inviteUpdateError } = await admin
        .from("invites")
        .update({ used_by: data.user.id })
        .eq("id", inviteId);
      if (inviteUpdateError) {
        console.error("⚠️ COULD NOT MARK INVITE USED:", inviteUpdateError.message);
      }
    }
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}