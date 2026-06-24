import { useState } from "react";
import { Link } from "wouter";
import OrchestrateOSNavbar from "@/components/OrchestrateOSNavbar";
import { requestMagicLink } from "@/lib/platform-api";

export default function OrchestrateOSLogin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await requestMagicLink(email.trim());
    setStatus("sent");
    setMessage(
      result.message ??
        "If an account exists for this email, a sign-in link has been sent.",
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D17]">
      <OrchestrateOSNavbar />
      <main className="container max-w-md pt-28 pb-16">
        <h1 className="text-2xl font-bold text-white font-[Montserrat] mb-2">Partner sign in</h1>
        <p className="text-white/50 text-sm mb-8">
          Magic link only — no password. Design partners and admins only.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sent"}
            className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-white"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "sent"}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-[#06B6D4]">{message}</p>}
        <p className="mt-8 text-sm text-white/40">
          <Link href="/" className="text-[#06B6D4] hover:underline">
            ← Back to OrchestrateOS
          </Link>
        </p>
      </main>
    </div>
  );
}
