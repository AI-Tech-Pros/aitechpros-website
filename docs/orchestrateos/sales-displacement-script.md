# OrchestrateOS — Sales displacement script

Internal use. Aligns with competitive intel (June 2026).

## Opening

"We help teams ship multi-step agent workflows that **resume with gates**, not restart from zero. If you're evaluating LangChain, CrewAI, or Microsoft Agent Framework, the question isn't whether agents fail — it's what happens on step 47."

## Discovery questions

1. What happens today when a 20+ step workflow fails mid-run?
2. Do side effects (email, DB writes, payments) ever fire twice on retry?
3. Who must approve before production resume — and is that enforced in code?
4. Can you export an immutable audit trail for compliance review?

## Positioning vs incumbents

| Competitor | Acknowledge | Pivot |
|------------|-------------|-------|
| LangChain / LangSmith | Strong traces and evals | "LangSmith observes after deploy. We govern what may resume next." |
| CrewAI | Fast multi-agent UX | "CrewAI restarts from step 1. We checkpoint every step and resume from the last success." |
| Microsoft Agent Framework | Mature Azure governance | "Same gate concepts without Foundry lock-in — LangGraph, CrewAI, or plain Python." |

## Demo flow (15 min)

1. Open [orchestrateos.pages.dev/#gates](https://orchestrateos.pages.dev/#gates) — load **Partial** demo run
2. Show `can_resume: false` and compensation blocker
3. Record compensation via API → `can_resume: true`
4. Load **Transient (prod)** — show prod acknowledgment gate
5. Mention `pip install resume_engine` and `GET /runs/{id}/audit_events`

## Objections

See [Governance guide](https://orchestrateos.pages.dev/governance) on the site for full responses.

## Close

"Schedule a design-partner session — we'll wire `RemoteCheckpointStore` to your existing LangGraph or CrewAI flow and prove governed resume on your workflow, not a toy demo."

**Calendly:** https://calendly.com/aitechpros/15min

**Design partner playbook:** [design-partner-playbook.md](./design-partner-playbook.md)
