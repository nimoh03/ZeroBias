"use client";

import { useState, useRef, useEffect } from "react";
import {
  Link as LinkIcon, Check, ChevronDown,
  MessageCircle, Users, AtSign, Briefcase, Camera, Globe,
} from "lucide-react";

const PLATFORMS = [
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "facebook", label: "Facebook", icon: Users },
  { key: "twitter", label: "Twitter / X", icon: AtSign },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase },
  { key: "instagram", label: "Instagram", icon: Camera },
];

function slugifySource(value: string) {
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return clean || "direct";
}

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const copyWithSource = (source: string | null) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const url = source
      ? `${baseUrl}/apply/${slug}?src=${encodeURIComponent(slugifySource(source))}`
      : `${baseUrl}/apply/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setOpen(false);
    setCustomValue("");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full md:w-auto flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {copied ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />}
        {copied ? "Copied!" : "Copy Link"}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 md:left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2">
          <p className="px-2 pt-1 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Where are you posting this?
          </p>
          <div className="grid grid-cols-2 gap-1 mb-1">
            {PLATFORMS.map((p) => (
              <button
                key={p.key}
                onClick={() => copyWithSource(p.key)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-primary transition-colors text-left"
              >
                <p.icon size={15} /> {p.label}
              </button>
            ))}
            <button
              onClick={() => copyWithSource(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-primary transition-colors text-left"
            >
              <Globe size={15} /> Direct
            </button>
          </div>
          <div className="border-t border-slate-100 pt-2 px-2 pb-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom source</p>
            <form
              onSubmit={(e) => { e.preventDefault(); if (customValue.trim()) copyWithSource(customValue); }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="e.g. campus flyer"
                className="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!customValue.trim()}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg disabled:opacity-40"
              >
                Copy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}