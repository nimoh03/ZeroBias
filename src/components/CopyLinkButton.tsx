"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

export default function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // Construct the full URL based on the environment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const url = `${baseUrl}/apply/${slug}`;
    
    navigator.clipboard.writeText(url);
    setCopied(true);
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
    >
      {copied ? <Check size={16} className="text-emerald-500" /> : <LinkIcon size={16} />} 
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}