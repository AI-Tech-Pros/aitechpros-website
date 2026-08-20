# AI Tech Pros creative-asset system

## Overview

The live AI Tech Pros website currently uses a CSS-built visual language rather than a library of photographic or illustrative assets. This plan establishes a reusable asset system for the next creative pass without changing the approved light institutional technology direction.

The system uses two complementary workflows. The primary workflow is `imagegen` for website illustrations, conceptual visuals, logo explorations, and marketing graphics. The supporting workflow is `canvas-design` for original, highly controlled static compositions where geometry, typography, and spacing must remain deterministic. Both skills are already available in the current environment; no external skill installer is present, so no additional package installation is required.

## Brand asset direction

The visual system keeps the existing warm-white, navy, muted teal, electric blue, and restrained orange palette. Assets must feel institutional, precise, calm, and useful. They must avoid generic robot imagery, neon cyberpunk scenes, dark dashboard screenshots, stock-photo business handshakes, excessive gradients, and decorative technology clichés.

The governing visual idea is **Measured Intelligence**: complex systems are represented through quiet geometry, layered grids, connected nodes, paper-like surfaces, and small signal accents. Visuals should suggest care, governance, and clarity before spectacle. Every asset must look like part of one carefully maintained library rather than an isolated illustration.

## Required asset inventory

| Asset family | Initial deliverables | Route | Primary website use |
|---|---|---|---|
| Brand marks | Refined square mark, favicon, monochrome mark, social avatar | Canvas/design-system first; image generation only for concept exploration | Header, footer, browser icon, social sharing |
| Hero visual | One wide conceptual systems visual with a text-safe left area and structured detail on the right | `imagegen` | Homepage hero replacement or optional editorial media block |
| Capability visuals | Three coordinated visuals for enterprise AI, security, and enablement | `imagegen` with one shared art direction | Capability cards or detail sections |
| Operating-principle visual | One precise conceptual diagram or framework visual for governance, guidance, and connection | Mermaid/deterministic source first if relationships must be exact; polished visual second if useful | Trust and approach section |
| OrchestrateOS bridge visual | One restrained product/system visual, not a dashboard screenshot | `imagegen` | Secondary product section |
| Social preview | One 1200×630 branded Open Graph image with short headline and no dense copy | `canvas-design` for exact composition | Link previews and social sharing |
| Favicon set | 16px, 32px, 180px, and 512px variants from the approved mark | Deterministic export from final mark | Browser and device icons |
| Optional editorial set | Two to four abstract section textures or diagrams | `imagegen` or `canvas-design` | Future capability pages and articles |

## Production rules

Each generated image must be delivered as a standalone final file with a lowercase hyphenated filename, explicit dimensions, and descriptive alternative text recorded in the implementation. Wide hero art must reserve quiet space for copy. Transparent assets must have a clean alpha channel and no colored fringe. All conceptual diagrams must preserve accurate relationships when labels or topology matter; use a deterministic diagram source before producing a polished visual treatment.

The website must load responsive formats where appropriate, use WebP or AVIF for raster visuals, retain SVG for marks and line diagrams, and lazy-load below-the-fold media. The implementation must preserve the current accessible contrast system and must not replace meaningful text with text embedded inside images. Decorative visuals receive empty alternative text, while informative visuals receive concise descriptive alternative text.

## Production sequence

1. Finalize the asset art direction and approve one visual reference frame.
2. Produce the brand-mark and favicon set from the existing header mark.
3. Generate the hero visual and evaluate composition at desktop and mobile widths.
4. Generate the three capability visuals as a coordinated set.
5. Create the operating-principle diagram from an accurate source structure, then produce a polished version if the website benefits from it.
6. Produce the OrchestrateOS bridge visual and social preview graphic.
7. Export optimized responsive formats, add alt text, and integrate the assets into the website.
8. Run a focused visual QA pass at 375px, 768px, 1024px, and 1440px.

## Acceptance criteria

The asset library must look cohesive with the approved homepage, support the enterprise-first balanced audience, remain legible and performant, avoid forbidden website wording, and provide a clear reason for every visual’s presence. No asset should be added merely to fill space. The final website should feel more specific and memorable while remaining calm, credible, and accessible.

## References

[1]: https://www.acquia.com/glossary/brand-assets "Acquia: Brand assets and how to get the most out of them"
[2]: https://www.siteimprove.com/blog/brand-consistency-strategies/ "Siteimprove: Brand consistency strategies"
[3]: https://www.americaneagle.com/insights/blog/post/optimizing-images-for-seo "American Eagle: Optimizing images for SEO"
[4]: https://www.adobe.com/express/learn/blog/brand-consistency "Adobe Express: Brand consistency"
