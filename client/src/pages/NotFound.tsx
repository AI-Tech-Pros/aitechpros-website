import { Home } from "lucide-react";
import { useLocation } from "wouter";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <MarketingChrome>
      <PageMeta
        title="Page not found — AI Tech Pros"
        description="The page you requested is not on the AI Tech Pros site."
        path="/404"
      />
      <main className="subpage subpage-center">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>That URL is not part of this site. It may have moved.</p>
        <button type="button" className="button button-primary" onClick={() => setLocation("/")}>
          <Home size={16} /> Go home
        </button>
      </main>
    </MarketingChrome>
  );
}
