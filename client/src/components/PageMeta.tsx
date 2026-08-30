import { useEffect } from "react";
import { SITE_URL } from "@/lib/company";

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

    set("description", description);
    set("robots", noindex ? "noindex, nofollow" : "index, follow");
    set("og:title", title, true);
    set("og:description", description, true);
    set("og:url", `${SITE_URL}${path}`, true);
    set("og:image", `${SITE_URL}/assets/creative/ai-tech-pros-social-preview.png`, true);
    set("twitter:card", "summary_large_image");
    set("twitter:title", title);
    set("twitter:description", description);
    set("twitter:image", `${SITE_URL}/assets/creative/ai-tech-pros-social-preview.png`);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}${path}`;
  }, [title, description, path, noindex]);

  return null;
}
