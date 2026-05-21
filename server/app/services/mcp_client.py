import json
from datetime import timedelta
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from mcp.types import CallToolResult

from app.core.config import settings
from app.models.contracts import ExecuteRequest, ExecuteResponse, SearchRequest, SearchResponse, SqlCandidate


class McpClient:
    async def search_sql(self, request: SearchRequest) -> SearchResponse:
        data = await self._call_tool(
            settings.mcp_search_tool_name,
            {"user_query": request.user_query},
        )

        candidates_payload = data.get("candidates") or data.get("results") or data.get("result") or []
        candidates = [self._candidate_from_payload(item) for item in candidates_payload[:3]]
        return SearchResponse(answer=data.get("answer"), candidates=candidates)

    async def execute_sql(self, request: ExecuteRequest) -> ExecuteResponse:
        data = await self._call_tool(
            settings.mcp_execute_tool_name,
            {
                "sql_id": request.candidate_id,
                "sql": request.sql,
                "binds": request.binds,
            },
        )

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

    async def _call_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        timeout = timedelta(seconds=settings.mcp_timeout_seconds)

        try:
            async with streamablehttp_client(
                str(settings.mcp_server_url),
                timeout=timeout,
                sse_read_timeout=timeout,
            ) as (read, write, _):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(
                        tool_name,
                        arguments=arguments,
                        read_timeout_seconds=timeout,
                    )
        except Exception as exc:
            raise RuntimeError(str(exc)) from exc

        return self._result_to_dict(result)

    def _result_to_dict(self, result: CallToolResult) -> dict[str, Any]:
        if result.isError:
            message = self._content_text(result) or "MCP tool call failed"
            raise RuntimeError(message)

        if isinstance(result.structuredContent, dict):
            return result.structuredContent

        text = self._content_text(result)
        if not text:
            return {}

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"MCP tool returned non-JSON text: {text}") from exc
        if isinstance(parsed, dict):
            return parsed

        return {"result": parsed}

    def _candidate_from_payload(self, item: Any) -> SqlCandidate:
        if not isinstance(item, dict):
            raise RuntimeError(f"MCP search returned invalid candidate: {item}")

        if "api_id" not in item:
            return SqlCandidate.model_validate(item)

        api_id = str(item["api_id"])
        similarity = item.get("similarity", item.get("sumularity"))
        return SqlCandidate(
            id=api_id,
            title=item.get("title") or api_id,
            description=item.get("description") or f"API ID: {api_id}",
            sql=item.get("sql") or "",
            similarity=similarity,
            parameters=item.get("parameters") or [],
        )

    def _content_text(self, result: CallToolResult) -> str:
        chunks = []
        for item in result.content:
            if item.type == "text":
                chunks.append(item.text)
        return "\n".join(chunks).strip()


mcp_client = McpClient()
