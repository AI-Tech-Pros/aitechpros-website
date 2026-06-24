/*
 * Shared layout for OrchestrateOS marketing subpages.
 */
import type { ReactNode } from "react";
import { Link } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { orchestrateOSApiDocsUrl } from "@/lib/site";
import { ArrowLeft } from "lucide-react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
};

export default function OrchestrateOSSubpage({ eyebrow, title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-[#0B0D17] text-white/80">
      <OrchestrateOSNavbar />
      <main className="pt-28 pb-20">
        <div className="container max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to OrchestrateOS
          </Link>

          <div className="mb-12">
            <span className="text-sm font-medium text-[#8B5CF6] tracking-widest uppercase font-[Montserrat] mb-4 block">
              {eyebrow}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[Montserrat] mb-4">
              {title}
            </h1>
            {subtitle && <p className="text-white/45 text-lg leading-relaxed">{subtitle}</p>}
          </div>

          <div className="space-y-8 text-white/60 leading-relaxed">{children}</div>
        </div>
      </main>

      <footer className="bg-[#080A12] border-t border-white/[0.04] py-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} AI Tech Pros, Inc. · OrchestrateOS
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/governance" className="text-xs text-white/30 hover:text-white/50">
              Governance guide
            </Link>
            <Link href="/compliance" className="text-xs text-white/30 hover:text-white/50">
              Compliance
            </Link>
            <Link href="/install" className="text-xs text-white/30 hover:text-white/50">
              Install
            </Link>
            <Link href="/compare" className="text-xs text-white/30 hover:text-white/50">
              Compare
            </Link>
            <a
              href={orchestrateOSApiDocsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/50"
            >
              API docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-card rounded-2xl border-white/[0.06] p-6 lg:p-8">
      <h2 className="text-xl font-bold text-white font-[Montserrat] mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
