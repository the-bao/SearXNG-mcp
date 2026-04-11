#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { search, autocomplete, getConfig } from "./searxng-client.js";
import type { SearchResult, ResponseFormat } from "./types.js";

const CHARACTER_LIMIT = 25000;

// ─── Search Presets ──────────────────────────────────────────────────

const SEARCH_PRESETS: Record<
  string,
  { categories?: string; engines?: string; time_range?: string; description: string }
> = {
  general: {
    description: "General web search using all enabled engines",
  },
  code: {
    engines: "github,stackoverflow",
    description:
      "Search for code repositories and programming resources (GitHub, StackOverflow)",
  },
  tech: {
    categories: "it",
    description: "Search for IT and computer science related content",
  },
  academic: {
    categories: "science",
    engines: "google scholar,arxiv,pubmed",
    description:
      "Search for scientific papers and academic research (arXiv, PubMed, Google Scholar)",
  },
  news: {
    categories: "news",
    time_range: "month",
    description: "Search for recent news from the past month",
  },
};

const server = new McpServer({
  name: "searxng-mcp-server",
  version: "1.0.0",
});

// ─── Tool: searxng_search ───────────────────────────────────────────

const SearchInputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .max(500)
      .describe(
        "Search query string. Supports search engine syntax like site:github.com, filetype:pdf, etc."
      ),
    preset: z
      .enum(["general", "code", "tech", "academic", "news"])
      .optional()
      .describe(
        "Search preset for common use cases. " +
          "'general' = all engines, no category filter; " +
          "'code' = search GitHub and StackOverflow for code and programming; " +
          "'tech' = IT category for computer science and technology; " +
          "'academic' = science category for papers and research (arXiv, PubMed, Google Scholar); " +
          "'news' = recent news from the past month. " +
          "Leave empty to manually specify categories/engines."
      ),
    categories: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of search categories. Examples: 'general', 'news', 'images', 'videos', 'science', 'it', 'files', 'music', 'repos', 'packages'. Leave empty for general search."
      ),
    engines: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of search engines to use. Examples: 'google', 'bing', 'duckduckgo', 'wikipedia', 'github', 'stackoverflow', 'arxiv', 'pubmed', 'youtube'. Leave empty to use all enabled engines."
      ),
    language: z
      .string()
      .optional()
      .describe(
        "Language code for search results. Examples: 'en', 'zh', 'ja', 'de', 'fr', 'es'. Leave empty for default."
      ),
    pageno: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(1)
      .describe("Page number for paginated results (default: 1)."),
    time_range: z
      .enum(["day", "month", "year"])
      .optional()
      .describe(
        "Time range filter. Only return results from the specified period. Use 'day' for very recent results, 'month' for results from the past month, 'year' for the past year."
      ),
    safesearch: z
      .number()
      .int()
      .min(0)
      .max(2)
      .default(0)
      .describe(
        "Safe search level: 0=off, 1=moderate, 2=strict (default: 0)."
      ),
    response_format: z
      .enum(["markdown", "json"])
      .default("markdown")
      .describe(
        "Output format: 'markdown' for human-readable, 'json' for structured data (default: 'markdown')."
      ),
  })
  .strict();

type SearchInput = z.infer<typeof SearchInputSchema>;

