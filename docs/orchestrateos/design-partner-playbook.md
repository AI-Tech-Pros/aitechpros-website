# OrchestrateOS — Design partner playbook

Internal checklist for the first **paid pilot** after PyPI + live demo are verified.

**Prerequisites:** [sales-displacement-script.md](./sales-displacement-script.md) demo passes (`resume_engine/scripts/sales_demo_smoke.ps1`).

---

## 1. Qualify the partner

| Criterion | Why |
|-----------|-----|
| Multi-step agent workflow (10+ steps) | Resume value is obvious vs restart |
| Real side effects (email, DB, payments, tickets) | Idempotency + compensation story |
| Regulated or ops-heavy (finance, health, insurance) | Gates + audit resonate |
| LangGraph, CrewAI, or plain Python (not Azure-only) | SDK fit |

**Disqualify:** single-shot chatbots, batch-only ETL with no mid-run failure cost.

---

## 2. Week 0 — Kickoff (60 min)

1. Run 15-min gate explorer demo ([script](./sales-displacement-script.md)).
2. Agree on **one workflow** to instrument (not their whole platform).
3. Issue credentials:
   - **Runner** API key → their app (`RemoteCheckpointStore`)
   - **Operator** key → their ops lead (gate clears via API or explorer)
4. Environment: start in `staging`; prod gate behavior demoed separately.

---

## 3. Week 1 — Integration

Partner team:

```powershell
pip install "resume_engine[remote]"
# or [langgraph] / [crewai] as needed
```

Wire `RemoteCheckpointStore` into the chosen workflow:

- **Cookbook:** [cookbook-design-partner.md](./cookbook-design-partner.md)
- **Starter script:** `resume_engine/examples/partner_plain_python.py`
- **User guide:** [§7 Connect to the live control plane](./user-guide.md#7-connect-to-the-live-control-plane)

**Success criteria:**

| Metric | Target |
|--------|--------|
| Failed run resumes from last completed step | Yes, with audit log |
| Duplicate side effect on resume | None (idempotency keys) |
| Partial failure blocked until compensation | `can_resume: false` until cleared |
| Operator can clear gate without code deploy | API or gate explorer |

**Deliverable:** one `run_id` from a real failure they can show internally.

---

## 4. Week 2 — Governance review

1. Export `GET /runs/{id}/audit_events` and `GET /runs/{id}/replay`.
2. Walk compliance reviewer through [/compliance](https://orchestrateos.pages.dev/compliance).
3. Document their `environment` policy (`staging` vs `prod` + `ack_prod_resume`).

---

## 5. Week 3 — Pilot close

| Output | Owner |
|--------|-------|
| Case study (anonymized OK) | AI Tech Pros |
| Recorded 5-min demo on **their** workflow | Partner |
| Decision: self-hosted vs shared control plane | Joint |
| Commercial next step (support tier / license) | AI Tech Pros |

**Calendly follow-up:** https://calendly.com/aitechpros/15min

---

## 6. Known limitations (set expectations)

- Shared control plane is **single-tenant demo/pilot** — not multi-customer SaaS yet.
- `GET /runs/{id}` is public if `run_id` is known — use UUID secrecy; scoped reads on roadmap.
- Custom domain optional — `*.pages.dev` / `*.workers.dev` is production today.

---

## 7. Smoke test before every partner call

```powershell
.\resume_engine\scripts\sales_demo_smoke.ps1
```
