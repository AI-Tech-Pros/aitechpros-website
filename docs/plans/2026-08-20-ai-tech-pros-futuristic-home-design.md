# AI Tech Pros hybrid futuristic homepage design

## Overview

This design refresh keeps the approved AI Tech Pros identity intact while making the permanent homepage feel more distinctly AI-forward. The palette remains warm white, navy, muted teal, electric blue, and restrained orange. The Signal Bridge mark and the tagline **AI systems that work.** remain unchanged.

The experience uses a hybrid visual language: cinematic ambient motion in the hero and closing moments, combined with restrained systems-interface details in the navigation, capability modules, operating-principle lattice, and OrchestrateOS bridge. The result must feel like a premium technology company showing how intelligent systems behave, not like a generic application dashboard.

## Experience principles

The redesign expresses intelligence through motion, layering, calibration, and relationships rather than through extra copy. Thin signal lines, node states, telemetry labels, controlled glow, and structured depth create a sense of live systems without introducing a new color family or distracting from the enterprise message.

Motion remains purposeful and lightweight. Ambient effects use transform and opacity, avoid layout shifts, and stop or simplify under `prefers-reduced-motion`. Micro-interactions remain short and deliberate. The page must remain understandable and usable when all animation is disabled.

## Page treatment

| Area | Treatment | Purpose |
|---|---|---|
| Navigation | Floating command rail with a thin telemetry rule, active signal state, and restrained translucent surface | Make the entry point feel like a controlled system without becoming an app shell |
| Hero | Layered hero artwork, orbital rings, signal nodes, scan line, and subtle pulse field | Add cinematic AI presence while preserving the copy-safe left side |
| Signal strip | Calibrated numbered system rail with animated progress ticks | Connect the company focus areas into one operating model |
| Capability cards | Modular intelligence panels with metadata line, animated border trace, depth hover, and existing artwork | Make each capability feel like an intentional system module |
| Operating principle | Dark governance lattice with animated node activation and central useful-intelligence core | Turn governance into the visual anchor of the page |
| OrchestrateOS | Workflow telemetry spine with checkpoints, status language, and existing product artwork | Bridge the company story to the product without presenting a dashboard |
| Closing CTA | Signal-lock transition with a focused pulse mark and clear booking action | End with confidence and a strong next step |

## Accessibility and performance

The redesign preserves visible keyboard focus states, semantic structure, descriptive alt text, touch-friendly controls, and valid navigation targets. Decorative visual layers use `aria-hidden="true"`; meaningful illustrations retain concise alt text. The existing light-mode contrast system remains the source of truth. Motion is disabled or reduced through `prefers-reduced-motion`, and no essential information relies on animation or color alone.

The page uses existing optimized WebP artwork and CSS/SVG effects instead of adding heavy video or a new client-side animation library. CSS transforms and opacity are preferred over layout-affecting properties. The implementation must be verified at 375px, 768px, 1024px, and 1440px widths, with no horizontal overflow.

## Acceptance criteria

The final homepage must feel more futuristic at first glance while remaining clearly AI Tech Pros. It must keep the current color palette, Signal Bridge logo, tagline, navigation labels, core copy, external destinations, and Cloudflare Pages deployment. The navigation must remain visible and functional, every menu item must point to an existing section or valid destination, and the production build must pass TypeScript and Cloudflare checks.
