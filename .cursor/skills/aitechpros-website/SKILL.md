---
name: aitechpros-website
description: >-
  Positions and implements the AI Tech Pros Inc. marketing site
  (aitechpros-website.pages.dev). Use when updating aitechpros.com/website,
  homepage copy, projects, legal/privacy/terms, Jenkins Cyber Academy, educator
  backoffice, MedStore Inc. acquisition, or leadership (CEO/CTO). Do not use
  for OrchestrateOS Worker API internals or Skool Classroom lesson rewrites.
---

# AI Tech Pros marketing site

**Exists so the agent can keep the company site aligned** with the 2026 operating plans, Henry L. Jenkins venture list, and MedStore Inc. leadership/legal facts.

Pairs with: `online-business-expert`, `premium-web-development`, `cert-exam-coaching-promo`, `direct-response-copywriting`.
Does **not** replace: `workers-best-practices` (OrchestrateOS API) or `certification-instructor-lessons`.

## Progress checklist

```
AITECHPROS site progress:
- [ ] 1. Entity, officers, addresses from company.ts
- [ ] 2. Projects match henryljenkins.com ventures
- [ ] 3. Academy vs backoffice jobs not mixed
- [ ] 4. Funnel: free study first; no pass/job guarantees
- [ ] 5. Legal chrome matches Signal Bridge homepage
- [ ] 6. Unique titles, robots, sitemap
```

## Company facts (do not invent)

| Field | Value |
|-------|--------|
| Legal name | **AI Tech Pros, Inc.** (never LLC) |
| CEO | Nehemiah Harvard (same as medstoreinc.com/about.html) |
| CTO | Henry Jenkins (same) |
| Advisors | Dr. Bruce Lapine; Dr. Kimberely N. West; Abhishek Jain, MD |
| Acquisition | AI Tech Pros, Inc. acquired **MedStore Inc.** Keep MedStore as a brand/site. |
| Phone | +1-404-333-2968 |
| Email | info@medstoreinc.com (MedStore/legal); admin@aitechpros.ai |
| Addresses | 217 Davis Road, Augusta, GA 30907 · 17910 Van Dyke Street STE 1396, Detroit, MI 48234 |
| Canonical marketing URL | https://aitechpros-website.pages.dev |

MedStoreInc footer Privacy/Terms currently hash-link to `#`. Do **not** copy empty pages. Port officers, addresses, phone, email, HIPAA/healthcare posture, and Georgia contact facts into complete Inc. policies. Source constants: `client/src/lib/company.ts`.

## Projects (henryljenkins.com)

Same three public ventures, in this order:

1. AI Tech Pros — this site / aitechpros.ai
2. Negotiate Medical Bill — https://negotiatemedicalbill.ai/
3. MedStore Inc. — https://medstoreinc.com/

OrchestrateOS and Jenkins Cyber Academy are **products of the parent**, not extra Henry-portfolio rows unless henryljenkins.com adds them.

## One job per surface

| Surface | Job | Primary CTA |
|--------|-----|-------------|
| Homepage | Parent company: AI, healthcare, education | Conversation or see ventures |
| `/academy` | Free live Security+ classroom | Join Skool (Henry Jenkins Mentorship) |
| `/backoffice` | Educators/brands after academy proof | Conversation — not a fake login |
| `/projects` | Same ventures as henryljenkins.com | Visit each live site |
| Skool | Learner home | Next lesson / Q&A |
| OrchestrateOS | Governed workflow runtime | Product site |

Do not put lesson delivery, exam dumps, or backoffice ops on the marketing homepage.

## Funnel rules (Security+ practice → Career Ops)

From the implementation roadmap:

- Free practice/study remains available without community or marketing consent.
- Invitation to Henry Jenkins Mentorship / Career Ops only after useful learning, new tab, no scores/PII in URLs.
- No job, salary, pass, or placement guarantees.
- Marketing topics unchecked by default.

Skool: https://www.skool.com/henry-jenkins-5224

## Copy

- Parent story: strategy + secure infrastructure + human expertise.
- Academy: Free live cybersecurity study, hands-on practice, and career support.
- Enablement: educator backoffice (clips, sponsorships, payouts via Stripe Connect later). Phase 0 is manual; do not ship a pretend app.

## Additional resources

- Venture and legal constants: [references/company.md](references/company.md)
