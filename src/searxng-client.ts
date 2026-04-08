import type {
  SearXNGResponse,
  SearXNGConfig,
  AutocompleteResponse,
} from "./types.js";

function getBaseUrl(): string {
  const url = process.env.SEARXNG_BASE_URL;
  if (!url) {
    throw new Error(
      "SEARXNG_BASE_URL environment variable is required. " +
        "Set it to your SearXNG instance URL, e.g. https://search.example.com"
    );
  }
  return url.replace(/\/+$/, "");
}

export async function search(
  query: string,
  options?: {
    categories?: string;
    engines?: string;
    language?: string;
    pageno?: number;
    time_range?: string;
    safesearch?: number;
  }
): Promise<SearXNGResponse> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
  });

  if (options?.categories) params.set("categories", options.categories);
  if (options?.engines) params.set("engines", options.engines);
  if (options?.language) params.set("language", options.language);
  if (options?.pageno && options.pageno > 1)
    params.set("pageno", String(options.pageno));
  if (options?.time_range) params.set("time_range", options.time_range);
  if (options?.safesearch !== undefined)
    params.set("safesearch", String(options.safesearch));

  const url = `${getBaseUrl()}/search?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        "SearXNG returned 403 Forbidden. JSON format may not be enabled. " +
          "Add 'json' to the formats list in your SearXNG settings.yml under the 'search' section."
      );
    }
    throw new Error(
      `SearXNG request failed with status ${response.status}: ${response.statusText}`
    );
  }

  return (await response.json()) as SearXNGResponse;
}

export async function autocomplete(
  query: string,
  language?: string
): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
  });
  if (language) params.set("language", language);

  const url = `${getBaseUrl()}/autocompleter?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `SearXNG autocomplete failed with status ${response.status}`
    );
  }

  const data = (await response.json()) as AutocompleteResponse;
  return data.suggestions || [];
}

export async function getConfig(): Promise<SearXNGConfig> {
  const url = `${getBaseUrl()}/config`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch SearXNG config: ${response.status}`
    );
  }

  return (await response.json()) as SearXNGConfig;
}
