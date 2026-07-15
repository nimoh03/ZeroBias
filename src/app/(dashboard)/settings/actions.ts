"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveApiKeys(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const useOwnKeys = formData.get("useOwnKeys") === "on";
  const groqKey = (formData.get("groqKey") as string | null)?.trim();
  const geminiKey = (formData.get("geminiKey") as string | null)?.trim();

  // Only overwrite a key if the recruiter actually typed something new.
  // An empty field means "leave whatever's already saved alone" — this
  // stops a blank input from silently wiping a saved key on re-save.
  const update: Record<string, unknown> = { use_own_keys: useOwnKeys };
  if (groqKey) update.groq_api_key = groqKey;
  if (geminiKey) update.gemini_api_key = geminiKey;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    console.error("🔥 COULD NOT SAVE API KEYS:", error.message);
    throw new Error("Failed to save settings. Please try again.");
  }

  revalidatePath("/settings");
}

export async function clearApiKey(provider: "groq" | "gemini") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");

  const column = provider === "groq" ? "groq_api_key" : "gemini_api_key";
  const { error } = await supabase.from("profiles").update({ [column]: null }).eq("id", user.id);
  if (error) {
    console.error(`🔥 COULD NOT CLEAR ${provider} KEY:`, error.message);
    throw new Error("Failed to remove key.");
  }
  revalidatePath("/settings");
}