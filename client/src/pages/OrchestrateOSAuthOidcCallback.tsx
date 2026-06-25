import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { exchangeOidcCode, setStoredSessionToken } from "@/lib/platform-api";

export default function OrchestrateOSAuthOidcCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const err = params.get("error");
      if (err) {
        setError(`SSO error: ${err}`);
        return;
      }
      if (!code) {
        setError("Missing authorization code");
        return;
      }
      try {
        const result = await exchangeOidcCode(code);
        setStoredSessionToken(result.token);
        navigate(result.redirect);
      } catch (e) {
        setError(e instanceof Error ? e.message : "SSO sign-in failed");
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container max-w-md pt-28 pb-16 text-center">
        {error ? (
          <>
            <p className="text-red-400 text-sm">{error}</p>
            <a href="/login" className="text-[#06B6D4] text-sm mt-4 inline-block hover:underline">
              Back to sign in
            </a>
          </>
        ) : (
          <p className="text-white/50 text-sm">Completing SSO sign-in…</p>
        )}
      </main>
    </div>
  );
}
