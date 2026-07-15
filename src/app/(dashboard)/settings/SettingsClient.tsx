"use client";

import { useState, useTransition } from 'react';
import {
  Palette, Users, CreditCard, Webhook,
  UploadCloud, Key, Shield, CheckCircle2,
  AlertCircle, Server, Loader2, XCircle
} from 'lucide-react';
import { saveApiKeys, clearApiKey } from './actions';

export default function SettingsClient({
  initialUseOwnKeys,
  hasGroqKey,
  hasGeminiKey,
}: {
  initialUseOwnKeys: boolean;
  hasGroqKey: boolean;
  hasGeminiKey: boolean;
}) {
  const [activeTab, setActiveTab] = useState('branding');
  const [useCustomKeys, setUseCustomKeys] = useState(initialUseOwnKeys);
  const [isPending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);

  const handleApiSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await saveApiKeys(formData);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2500);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const handleClear = (provider: "groq" | "gemini") => {
    startTransition(async () => {
      try {
        await clearApiKey(provider);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant mt-1">Manage your workspace, branding, and integrations.</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-outline-variant hide-scrollbar">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'branding' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          <Palette size={18} /> Branding
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'api' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          <Webhook size={18} /> API & Integrations
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          <Users size={18} /> Team
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'billing' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
        >
          <CreditCard size={18} /> Billing
        </button>
      </div>

      {/* Tab Content: Branding (not yet wired up) */}
      {activeTab === 'branding' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface">Company Logo</h3>
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="w-24 h-24 rounded-2xl bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center text-outline">
                <UploadCloud size={32} />
              </div>
              <div className="space-y-3 flex-1">
                <p className="text-sm text-on-surface-variant">Used in candidate portals and PDF exports. Recommended size: 256x256px.</p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">Upload Image</button>
                  <button className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold hover:bg-surface-container-low transition-colors">Remove</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-surface">Brand Color</h3>
            <p className="text-sm text-on-surface-variant">Select your main corporate color for the candidate chat interface.</p>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-primary shadow-inner border border-black/10 ring-2 ring-primary/20 ring-offset-2 ring-offset-surface"></div>
              <input type="text" defaultValue="#004ac6" className="w-32 bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: API & Integrations */}
      {activeTab === 'api' && (
        <form action={handleApiSubmit} id="api-settings-form" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2"><Server size={20} className="text-primary"/> AI Model Configuration</h3>
                <p className="text-sm text-on-surface-variant mt-1">Configure how HireFlow connects to LLM providers.</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-on-surface">HireFlow Managed Intelligence</p>
                  <p className="text-xs text-on-surface-variant mt-1">Use our default managed keys. Best for stability and speed.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="useOwnKeys"
                  className="sr-only peer"
                  checked={useCustomKeys}
                  onChange={() => setUseCustomKeys(!useCustomKeys)}
                />
                <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-xs text-on-surface-variant -mt-2">Toggle on to bring your own keys instead.</p>

            {useCustomKeys && (
              <div className="space-y-5 pt-4 border-t border-outline-variant animate-in slide-in-from-top-2">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
                  <AlertCircle className="text-orange-600 shrink-0" size={18} />
                  <p className="text-xs text-orange-800">Using custom keys transfers API costs to your provider accounts and may affect response latency. Keys are stored securely and never shown again after saving — only used server-side.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Groq API Key {hasGroqKey && <span className="text-emerald-600 font-normal">· saved</span>}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="password"
                        name="groqKey"
                        placeholder={hasGroqKey ? "•••••••••••••••• (leave blank to keep)" : "gsk_..."}
                        className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    </div>
                    {hasGroqKey && (
                      <button type="button" onClick={() => handleClear("groq")} className="px-3 text-xs font-bold text-error hover:bg-error-container/40 rounded-lg transition-colors flex items-center gap-1">
                        <XCircle size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Gemini API Key {hasGeminiKey && <span className="text-emerald-600 font-normal">· saved</span>}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="password"
                        name="geminiKey"
                        placeholder={hasGeminiKey ? "•••••••••••••••• (leave blank to keep)" : "AIzaSy..."}
                        className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                      <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    </div>
                    {hasGeminiKey && (
                      <button type="button" onClick={() => handleClear("gemini")} className="px-3 text-xs font-bold text-error hover:bg-error-container/40 rounded-lg transition-colors flex items-center gap-1">
                        <XCircle size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Tab Content: Placeholder for Team & Billing */}
      {(activeTab === 'team' || activeTab === 'billing') && (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant border-dashed animate-in fade-in duration-500">
          <Shield size={48} className="text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Coming Soon</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm text-center">The {activeTab} management features are currently being built. Check back soon!</p>
        </div>
      )}

      {/* Save Button — only functional on the API tab for now */}
      {activeTab === 'api' && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            type="submit"
            form="api-settings-form"
            disabled={isPending}
            className="px-6 py-3 bg-primary text-on-primary rounded-full text-sm font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform disabled:opacity-70 flex items-center gap-2"
          >
            {isPending ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : savedFlash ? <><CheckCircle2 size={16} /> Saved</> : "Save Changes"}
          </button>
        </div>
      )}

    </div>
  );
}