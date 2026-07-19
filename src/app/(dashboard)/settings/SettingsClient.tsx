"use client";

import { useState } from 'react';
import {
  Palette, Users, CreditCard,
  UploadCloud, Shield, Gauge
} from 'lucide-react';

type UsageRow = {
  provider: string;
  model: string;
  callCount: number;
  promptTokens: number;
  completionTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  costUsd: number | null;
};

type UsageSummary = {
  rows: UsageRow[];
  totalCostUsd: number;
  hasUnpricedUsage: boolean;
  completedScreenings: number;
  costPerScreening: number | null;
};

function formatUsd(n: number) {
  return n < 0.01 && n > 0 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function SettingsClient({ usage }: { usage: UsageSummary }) {
  const [activeTab, setActiveTab] = useState('branding');

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

      {/* Tab Content: Billing — real usage/cost data, last 30 days */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Completed Screenings</p>
              <p className="text-3xl font-bold text-on-surface mt-2">{usage.completedScreenings}</p>
              <p className="text-xs text-on-surface-variant mt-1">Last 30 days · candidates with a final decision</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">AI Cost</p>
              <p className="text-3xl font-bold text-on-surface mt-2">{formatUsd(usage.totalCostUsd)}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Last 30 days{usage.hasUnpricedUsage ? " · excludes Gemini fallback calls" : ""}
              </p>
            </div>
            <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Cost / Completed Screening</p>
              <p className="text-3xl font-bold text-on-surface mt-2">
                {usage.costPerScreening !== null ? formatUsd(usage.costPerScreening) : "—"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {usage.costPerScreening !== null
                  ? "The number that actually matters for pricing"
                  : "No completed screenings in this period yet"}
              </p>
            </div>
          </div>

          {usage.hasUnpricedUsage && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-on-surface-variant">
              <Gauge size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Some usage came from the Gemini fallback (used when DeepSeek is unavailable). Gemini currently runs on a free/unconfirmed-pricing tier, so it's shown in tokens below but left out of the dollar totals above — treat the totals as a floor, not the full picture, if Gemini fallback usage is non-trivial.</span>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant">
              <h3 className="text-sm font-bold text-on-surface">Usage by Provider &amp; Model</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Last 30 days</p>
            </div>
            {usage.rows.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-10">No AI usage recorded in this period yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-on-surface-variant uppercase tracking-wide border-b border-outline-variant">
                    <th className="px-6 py-3">Provider / Model</th>
                    <th className="px-6 py-3">Calls</th>
                    <th className="px-6 py-3">Prompt Tokens</th>
                    <th className="px-6 py-3">Completion Tokens</th>
                    <th className="px-6 py-3">Cache Hit / Miss</th>
                    <th className="px-6 py-3 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.rows.map((row) => (
                    <tr key={`${row.provider}-${row.model}`} className="border-b border-outline-variant last:border-0">
                      <td className="px-6 py-3">
                        <span className="font-bold text-on-surface">{row.model}</span>
                        <span className="text-xs text-on-surface-variant ml-2 capitalize">{row.provider}</span>
                      </td>
                      <td className="px-6 py-3 text-on-surface-variant">{row.callCount}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{formatTokens(row.promptTokens)}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{formatTokens(row.completionTokens)}</td>
                      <td className="px-6 py-3 text-on-surface-variant">{formatTokens(row.cacheHitTokens)} / {formatTokens(row.cacheMissTokens)}</td>
                      <td className="px-6 py-3 text-right font-bold text-on-surface">
                        {row.costUsd !== null ? formatUsd(row.costUsd) : <span className="text-on-surface-variant font-normal">n/a</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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