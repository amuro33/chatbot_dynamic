from typing import Any

import httpx

from app.core.config import settings
from app.models.contracts import ExecuteRequest, ExecuteResponse, SearchRequest, SearchResponse, SqlCandidate


class McpClient:
    async def search_sql(self, request: SearchRequest) -> SearchResponse:
        async with httpx.AsyncClient(timeout=settings.mcp_timeout_seconds) as client:
            response = await client.post(
                str(settings.mcp_search_sql_url),
                json={"user_query": request.user_query},
            )
            response.raise_for_status()
            data = response.json()

        candidates_payload = data.get("candidates") or data.get("results") or []
        candidates = [SqlCandidate.model_validate(item) for item in candidates_payload[:3]]
        return SearchResponse(answer=data.get("answer"), candidates=candidates)

    async def execute_sql(self, request: ExecuteRequest) -> ExecuteResponse:
        payload: dict[str, Any] = {
            "sql_id": request.candidate_id,
            "sql": request.sql,
            "binds": request.binds,
        }
        async with httpx.AsyncClient(timeout=settings.mcp_timeout_seconds) as client:
            response = await client.post(str(settings.mcp_execute_sql_url), json=payload)
            response.raise_for_status()
            data = response.json()

        rows = data.get("rows") or data.get("result") or data
        if not isinstance(rows, list):
            rows = []

        columns = data.get("columns")
        if not columns:
            ordered = []
            seen = set()
            for row in rows:
                if isinstance(row, dict):
                    for key in row:
                        if key not in seen:
                            seen.add(key)
                            ordered.append(key)
            columns = ordered

        return ExecuteResponse(columns=columns, rows=rows)


mcp_client = McpClient()

