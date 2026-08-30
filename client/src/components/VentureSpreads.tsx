import { ArrowUpRight } from "lucide-react";
import { VENTURES } from "@/lib/company";

type VentureSpreadsProps = {
  headingLevel?: "h2" | "h3";
};

export default function VentureSpreads({ headingLevel = "h3" }: VentureSpreadsProps) {
  const Heading = headingLevel;

  return (
    <div className="venture-spreads">
      {VENTURES.map((venture, index) => (
        <article className="venture-spread" key={venture.name}>
          <div className="venture-spread-media">
            <img src={venture.image} alt={venture.alt} loading="lazy" />
          </div>
          <div className="venture-spread-copy">
            <p className="eyebrow">
              {String(index + 1).padStart(2, "0")}
            </p>
            <Heading>{venture.name}</Heading>
            <p>{venture.summary}</p>
            <p className="venture-tags">{venture.tags.join(" · ")}</p>
            <a
              className="card-link"
              href={venture.href}
              {...(/^https?:\/\//i.test(venture.href) ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              Visit site <ArrowUpRight size={15} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
