import { KERNEL_MODEL } from "./agents";

type AiBinding = {
  run(
    model: string,
    inputs: { messages: { role: string; content: string }[]; max_tokens?: number },
  ): Promise<{ response?: string } | string>;
};

export async function runKernelLlm(
  ai: AiBinding | undefined,
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  if (!ai) {
    throw new Error("Workers AI binding not configured (add [ai] binding = \"AI\" in wrangler.toml)");
  }

  const raw = await ai.run(KERNEL_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    max_tokens: 768,
  });

  if (typeof raw === "string") return raw.trim();
  const text = raw?.response;
  if (typeof text === "string" && text.trim()) return text.trim();
  throw new Error("Empty LLM response from Workers AI");
}
