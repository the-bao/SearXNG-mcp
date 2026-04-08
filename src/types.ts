export interface SearXNGResult {
  url: string;
  title: string;
  content: string;
  engine: string;
  engines: string[];
  score: number;
  category: string;
  parsed_url: string[];
  thumbnail?: string;
  publishedDate?: number | string;
}

export interface SearXNGResponse {
  query: string;
  number_of_results: number;
  results: SearXNGResult[];
  answers: string[];
  corrections: string[];
  infoboxes: Infobox[];
  suggestions: string[];
  unresponsive_engines: string[];
}

export interface Infobox {
  engine: string;
  engines: string[];
  infobox: string;
  content: string;
  url: string;
  urls?: { title: string; url: string }[];
  attributes?: { label: string; value: string }[];
}

export interface SearXNGConfig {
  categories: string[];
  engines: EngineInfo[];
}

export interface EngineInfo {
  name: string;
  categories: string[];
  enabled: boolean;
  shortcut: string;
  language_support: boolean;
  paging: boolean;
  safesearch: boolean;
  time_range_support: boolean;
}

export interface AutocompleteResponse {
  suggestions: string[];
}

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

export type SearchResult = {
  total: number;
  count: number;
  page: number;
  query: string;
  results: {
    title: string;
    url: string;
    content: string;
    engine: string;
    engines: string[];
    score: number;
    category: string;
    thumbnail?: string;
    publishedDate?: string;
  }[];
  answers: string[];
  suggestions: string[];
  infoboxes: {
    title: string;
    content: string;
    url: string;
    source_engines: string[];
    links?: { title: string; url: string }[];
    attributes?: { label: string; value: string }[];
  }[];
  unresponsive_engines: string[];
  has_more: boolean;
  [key: string]: unknown;
};
