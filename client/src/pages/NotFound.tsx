import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";

export default function NotFound() {
  const [path] = useLocation();

  return (
    <MarketingChrome>
      <PageMeta
        title="Page not found — AI Tech Pros"
        description="That URL is not part of the AI Tech Pros, Inc. marketing site."
        path={path === "/404" ? "/404" : path}
        noindex
      />
      <main id="main" className="subpage legal-page">
        <header className="subpage-hero">
          <p className="eyebrow">404</p>
          <h1>Page not found</h1>
          <p>That URL is not part of this site. It may have moved.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="/">
              Go home <ArrowUpRight size={17} />
            </a>
            <a className="text-link" href="/conversation">
              Start a conversation
            </a>
          </div>
        </header>
      </main>
    </MarketingChrome>
  );
}
