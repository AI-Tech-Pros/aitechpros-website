/** Re-exports Phase 2 kernel pipeline. */
export {
  executeKernelPipeline,
  resumeKernelPipeline,
  kernelAgentCatalog,
  extractGoalFromPayload,
  recordIngressEvent,
  type KernelEnv,
  type KernelAgentResult,
  type KernelRunResult,
} from "./pipeline";
