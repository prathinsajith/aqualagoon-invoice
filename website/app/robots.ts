import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

// AI search/answer engines discover and cite pages via these crawlers. We
// explicitly welcome them (in addition to the "*" allow) so the site is
// eligible to appear in ChatGPT, Gemini, Perplexity, Claude, etc.
const AI_AND_SEARCH_BOTS = [
  "GPTBot", // OpenAI training/index
  "OAI-SearchBot", // ChatGPT search
  "ChatGPT-User", // ChatGPT browsing on a user's behalf
  "Google-Extended", // Gemini / Google AI
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-Web",
  "Anthropic-AI",
  "Amazonbot",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "CCBot", // Common Crawl — feeds many LLMs
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_AND_SEARCH_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
