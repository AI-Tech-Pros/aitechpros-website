/*
 * Install guide — PyPI + remote control plane.
 */
import { useEffect, useState } from "react";
import OrchestrateOSSubpage, { SubSection } from "@/components/OrchestrateOSSubpage";
import { useSession } from "@/contexts/SessionContext";
import { buildRemoteQuickstart, readStashedRunnerKey } from "@/lib/partner-credentials";
import { orchestrateOSApiBaseUrl } from "@/lib/site";

const localQuickstart = `pip install resume_engine

from resume_engine import ResumeEngine, SQLiteCheckpointStore

store = SQLiteCheckpointStore("sqlite:///workflow.db")
engine = ResumeEngine(store)
run = engine.start_run("my_pipeline")`;

function RemoteQuickstartBlock() {
  const { session } = useSession();
  const [snippet, setSnippet] = useState("");

  useEffect(() => {
    const api = orchestrateOSApiBaseUrl();
    const stashedKey = readStashedRunnerKey();
    const tenant = session.partner_slug ?? "YOUR_TENANT";
    const key = stashedKey ?? "YOUR_RUNNER_KEY";
    setSnippet(buildRemoteQuickstart(api, key, tenant));
  }, [session.partner_slug]);

  return (
    <>
      {session.authenticated && session.partner_slug && (
        <p className="text-[#06B6D4] text-sm mb-3">
          Personalized for tenant <code className="font-mono">{session.partner_slug}</code>
          {readStashedRunnerKey() ? " with your onboarding key." : " — paste your runner key below."}
        </p>
      )}
      <pre className="rounded-xl bg-black/40 border border-white/[0.08] p-4 text-sm font-mono text-white/70 overflow-x-auto whitespace-pre-wrap">
        {snippet || "Loading…"}
      </pre>
      <p className="mt-3 text-white/45 text-sm">
        Lost your key?{" "}
        <a href="/partner/dashboard" className="text-[#06B6D4] hover:underline">
          Rotate API key
        </a>{" "}
        on the partner dashboard.
      </p>
    </>
  );
}

export default function OrchestrateOSInstall() {
  return (
    <OrchestrateOSSubpage
      eyebrow="Install"
      title={
        <>
          <span className="gradient-text">pip install</span> resume_engine
        </>
      }
      subtitle="Framework-agnostic checkpointing for LangGraph, CrewAI, and plain Python — with optional Cloudflare control plane sync."
    >
      <SubSection title="PyPI (recommended)">
        <p>
          Package:{" "}
          <a
            href="https://pypi.org/project/resume-engine/0.2.0/"
            className="text-[#06B6D4] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            resume_engine 0.2.0 on PyPI
          </a>
        </p>
        <pre className="rounded-xl bg-black/40 border border-white/[0.08] p-4 text-sm font-mono text-[#06B6D4] overflow-x-auto">
          pip install resume_engine
        </pre>
        <p>Optional extras:</p>
        <ul className="list-disc pl-5 space-y-2 font-mono text-sm">
          <li>resume_engine[remote] — Cloudflare Worker checkpoint store</li>
          <li>resume_engine[langgraph] — LangGraph node wrapper</li>
          <li>resume_engine[crewai] — CrewAI task wrapper</li>
          <li>resume_engine[api] — self-hosted FastAPI service</li>
        </ul>
      </SubSection>

      <SubSection title="Local quickstart">
        <pre className="rounded-xl bg-black/40 border border-white/[0.08] p-4 text-sm font-mono text-white/70 overflow-x-auto whitespace-pre-wrap">
          {localQuickstart}
        </pre>
      </SubSection>

      <SubSection title="Live control plane (remote store)">
        <RemoteQuickstartBlock />
        <p className="mt-4">
          Demo script:{" "}
          <code className="text-sm text-[#06B6D4]">python resume_engine/demo_remote_pipeline.py</code>
        </p>
      </SubSection>

      <SubSection title="From source">
        <pre className="rounded-xl bg-black/40 border border-white/[0.08] p-4 text-sm font-mono text-white/70 overflow-x-auto">
          {`git clone https://github.com/AI-Tech-Pros/aitechpros-website.git
cd aitechpros-website
pip install -e ".[remote]"`}
        </pre>
      </SubSection>
    </OrchestrateOSSubpage>
  );
}
