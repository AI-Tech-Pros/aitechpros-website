/*
 * Governance-focused comparison — aligns with OrchestrateOS competitive intel (June 2026).
 */

type Cell = "yes" | "partial" | "no";

const CELL: Record<Cell, { label: string; className: string }> = {
  yes: { label: "Yes", className: "text-[#06B6D4]" },
  partial: { label: "Partial", className: "text-amber-400/90" },
  no: { label: "No", className: "text-red-400/80" },
};

const ROWS: { feature: string; langchain: Cell; crewai: Cell; microsoft: Cell; orchestrate: Cell }[] = [
  {
    feature: "Deployment governance (gates before resume)",
    langchain: "no",
    crewai: "no",
    microsoft: "partial",
    orchestrate: "yes",
  },
  {
    feature: "Resume from last step (not full restart)",
    langchain: "partial",
    crewai: "no",
    microsoft: "yes",
    orchestrate: "yes",
  },
  {
    feature: "Immutable audit / deterministic replay",
    langchain: "partial",
    crewai: "partial",
    microsoft: "partial",
    orchestrate: "yes",
  },
  {
    feature: "Operator approval & compensation gates",
    langchain: "no",
    crewai: "no",
    microsoft: "partial",
    orchestrate: "yes",
  },
  {
    feature: "Framework-agnostic (no cloud lock-in)",
    langchain: "yes",
    crewai: "yes",
    microsoft: "no",
    orchestrate: "yes",
  },
  {
    feature: "Enterprise compliance tier required for governance",
    langchain: "yes",
    crewai: "yes",
    microsoft: "yes",
    orchestrate: "no",
  },
];

function CellValue({ value }: { value: Cell }) {
  const { label, className } = CELL[value];
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
          {ROWS.map((row) => (
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
      <p className="px-4 py-3 text-xs text-white/30 border-t border-white/[0.04]">
        LangSmith observes after deployment; CrewAI lacks built-in checkpointing on failure; Microsoft
        Agent Framework is pre-GA with Azure coupling. OrchestrateOS targets the governance gap as a
        first-class layer.
      </p>
    </div>
  );
}
