import { ArrowUpRight } from "lucide-react";
import MarketingChrome from "@/components/MarketingChrome";
import PageMeta from "@/components/PageMeta";
import { CONVERSATION_PATH, SKOOL_URL } from "@/lib/company";

export default function Academy() {
  return (
    <MarketingChrome>
      <PageMeta
        title="Jenkins Cyber Academy — AI Tech Pros"
        description="Free live CompTIA Security+ study, hands-on labs, and career support. Join the Henry Jenkins Mentorship community. Practice remains free whether or not you join."
        path="/academy"
      />
      <main id="main" className="subpage">
        <header className="subpage-hero">
          <p className="eyebrow">Jenkins Cyber Academy</p>
          <h1>Free live cybersecurity study, hands-on practice, and career support.</h1>
          <p>
            Weekday live instruction on Security+ (SY0-701), labs, and Q&amp;A. The public stream earns trust. This page explains the offer. The Henry Jenkins Mentorship community on Skool is the learner home — lesson map, lab briefs, and weekly Q&amp;A.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href={SKOOL_URL} target="_blank" rel="noreferrer">
              Join the free study community <ArrowUpRight size={17} />
            </a>
            <a className="text-link" href={CONVERSATION_PATH}>
              Optional career conversation
            </a>
          </div>
        </header>

        <section className="prose-light" aria-labelledby="academy-how">
          <h2 id="academy-how">How it works</h2>
          <ul>
            <li>Live classroom: weekday streams recycled into VODs and short-form clips.</li>
            <li>One student destination: Skool for the chronological Security+ path, labs, and office hours.</li>
            <li>Free study stays free. Community membership is optional. We do not gate reports, labs, or help on a paid join.</li>
            <li>No exam-dump material. No pass, job, or salary guarantees.</li>
          </ul>
        </section>

        <section className="prose-light" aria-labelledby="academy-funnel">
          <h2 id="academy-funnel">Practice first. Career ops only if you want them.</h2>
          <p>
            If you complete a study plan and want accountability, portfolio feedback, live Q&amp;A, and practical job-search support after certification, explore the optional Henry Jenkins Mentorship: Career Ops Community. The invitation is a normal outbound link. We do not send scores, answers, or your email into that destination.
          </p>
          <p>
            <strong>Free Security+ practice remains available whether or not you join.</strong>
          </p>
        </section>
      </main>
    </MarketingChrome>
  );
}
