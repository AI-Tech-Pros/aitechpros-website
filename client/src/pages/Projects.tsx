import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import VentureSpreads from "@/components/VentureSpreads";
import { HENRY_SITE_URL, LEGAL_NAME } from "@/lib/company";

export default function Projects() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Ventures — AI Tech Pros"
        description="The same public ventures listed on henryljenkins.com: AI Tech Pros, Negotiate Medical Bill, and MedStore Inc."
        path="/projects"
      />
      <main className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Ventures</p>
          <h1>The same projects as henryljenkins.com</h1>
          <p>
            {LEGAL_NAME} is the parent company. These three live sites are the public portfolio on{" "}
            <a href={HENRY_SITE_URL} target="_blank" rel="noreferrer">
              henryljenkins.com
            </a>
            . MedStore Inc. is now part of AI Tech Pros, Inc.
          </p>
        </header>
        <VentureSpreads headingLevel="h2" />
      </main>
    </MarketingChrome>
  );
}