server.registerTool(
  "searxng_search",
  {
    title: "SearXNG Web Search",
    description: `Search the web using SearXNG metasearch engine. Aggregates results from multiple search engines (Google, Bing, DuckDuckGo, Wikipedia, etc.) for comprehensive results.

Supports filtering by category (news, images, videos, science, IT, etc.), specific engines, language, time range, and safe search.

**Presets** provide quick access to common search scenarios:
  - 'general' — all engines, no filter (default web search)
  - 'code' — GitHub + StackOverflow for code and programming questions
  - 'tech' — IT category for computer science and technology topics
  - 'academic' — science category + arXiv/PubMed/Google Scholar for papers and research
  - 'news' — news category, past month

When a preset is used, explicit categories/engines/time_range params still take precedence over preset defaults.

Args:
  - query (string, required): Search query. Supports syntax like site:, filetype:, etc.
  - preset ('general'|'code'|'tech'|'academic'|'news', optional): Quick search mode — see above
  - categories (string, optional): Filter by category ('general', 'news', 'images', 'videos', 'science', 'it', 'files', 'music', 'repos', 'packages')
  - engines (string, optional): Specific engines ('google', 'bing', 'duckduckgo', 'wikipedia', 'github', 'stackoverflow', 'arxiv', 'pubmed', 'youtube')
  - language (string, optional): Language code ('en', 'zh', 'ja', 'de', 'fr', 'es')
  - pageno (number, default 1): Page number (1-50)
  - time_range ('day'|'month'|'year', optional): Time filter for recent results
  - safesearch (number, default 0): 0=off, 1=moderate, 2=strict
  - response_format ('markdown'|'json', default 'markdown'): Output format

Returns structured search results including:
  - results[]: Array of {title, url, content, engine, engines[], score, category}
  - answers[]: Instant answers from SearXNG
  - suggestions[]: Related search suggestions
  - infoboxes[]: Summary info boxes with links and attributes

Examples:
  - "Search for Rust programming tutorials" -> query="Rust programming tutorials", preset="general"
  - "Find recent news about AI" -> query="AI", preset="news"
  - "Search GitHub for MCP servers" -> query="MCP server", preset="code"
  - "Find scientific papers about transformers" -> query="transformer model", preset="academic"
  - "What is WebAssembly?" -> query="What is WebAssembly", preset="tech"

Error Handling:
  - Returns "403 Forbidden" error if JSON format is not enabled in SearXNG settings
  - Returns connection error if SearXNG server is unreachable`,
    inputSchema: SearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: SearchInput) => {
    try {
      // Apply preset defaults, explicit params take precedence
      const preset = params.preset ? SEARCH_PRESETS[params.preset] : undefined;

      const data = await search(params.query, {
        categories: params.categories ?? preset?.categories,
        engines: params.engines ?? preset?.engines,
        language: params.language,
        pageno: params.pageno,
        time_range: params.time_range ?? (preset?.time_range as "day" | "month" | "year" | undefined),
        safesearch: params.safesearch,
      });

      const results: SearchResult = {
        total: data.number_of_results,
        count: data.results.length,
        page: params.pageno,
        query: data.query,
        results: data.results.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content || "",
          engine: r.engine,
          engines: r.engines,
          score: r.score,
          category: r.category,
          ...(r.thumbnail ? { thumbnail: r.thumbnail } : {}),
          ...(r.publishedDate
            ? { publishedDate: parsePublishedDate(r.publishedDate) }
            : {}),
        })),
        answers: data.answers || [],
        suggestions: data.suggestions || [],
        infoboxes: (data.infoboxes || []).map((ib) => ({
          title: ib.infobox || "",
          content: ib.content || "",
          url: ib.url || "",
          source_engines: ib.engines || [],
          ...(ib.urls?.length ? { links: ib.urls } : {}),
          ...(ib.attributes?.length ? { attributes: ib.attributes } : {}),
        })),
        unresponsive_engines: data.unresponsive_engines || [],
        has_more: data.results.length >= 10,
      };

      const format = params.response_format as ResponseFormat;
      const textContent = formatTextContent(results, format);

      // Truncate if needed
      const truncated =
        textContent.length > CHARACTER_LIMIT
          ? textContent.slice(0, CHARACTER_LIMIT) +
            "\n\n... [Response truncated. Use pageno parameter for more results.]"
          : textContent;

      return {
        content: [{ type: "text" as const, text: truncated }],
        structuredContent: results,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

function parsePublishedDate(value: number | string): string | undefined {
  try {
    let date: Date;
    if (typeof value === "number") {
      date = new Date(value * 1000);
    } else {
      date = new Date(value);
    }
    const iso = date.toISOString();
    return iso === "Invalid Date" ? undefined : iso;
  } catch {
    return undefined;
  }
}

function formatTextContent(
  results: SearchResult,
  format: ResponseFormat
): string {
  if (format === "json") {
    return JSON.stringify(results, null, 2);
  }

  const lines: string[] = [];

  // Header
  lines.push(`# Search: "${results.query}"`);
  lines.push(
    `Found ~${results.total} results (page ${results.page}, showing ${results.count})`
  );
  lines.push("");

  // Instant answers
  if (results.answers.length > 0) {
    lines.push("## Quick Answers");
    for (const answer of results.answers) {
      lines.push(`> ${answer}`);
    }
    lines.push("");
  }

  // Infoboxes
  if (results.infoboxes.length > 0) {
    for (const ib of results.infoboxes) {
      lines.push(`## Info: ${ib.title}`);
      if (ib.content) lines.push(ib.content);
      if (ib.attributes?.length) {
        for (const attr of ib.attributes) {
          lines.push(`- **${attr.label}**: ${attr.value}`);
        }
      }
      if (ib.links?.length) {
        lines.push("Links:");
        for (const link of ib.links) {
          lines.push(`  - [${link.title}](${link.url})`);
        }
      }
      lines.push("");
    }
  }

  // Search results
  for (let i = 0; i < results.results.length; i++) {
    const r = results.results[i];
    lines.push(`### ${i + 1}. ${r.title}`);
    lines.push(`**URL**: ${r.url}`);
    if (r.content) lines.push(r.content);
    lines.push(
      `*Source: ${r.engine} | Score: ${r.score.toFixed(2)} | Category: ${r.category}*`
    );
    lines.push("");
  }

  // Suggestions
  if (results.suggestions.length > 0) {
    lines.push("## Related Searches");
    for (const s of results.suggestions) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  // Unresponsive engines
  if (results.unresponsive_engines.length > 0) {
    lines.push(
      `*Unresponsive engines: ${results.unresponsive_engines.join(", ")}*`
    );
  }

  return lines.join("\n");
}

// ─── Tool: searxng_autocomplete ─────────────────────────────────────

const AutocompleteInputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .max(200)
      .describe("Partial search query to get autocomplete suggestions for."),
    language: z
      .string()
      .optional()
      .describe("Language code for suggestions (e.g., 'en', 'zh')."),
  })
  .strict();

type AutocompleteInput = z.infer<typeof AutocompleteInputSchema>;

server.registerTool(
  "searxng_autocomplete",
  {
    title: "SearXNG Autocomplete",
    description: `Get search query autocomplete suggestions from SearXNG. Returns a list of suggested completions for a partial search query.

Args:
  - query (string, required): Partial search query
  - language (string, optional): Language code (e.g., 'en', 'zh')

Returns:
  Array of suggested search query completions.

Examples:
  - query="rust prog" -> ["rust programming", "rust programming language", "rust programming tutorial"]`,
    inputSchema: AutocompleteInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params: AutocompleteInput) => {
    try {
      const suggestions = await autocomplete(params.query, params.language);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ suggestions }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);

// ─── Start server ───────────────────────────────────────────────────

async function main() {
  const baseUrl = process.env.SEARXNG_BASE_URL;
  if (!baseUrl) {
    console.error(
      "ERROR: SEARXNG_BASE_URL environment variable is required.\n" +
        "Set it to your SearXNG instance URL, e.g.:\n" +
        '  SEARXNG_BASE_URL="https://search.example.com" node dist/index.js'
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`SearXNG MCP server running via stdio (${baseUrl.replace(/\/+$/, "")})`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
