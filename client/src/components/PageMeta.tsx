import { useEffect } from "react";
import { marketingOrigin } from "@/lib/company";

type PageMetaProps = {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
};

export default function PageMeta({ title, description, path = "/", noindex = false }: PageMetaProps) {
  useEffect(() => {
    document.title = title;
    const set = (selector: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${selector}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, selector);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const origin = marketingOrigin();
    set("description", description);
    set("robots", noindex ? "noindex, nofollow" : "index, follow");
    set("og:title", title, true);
    set("og:description", description, true);
    set("og:url", `${origin}${path}`, true);
    set("og:site_name", "AI Tech Pros", true);
    set("og:image", `${origin}/assets/creative/ai-tech-pros-social-preview.png`, true);
    set("twitter:card", "summary_large_image");
    set("twitter:title", title);
    set("twitter:description", description);
    set("twitter:image", `${origin}/assets/creative/ai-tech-pros-social-preview.png`);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${origin}${path}`;
  }, [title, description, path, noindex]);

  return null;
}
