import { ArrowUpRight } from "lucide-react";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import { HENRY_SITE_URL, LEGAL_NAME, VENTURES } from "@/lib/company";

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
        <div className="venture-grid">
          {VENTURES.map((venture) => (
            <article className="venture-card" key={venture.name}>
              <h2>{venture.name}</h2>
              <p>{venture.summary}</p>
              <p className="venture-tags">{venture.tags.join(" · ")}</p>
              <a className="card-link" href={venture.href} target="_blank" rel="noreferrer">
                Visit site <ArrowUpRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </main>
    </MarketingChrome>
  );
}
