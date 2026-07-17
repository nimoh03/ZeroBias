"use client";

import { useRouter } from "next/navigation";

export default function CandidateRow({
  candidateId,
  children,
}: {
  candidateId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/candidates/${candidateId}`)}
      className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
    >
      {children}
    </tr>
  );
}