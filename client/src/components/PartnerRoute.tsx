import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSession } from "@/contexts/SessionContext";

export default function PartnerRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session.authenticated) {
      setLocation("/login");
    }
  }, [loading, session.authenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center text-white/50 text-sm">
        Loading…
      </div>
    );
  }

  if (!session.authenticated) return null;

  return <>{children}</>;
}
