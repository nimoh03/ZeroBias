"use client";

import { useEffect, useState } from "react";
import { Users2 } from "lucide-react";
import { getAssignableMembersAction } from "@/app/(dashboard)/team/action";

type Member = { id: string; full_name: string | null };

export default function TeamMemberPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAssignableMembersAction()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoaded(true));
  }, []);

  // Nothing to show for a solo account, or before the fetch resolves —
  // this section just doesn't exist rather than showing an empty state.
  if (!loaded || members.length === 0) return null;

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Users2 size={20} /></div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900">Assign teammates</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Only picked here can see this job. Leave everyone unchecked and only admins will see it.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => {
          const isSelected = selectedIds.includes(member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => toggle(member.id)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {member.full_name || "Unnamed"}
            </button>
          );
        })}
      </div>
    </div>
  );
}