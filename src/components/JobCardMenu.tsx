"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MoreVertical, Users2, Loader2, X, Check } from "lucide-react";
import { getAssignableMembersAction, getJobMemberIdsAction, updateJobMembersAction } from "@/app/(dashboard)/team/action";
import Toast from "@/components/Toast";

type Member = { id: string; full_name: string | null };

export default function JobCardMenu({ jobId }: { jobId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click, same as any other menu.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openAssignModal = () => {
    setMenuOpen(false);
    setModalOpen(true);
    // Fetch both in parallel — the full assignable list, and which of
    // them are currently on this specific job.
    Promise.all([getAssignableMembersAction(), getJobMemberIdsAction(jobId)])
      .then(([allMembers, currentIds]) => {
        setMembers(allMembers);
        setSelectedIds(currentIds);
      })
      .catch(() => setMembers([]));
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateJobMembersAction(jobId, selectedIds);
        setModalOpen(false);
      } catch (error) {
        setToastMsg(error instanceof Error ? error.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <MoreVertical size={18} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-20">
          <button
            type="button"
            onClick={openAssignModal}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Users2 size={16} /> Assign teammates
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => !isPending && setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Assign teammates</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Only picked here can see this job. Leave everyone unchecked and only admins will see it.
            </p>

            {members === null ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No teammates yet — invite someone from the Team page first.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-5">
                {members.map((member) => {
                  const isSelected = selectedIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggle(member.id)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                      {member.full_name || "Unnamed"}
                    </button>
                  );
                })}
              </div>
            )}

            {members !== null && members.length > 0 && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-primary transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Save
              </button>
            )}
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </div>
  );
}