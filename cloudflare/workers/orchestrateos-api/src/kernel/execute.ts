/** Re-exports Phase 2 kernel pipeline. */
export {
  executeKernelPipeline,
  resumeKernelPipeline,
  kernelAgentCatalog,
  extractGoalFromPayload,
  recordIngressEvent,
  drainIngressQueue,
  type KernelEnv,
  type KernelAgentResult,
  type KernelRunResult,
} from "./pipeline";
