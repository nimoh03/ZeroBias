// Deterministic candidate-to-other-job matching. Zero AI calls — pure
// word-overlap scoring, same idea as the near-duplicate-question check in
// utils/ai.ts. Used to suggest "other roles this candidate might fit" when
// they didn't qualify for the role they actually applied to, so a recruiter
// can reach out about a different opening without spending any tokens.

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "is", "are",
  "that", "this", "with", "as", "at", "by", "be", "have", "has", "had",
  "will", "would", "can", "could", "should", "must", "you", "your", "we",
  "our", "it", "its", "their", "they", "them", "from", "into", "about",
  "years", "year", "experience", "strong", "good", "ability", "able",
  "role", "job", "position", "candidate", "team", "work", "working",
]);

function wordSet(text: string): Set<string> {
  return new Set(
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export type JobForMatching = {
  id: string;
  title: string;
  location?: string | null;
  must_haves?: string | null;
  nice_to_haves?: string | null;
};

export type CandidateForMatching = {
  summary?: string | null;
  strengths?: string[] | null;
  concerns?: string[] | null;
  cv_summary?: string | null;
};

export type JobMatch = { job: JobForMatching; score: number; reason: string };

// Top overlapping meaningful words between a candidate and a job — used
// as a plain-English "why" a recruiter can read at a glance, without any
// AI call. E.g. "react, backend, lagos".
function overlapWords(a: Set<string>, b: Set<string>, limit = 4): string[] {
  const shared: string[] = [];
  for (const w of a) if (b.has(w)) shared.push(w);
  return shared.slice(0, limit);
}

function reasonFrom(shared: string[]): string {
  if (shared.length === 0) return "General profile overlap";
  return `Matches on: ${shared.join(", ")}`;
}

// Returns other jobs (excluding currentJobId) sorted by match score
// descending, filtered to a minimum relevance so noise doesn't show up.
export function findMatchingJobs(
  candidate: CandidateForMatching,
  jobs: JobForMatching[],
  currentJobId: string,
  minScore = 0.08
): JobMatch[] {
  const candidateText = [
    candidate.summary || "",
    (candidate.strengths || []).join(" "),
    candidate.cv_summary || "",
  ].join(" ");
  const candidateWords = wordSet(candidateText);
  if (candidateWords.size === 0) return [];

  const results: JobMatch[] = [];
  for (const job of jobs) {
    if (job.id === currentJobId) continue;
    const jobWords = wordSet([job.title, job.must_haves || "", job.nice_to_haves || ""].join(" "));
    const score = jaccard(candidateWords, jobWords);
    if (score >= minScore) {
      results.push({ job, score, reason: reasonFrom(overlapWords(candidateWords, jobWords)) });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// Inverse direction of findMatchingJobs: for ONE job, scan a pool of
// candidates (typically ones who failed/are under review on a DIFFERENT
// job) and return the ones whose profile overlaps this job's
// requirements — this is what powers the Shortlisted page (job-first
// view, "who else might fit this role").
export type CandidateForJobMatch = CandidateForMatching & {
  id: string;
  name?: string | null;
  job_id?: string | null;
  status?: string | null;
};

export type CandidateMatch = { candidate: CandidateForJobMatch; score: number; reason: string };

export function findMatchingCandidatesForJob(
  job: JobForMatching,
  candidates: CandidateForJobMatch[],
  minScore = 0.08
): CandidateMatch[] {
  const jobWords = wordSet([job.title, job.must_haves || "", job.nice_to_haves || ""].join(" "));
  if (jobWords.size === 0) return [];

  const results: CandidateMatch[] = [];
  for (const candidate of candidates) {
    if (candidate.job_id === job.id) continue; // exclude candidates who applied to this exact job
    const candidateWords = wordSet([
      candidate.summary || "",
      (candidate.strengths || []).join(" "),
      candidate.cv_summary || "",
    ].join(" "));
    const score = jaccard(candidateWords, jobWords);
    if (score >= minScore) {
      results.push({ candidate, score, reason: reasonFrom(overlapWords(candidateWords, jobWords)) });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}