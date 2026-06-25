import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { verifyMagicLink } from "@/lib/platform-api";
import { useSession } from "@/contexts/SessionContext";

export default function OrchestrateOSAuthVerify() {
  const [, setLocation] = useLocation();
  const { refresh } = useSession();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setError("Missing sign-in token.");
      return;
    }
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await verifyMagicLink(token);
      if (!result.ok) {
        setError(result.error ?? "Invalid or expired link.");
        return;
      }
      await refresh();
      setLocation(result.redirect ?? "/partner/dashboard");
    })();
  }, [refresh, setLocation]);

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container pt-28 text-center text-white/60 text-sm">
        {error ? <p className="text-red-400">{error}</p> : <p>Signing you in…</p>}
      </main>
    </div>
  );
}
