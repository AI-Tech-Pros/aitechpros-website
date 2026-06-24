import { useState } from "react";
import { submitLead } from "@/lib/platform-api";

export default function LeadCaptureForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const result = await submitLead({ name, email, company, use_case: useCase });
    if (result.ok) {
      setStatus("done");
      setMessage(result.message ?? "Thanks — we'll be in touch.");
      setName("");
      setEmail("");
      setCompany("");
      setUseCase("");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/30"
        />
        <input
          required
          type="email"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/30"
        />
      </div>
      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/30"
      />
      <textarea
        placeholder="Use case (e.g. LangGraph claims pipeline, 20+ steps)"
        value={useCase}
        onChange={(e) => setUseCase(e.target.value)}
        rows={3}
        className="w-full rounded-xl bg-black/40 border border-white/[0.08] px-4 py-3 text-sm text-white placeholder:text-white/30 resize-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white text-sm font-semibold font-[Montserrat] disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Request early access"}
      </button>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-400" : "text-[#06B6D4]"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
