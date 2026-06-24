/*
 * Printable comparison one-pager — export via browser print / Save as PDF.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { Printer } from "lucide-react";
import {
  COMPARISON_CELL,
  COMPARISON_ROWS,
  type ComparisonCell,
} from "@/lib/orchestrateos-comparison";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";

function Cell({ value }: { value: ComparisonCell }) {
  const { label, className } = COMPARISON_CELL[value];
  return <span className={`font-medium ${className}`}>{label}</span>;
}

export default function OrchestrateOSCompare() {
  useEffect(() => {
    document.title = "OrchestrateOS — Competitive Comparison";
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0D17] text-white compare-page">
      <style>{`
        @media print {
          .compare-no-print { display: none !important; }
          .compare-page { background: white !important; color: #0f172a !important; }
          .compare-page table { color: #0f172a !important; }
          .compare-page th, .compare-page td { border-color: #cbd5e1 !important; }
          .compare-page .gradient-text { color: #7c3aed !important; -webkit-text-fill-color: #7c3aed !important; }
        }
      `}</style>

      <div className="compare-no-print">
        <OrchestrateOSNavbar />
      </div>

      <main className="pt-28 pb-20 compare-no-print:pt-28 print:pt-8">
        <div className="container max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Link href="/" className="text-sm text-white/40 hover:text-white/70 compare-no-print">
                ← OrchestrateOS
              </Link>
              <h1 className="text-3xl font-bold text-white font-[Montserrat] mt-4 print:text-slate-900">
                Competitive <span className="gradient-text">comparison</span>
              </h1>
              <p className="text-white/45 mt-2 print:text-slate-600">
                Governance-first execution vs observability-only stacks · June 2026
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="compare-no-print inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/[0.1] text-white/80 hover:bg-white/[0.04]"
            >
              <Printer className="w-4 h-4" />
              Save as PDF
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.08] print:border-slate-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] print:bg-slate-50">
                  <th className="text-left p-4 text-white/50 font-[Montserrat] print:text-slate-600">
                    Capability
                  </th>
                  <th className="p-4 text-center text-white/40 print:text-slate-600">LangChain</th>
                  <th className="p-4 text-center text-white/40 print:text-slate-600">CrewAI</th>
                  <th className="p-4 text-center text-white/40 print:text-slate-600">MS Agent</th>
                  <th className="p-4 text-center text-[#8B5CF6] font-semibold print:text-violet-700">
                    OrchestrateOS
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-white/[0.04] print:border-slate-200">
                    <td className="p-4 text-white/70 print:text-slate-800">{row.feature}</td>
                    <td className="p-4 text-center">
                      <Cell value={row.langchain} />
                    </td>
                    <td className="p-4 text-center">
                      <Cell value={row.crewai} />
                    </td>
                    <td className="p-4 text-center">
                      <Cell value={row.microsoft} />
                    </td>
                    <td className="p-4 text-center">
                      <Cell value={row.orchestrate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-white/30 mt-8 print:text-slate-500">
            orchestrateos.pages.dev · AI Tech Pros, Inc. · Early access — schedule a briefing for
            production evaluation.
          </p>
        </div>
      </main>
    </div>
  );
}
