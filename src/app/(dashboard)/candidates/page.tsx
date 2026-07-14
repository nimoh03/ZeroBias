import { 
  Search, Filter, MoreVertical, Eye, 
  CheckCircle2, XCircle, Clock, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function CandidatesList() {
  return (
    <div className="p-6 md:p-8 max-w-container-max mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Candidate Pipeline</h2>
          <p className="text-sm text-on-surface-variant mt-1">Review and manage AI-screened applicants.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3 shadow-sm">
          <Search className="text-outline shrink-0" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or job title..." 
            className="bg-transparent border-none focus:ring-0 w-full text-sm outline-none placeholder:text-outline text-on-surface"
          />
        </div>
        <div className="md:col-span-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center justify-between shadow-sm cursor-pointer hover:border-primary transition-colors">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter by Status</span>
          </div>
          <span className="material-symbols-outlined text-outline">expand_more</span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Applied Role</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">AI Score</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shadow-sm">
                      AC
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">Alex Chen</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">alex.chen@example.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-on-surface">Senior Frontend Engineer</span>
                  <div className="text-xs text-on-surface-variant mt-0.5">Oct 14, 2026</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="w-[94%] h-full bg-primary"></div>
                    </div>
                    <span className="text-sm font-bold text-primary">94</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    <Sparkles size={12} /> Qualified
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href="/candidates/alex-chen" 
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-lg text-xs font-bold transition-colors"
                    >
                      <Eye size={14} /> Review
                    </Link>
                    <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shadow-sm">
                      MK
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">Marcus Kane</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">m.kane@example.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-on-surface">Product Marketing Manager</span>
                  <div className="text-xs text-on-surface-variant mt-0.5">Oct 13, 2026</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="w-[72%] h-full bg-orange-500"></div>
                    </div>
                    <span className="text-sm font-bold text-orange-600">72</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    <Clock size={12} /> Needs Review
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href="/candidates/marcus-kane" 
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-lg text-xs font-bold transition-colors"
                    >
                      <Eye size={14} /> Review
                    </Link>
                    <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm shadow-sm">
                      ER
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">Elena Rodriguez</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">elena.r@example.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-on-surface">Senior Frontend Engineer</span>
                  <div className="text-xs text-on-surface-variant mt-0.5">Oct 12, 2026</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="w-[45%] h-full bg-error"></div>
                    </div>
                    <span className="text-sm font-bold text-error">45</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-container text-on-error-container">
                    <XCircle size={12} /> Rejected
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href="/candidates/elena-rodriguez" 
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant text-on-surface rounded-lg text-xs font-bold transition-colors"
                    >
                      <Eye size={14} /> Review
                    </Link>
                    <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-md transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}