# AI Tech Pros Professional Home Design

**Status:** Approved direction; implementation-ready

## Objective

Rebuild the AI Tech Pros homepage as a professional corporate home rather than an application. The homepage should establish AI Tech Pros as a credible company working at the intersection of trustworthy artificial intelligence, cybersecurity, and practical enablement for educators and creator-operators. The experience should communicate enterprise seriousness first while preserving a clear path to the company’s product and consultation destinations.

## Audience and positioning

The primary audience is balanced at the company level, with enterprise leaders and prospective partners receiving the first signal. Educator and creator enablement is presented as a strategic capability, not as a consumer application. OrchestrateOS remains a secondary product destination and is not treated as the homepage’s central interface.

## Visual direction

The approved direction is **light institutional technology**. The canvas uses warm white and very light blue-gray surfaces, navy typography, muted teal rules, and a restrained electric-blue accent for action states. The visual language should feel closer to a high-end technology advisory firm or research institution than to a dashboard or startup landing-page template.

The design avoids dark application shells, dense control panels, excessive gradients, glassmorphism, emoji icons, and decorative interface chrome. It uses thin linework, subtle grid geometry, generous whitespace, editorial typography, and restrained motion. A dark navy band may appear as a mid-page contrast section, but it must remain readable and must not become the dominant visual mode.

## Page structure

| Section | Purpose | Primary action |
|---|---|---|
| Navigation | Provide a visible, functional menu on every page state | Explore capabilities or contact |
| Hero | State the company-level value proposition and establish authority | Start a conversation |
| Capability pillars | Explain enterprise AI, cybersecurity, and educator/creator enablement | Learn about the work |
| Operating principles | Translate the plan’s governance-first posture into approachable proof | View approach |
| Systems band | Show how AI Tech Pros connects strategy, systems, and people without exposing an app UI | Explore the model |
| Product bridge | Introduce OrchestrateOS as a separate destination | Visit OrchestrateOS |
| Closing CTA | Convert qualified visitors into a consultation or partnership conversation | Book a conversation |
| Footer | Consolidate company, product, social, and legal destinations | Navigate |

## Content principles

The copy should be confident, direct, and specific without over-claiming. It should emphasize trustworthy systems, operational clarity, governance, and useful outcomes. It should not describe the homepage as a product dashboard. The word “combat” is excluded from all website copy.

## Interaction and accessibility

The navigation is visible and functional, with keyboard-accessible focus states and touch targets of at least 44px. All meaningful imagery has alternative text. Body text maintains readable contrast against light surfaces, with dark navy text on warm white and accessible white text on the dark navy contrast band. Motion is limited to 150–300ms transitions and respects `prefers-reduced-motion`. The layout is tested at 375px, 768px, 1024px, and 1440px.

## Implementation constraints

The existing React 19 + Vite + Tailwind stack is retained. The homepage remains compatible with the existing Cloudflare Pages build profile (`npm run build:pages`) and must not introduce WordPress or an application-only dependency. Existing product routes may remain available, but the marketing homepage should use a clean corporate shell and link to OrchestrateOS as a secondary destination.

## Acceptance criteria

The rebuilt homepage must feel like a coherent corporate identity, not a repurposed product interface. It must have a visible navigation menu, clear hierarchy above the fold, responsive behavior, strong contrast, functional links, no forbidden word usage, no emoji icons, and a successful TypeScript/build check.
