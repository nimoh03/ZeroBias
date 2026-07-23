"use client";

import { useState, useTransition } from "react";
import { UserCircle2, Shield, Copy, Check, Trash2, Loader2 } from "lucide-react";
import { createInviteAction, removeTeamMemberAction } from "./action";
import Toast from "@/components/Toast";

type Member = { id: string; full_name: string | null; role: string };

export default function TeamPageClient({
  members,
  currentUserId,
  isAdmin,
}: {
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleInvite = (role: "admin" | "member") => {
    startTransition(async () => {
      try {
        const token = await createInviteAction(role);
        setInviteLink(`${window.location.origin}/login?invite=${token}`);
        setCopied(false);
      } catch (error) {
        setToastMsg(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemove = (memberId: string) => {
    if (!confirm("Remove this person from your team? They'll lose access to every job.")) return;
    setRemovingId(memberId);
    startTransition(async () => {
      try {
        await removeTeamMemberAction(memberId);
      } catch (error) {
        setToastMsg(error instanceof Error ? error.message : "Something went wrong.");
      } finally {
        setRemovingId(null);
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Team</h1>
      <p className="text-sm text-slate-500 mb-8">
        {isAdmin ? "Manage who has access to your jobs and candidates." : "Everyone with access to your organization."}
      </p>

      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Invite a teammate</h2>
          <p className="text-xs text-slate-500 mb-4">
            Generates a link to share directly — no email required yet. Whoever opens it and signs up joins your team automatically.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleInvite("member")}
              disabled={isPending}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Invite as Member
            </button>
            <button
              type="button"
              onClick={() => handleInvite("admin")}
              disabled={isPending}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Invite as Admin
            </button>
          </div>

          {inviteLink && (
            <div className="mt-4 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <span className="text-xs text-slate-600 truncate flex-1 font-mono">{inviteLink}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <UserCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {member.full_name || "Unnamed"}
                  {member.id === currentUserId && <span className="text-slate-400 font-normal"> (you)</span>}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 capitalize">
                  {member.role === "admin" && <Shield size={11} />}
                  {member.role}
                </p>
              </div>
            </div>
            {isAdmin && member.id !== currentUserId && (
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                disabled={isPending && removingId === member.id}
                className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Remove from team"
              >
                {isPending && removingId === member.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}