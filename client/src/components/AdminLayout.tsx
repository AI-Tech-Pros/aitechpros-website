import { Link, useLocation } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { useSession } from "@/contexts/SessionContext";

const tabs: { label: string; href: string; disabled?: boolean }[] = [
  { label: "Capture", href: "/admin/capture" },
  { label: "Partners", href: "/admin/partners" },
  { label: "Outcomes", href: "/admin/outcomes", disabled: true },
];

export default function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [path] = useLocation();
  const { session, signOut } = useSession();

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container pt-24 pb-16 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-[Montserrat]">{title}</h1>
            <p className="text-white/50 text-sm mt-1">{session.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-white/40 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8 border-b border-white/[0.06] pb-4">
          {tabs.map((tab) =>
            tab.disabled ? (
              <span
                key={tab.href}
                className="px-4 py-2 text-sm text-white/25 rounded-lg cursor-not-allowed"
                title="Phase 5f"
              >
                {tab.label}
                <span className="ml-1 text-[10px] uppercase">soon</span>
              </span>
            ) : (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  path === tab.href
                    ? "bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20"
                    : "text-white/50 hover:text-white border border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            ),
          )}
        </nav>

        {children}
      </main>
    </div>
  );
}
