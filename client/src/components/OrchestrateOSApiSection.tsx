/*
 * OrchestrateOS control plane API — endpoint reference + docs link
 */
import { ArrowUpRight, Server } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/orchestrateos-api";
import { orchestrateOSApiBaseUrl, orchestrateOSApiDocsUrl } from "@/lib/site";

export default function OrchestrateOSApiSection() {
  const apiBase = orchestrateOSApiBaseUrl();
  const isProxy = apiBase.startsWith("/");

  return (
    <div className="space-y-8">
      <div className="glass-card rounded-2xl p-6 lg:p-8 border-[#06B6D4]/15">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 flex items-center justify-center shrink-0">
              <Server className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#06B6D4] font-[Montserrat] mb-1">
                Control plane
              </p>
              <h3 className="text-xl font-bold text-white font-[Montserrat] mb-2">
                {isProxy ? "Local API (dev proxy)" : apiBase.replace("https://", "")}
              </h3>
              <p className="text-sm text-white/50 max-w-xl leading-relaxed">
                Cloudflare Worker control plane for run lifecycle, resume gate inspection,
                compensation recording, and audit logs. Backed by D1.
              </p>
              <p className="mt-3 font-mono text-xs text-white/35 break-all">{apiBase}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={orchestrateOSApiDocsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] text-white text-sm font-semibold font-[Montserrat] hover:opacity-90 transition-opacity"
            >
              OpenAPI docs
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <a
              href={`${apiBase}/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl glass-card text-white/70 text-sm hover:text-white transition-colors"
            >
              Health check
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border-white/[0.06]">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-sm font-semibold text-white font-[Montserrat]">REST endpoints</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-medium">Method</th>
                <th className="px-6 py-3 font-medium">Path</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Description</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((ep) => (
                <tr
                  key={`${ep.method}-${ep.path}`}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-3">
                    <span
                      className={`font-mono text-xs px-2 py-0.5 rounded ${
                        ep.method === "GET"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-[#8B5CF6]/15 text-[#8B5CF6]"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-[#06B6D4]">{ep.path}</td>
                  <td className="px-6 py-3 text-white/45 hidden sm:table-cell">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 font-mono text-xs text-white/55 overflow-x-auto">
        <p className="text-white/30 mb-2"># API (Cloudflare Workers)</p>
        <p>{orchestrateOSApiBaseUrl()}</p>
        <p className="text-white/30 mt-4 mb-2"># Local Python SDK</p>
        <p>docker compose -f resume_engine/docker-compose.yml up --build</p>
      </div>
    </div>
  );
}
