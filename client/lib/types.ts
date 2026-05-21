export type ParameterType = "string" | "number" | "date" | "datetime" | "boolean" | "select";

export type BindParameter = {
  name: string;
  label?: string | null;
  type: ParameterType;
  required: boolean;
  description?: string | null;
  default?: unknown;
  options?: string[] | null;
};

export type Author = {
  name: string;
  team?: string | null;
};

export type SqlCandidate = {
  id: string;
  workspace: string;
  title: string;
  description: string;
  sql: string;
  similarity?: number | null;
  parameters: BindParameter[];
  recent_options: QueryLogOption[];
  tables?: string[] | null;
  author: Author;
};

export type QueryLogOption = {
  id: string;
  ran_at: string;
  query_param: Record<string, unknown>;
};

export type SearchResponse = {
  answer?: string | null;
  candidates: SqlCandidate[];
};

export type ExecuteResponse = {
  columns: string[];
  rows: Record<string, unknown>[];
  elapsed_ms?: number | null;
  ran_at?: string | null;
};
