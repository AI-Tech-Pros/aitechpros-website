/** Shared competitive comparison matrix (OrchestrateOS competitive intel). */

export type ComparisonCell = "yes" | "partial" | "no";

export type ComparisonRow = {
  feature: string;
  langchain: ComparisonCell;
  crewai: ComparisonCell;
  microsoft: ComparisonCell;
  orchestrate: ComparisonCell;
};

export const COMPARISON_ROWS: ComparisonRow[] = [
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

export const COMPARISON_CELL: Record<
  ComparisonCell,
  { label: string; className: string }
> = {
  yes: { label: "Yes", className: "text-[#06B6D4]" },
  partial: { label: "Partial", className: "text-amber-400/90" },
  no: { label: "No", className: "text-red-400/80" },
};
