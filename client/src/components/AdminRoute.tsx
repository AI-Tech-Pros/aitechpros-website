import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSession } from "@/contexts/SessionContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session.authenticated) {
      setLocation("/login");
      return;
    }
    if (!loading && session.authenticated && session.role !== "admin") {
      setLocation("/partner/dashboard");
    }
  }, [loading, session.authenticated, session.role, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D17] flex items-center justify-center text-white/50 text-sm">
        Loading…
      </div>
    );
  }

  if (!session.authenticated || session.role !== "admin") return null;

  return <>{children}</>;
}
