import { createClient } from "@/utils/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("use_own_keys, groq_api_key, gemini_api_key")
    .eq("id", user?.id)
    .single();

  // Only booleans ever leave the server — the raw key values are never
  // sent to the browser once saved.
  return (
    <SettingsClient
      initialUseOwnKeys={!!profile?.use_own_keys}
      hasGroqKey={!!profile?.groq_api_key}
      hasGeminiKey={!!profile?.gemini_api_key}
    />
  );
}