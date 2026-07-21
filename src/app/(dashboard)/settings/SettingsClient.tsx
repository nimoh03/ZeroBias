"use client";

import { useState } from 'react';
import {
  Palette, Users, CreditCard,
  UploadCloud, Shield
} from 'lucide-react';

type Quota = {
  completed: number;
  limit: number;
  remaining: number;
  resetsOn: string;
};

export default function SettingsClient({ quota }: { quota: Quota }) {
  const [activeTab, setActiveTab] = useState('branding');
  const pct = quota.limit > 0 ? Math.min((quota.completed / quota.limit) * 100, 100) : 0;
  const isNearLimit = quota.remaining > 0 && quota.remaining <= Math.max(quota.limit * 0.1, 5);
  const isOverLimit = quota.remaining === 0 && quota.completed >= quota.limit;

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

      {/* Tab Content: Billing — monthly screening quota only, no cost figures */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Completed Screenings This Month</p>
                <p className="text-3xl font-bold text-on-surface mt-2">
                  {quota.completed} <span className="text-lg font-normal text-on-surface-variant">/ {quota.limit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${isOverLimit ? 'text-error' : isNearLimit ? 'text-amber-600' : 'text-primary'}`}>
                  {quota.remaining}
                </p>
                <p className="text-xs text-on-surface-variant">remaining</p>
              </div>
            </div>

            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-error' : isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {isOverLimit && (
              <p className="text-xs text-error font-bold mt-3">You've reached this month's included screenings. Contact us to increase your plan.</p>
            )}
            {isNearLimit && !isOverLimit && (
              <p className="text-xs text-amber-600 font-bold mt-3">You're close to this month's limit.</p>
            )}
            {!isNearLimit && !isOverLimit && (
              <p className="text-xs text-on-surface-variant mt-3">Resets {quota.resetsOn}.</p>
            )}
          </div>

        </div>
      )}

      {/* Tab Content: Placeholder for Team */}
      {activeTab === 'team' && (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant border-dashed animate-in fade-in duration-500">
          <Shield size={48} className="text-outline-variant mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Coming Soon</h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-sm text-center">Team management features are currently being built. Check back soon!</p>
        </div>
      )}

    </div>
  );
}