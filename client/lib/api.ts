import type { ExecuteResponse, SearchResponse, SqlCandidate } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function searchSql(userQuery: string): Promise<SearchResponse> {
  return request<SearchResponse>("/api/chat/search", {
    method: "POST",
    body: JSON.stringify({ user_query: userQuery }),
  });
}

export function executeSql(
  candidate: SqlCandidate,
  queryParam: Record<string, unknown>,
): Promise<ExecuteResponse> {
  return request<ExecuteResponse>("/api/sql/execute", {
    method: "POST",
    body: JSON.stringify({
      query_id: candidate.id,
      query_param: queryParam,
    }),
  });
}
