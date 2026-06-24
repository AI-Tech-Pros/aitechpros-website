/*
 * Governance-focused comparison — aligns with OrchestrateOS competitive intel (June 2026).
 */
import { Link } from "wouter";
import {
  COMPARISON_CELL,
  COMPARISON_ROWS,
  type ComparisonCell,
} from "@/lib/orchestrateos-comparison";

function CellValue({ value }: { value: ComparisonCell }) {
  const { label, className } = COMPARISON_CELL[value];
  return <span className={`text-sm font-medium ${className}`}>{label}</span>;
}

export default function OrchestrateOSComparison() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="px-4 py-4 text-white/40 font-medium font-[Montserrat]">Capability</th>
            <th className="px-4 py-4 text-white/70 font-semibold font-[Montserrat]">LangChain / LangSmith</th>
            <th className="px-4 py-4 text-white/70 font-semibold font-[Montserrat]">CrewAI</th>
            <th className="px-4 py-4 text-white/70 font-semibold font-[Montserrat]">MS Agent Framework</th>
            <th className="px-4 py-4 text-[#8B5CF6] font-semibold font-[Montserrat]">OrchestrateOS</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b border-white/[0.04] last:border-0">
              <td className="px-4 py-3.5 text-white/55">{row.feature}</td>
              <td className="px-4 py-3.5">
                <CellValue value={row.langchain} />
              </td>
              <td className="px-4 py-3.5">
                <CellValue value={row.crewai} />
              </td>
              <td className="px-4 py-3.5">
                <CellValue value={row.microsoft} />
              </td>
              <td className="px-4 py-3.5">
                <CellValue value={row.orchestrate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-white/30 border-t border-white/[0.04] flex flex-wrap items-center gap-x-2">
        <span>
          LangSmith observes after deployment; CrewAI lacks built-in checkpointing on failure;
          Microsoft Agent Framework is pre-GA with Azure coupling.
        </span>
        <Link href="/compare" className="text-[#06B6D4] hover:underline shrink-0">
          Save comparison as PDF →
        </Link>
      </p>
    </div>
  );
}
