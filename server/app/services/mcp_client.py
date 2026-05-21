import asyncio
import json
from datetime import timedelta
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from mcp.types import CallToolResult

from app.core.config import settings
from app.models.contracts import ExecuteRequest, ExecuteResponse, QueryLogOption, SearchRequest, SearchResponse, SqlCandidate


class McpClient:
    async def search_sql(self, request: SearchRequest) -> SearchResponse:
        data = await self._call_tool(
            settings.mcp_search_tool_name,
            {"user_query": request.user_query},
        )

        data_dict = data if isinstance(data, dict) else {"result": data}
        candidates_payload = self._search_candidates_payload(data_dict)
        candidates = [self._candidate_from_payload(item) for item in candidates_payload[:3]]
        recent_options = await asyncio.gather(
            *(self._recent_options_for_candidate(candidate) for candidate in candidates),
        )
        for candidate, options in zip(candidates, recent_options, strict=False):
            candidate.recent_options = options
        return SearchResponse(answer=data_dict.get("answer"), candidates=candidates)

    async def execute_sql(self, request: ExecuteRequest) -> ExecuteResponse:
        payload = await self._call_tool(
            settings.mcp_execute_tool_name,
            {
                "query_id": request.query_id,
                "query_param": request.query_param,
            },
        )

        rows, columns = self._execute_result_rows_and_columns(payload)
        return ExecuteResponse(columns=columns, rows=rows)

    def _execute_result_rows_and_columns(self, payload: Any) -> tuple[list[dict[str, Any]], list[str]]:
        columns = None
        if isinstance(payload, list):
            raw_rows = payload
        elif isinstance(payload, dict):
            raw_rows = payload.get("rows") or payload.get("data") or payload.get("items") or payload.get("result") or []
            columns = payload.get("columns")
        else:
            raw_rows = []

        if isinstance(raw_rows, dict):
            raw_rows = [raw_rows]
        rows = [row for row in raw_rows if isinstance(row, dict)] if isinstance(raw_rows, list) else []

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

        return rows, columns

    async def _call_tool(self, tool_name: str, arguments: dict[str, Any]) -> Any:
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

        return self._result_to_payload(result)

    def _result_to_payload(self, result: CallToolResult) -> Any:
        if result.isError:
            message = self._content_text(result) or "MCP tool call failed"
            raise RuntimeError(message)

        if isinstance(result.structuredContent, dict | list):
            return result.structuredContent

        text = self._content_text(result)
        if not text:
            return {}

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"MCP tool returned non-JSON text: {text}") from exc
        if isinstance(parsed, dict | list):
            return parsed

        return {"result": parsed}

    async def _recent_options_for_candidate(self, candidate: SqlCandidate) -> list[QueryLogOption]:
        try:
            data = await self._call_tool(
                settings.mcp_query_log_tool_name,
                {"query_name": candidate.id},
            )
        except RuntimeError:
            return []

        payload = self._log_options_payload(data if isinstance(data, dict) else {"result": data})
        return [self._query_log_option_from_payload(candidate.id, index, item) for index, item in enumerate(payload[:5])]

    def _log_options_payload(self, data: dict[str, Any]) -> list[Any]:
        nested_data = data.get("data")
        if isinstance(nested_data, dict) and isinstance(nested_data.get("items"), list):
            return nested_data["items"]

        payload = data.get("logs")
        if payload is None:
            payload = data.get("options")
        if payload is None:
            payload = data.get("items")
        if payload is None:
            payload = data.get("results")
        if payload is None:
            payload = data.get("result")

        if payload is None:
            return []
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            return [payload]
        return []

    def _query_log_option_from_payload(self, query_id: str, index: int, item: Any) -> QueryLogOption:
        if not isinstance(item, dict):
            item = {"query_param": {}}

        query_param = (
            item.get("QueryParam")
            or item.get("query_param")
            or item.get("query_params")
            or item.get("params")
            or item.get("parameters")
            or item.get("binds")
            or item.get("param")
            or {}
        )
        if isinstance(query_param, str):
            query_param = self._json_dict_or_empty(query_param)
        if not isinstance(query_param, dict):
            query_param = {}

        label = (
            self._optional_str(item.get("label"))
            or self._optional_str(item.get("name"))
            or self._optional_str(item.get("CollectTime"))
            or self._optional_str(item.get("DatabaseName"))
            or self._optional_str(item.get("created_at"))
            or self._optional_str(item.get("executed_at"))
            or f"최근 옵션 {index + 1}"
        )
        option_id = self._optional_str(item.get("id")) or self._optional_str(item.get("CollectTime")) or f"{query_id}:{index}"
        return QueryLogOption(id=option_id, label=label, query_param=query_param)

    def _json_dict_or_empty(self, value: str) -> dict[str, Any]:
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}

    def _search_candidates_payload(self, data: dict[str, Any]) -> list[Any]:
        payload = data.get("candidates")
        if payload is None:
            payload = data.get("results")
        if payload is None:
            payload = data.get("result")

        if payload is None:
            return []
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            return [payload]
        return []

    def _candidate_from_payload(self, item: Any) -> SqlCandidate:
        if not isinstance(item, dict):
            item = {"api_id": str(item)}

        candidate_id = (
            item.get("api_id")
            or item.get("id")
            or item.get("sql_id")
            or item.get("candidate_id")
            or item.get("name")
        )
        if candidate_id is None:
            candidate_id = json.dumps(item, ensure_ascii=False)

        api_id = str(candidate_id)
        similarity = self._optional_float(
            item.get("similarity", item.get("sumularity", item.get("simularity", item.get("score"))))
        )
        return SqlCandidate(
            id=api_id,
            title=self._optional_str(item.get("title")) or api_id,
            description=self._optional_str(item.get("description")) or f"API ID: {api_id}",
            sql=self._optional_str(item.get("sql")) or "",
            similarity=similarity,
            parameters=item.get("parameters") if isinstance(item.get("parameters"), list) else [],
        )

    def _optional_str(self, value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    def _optional_float(self, value: Any) -> float | None:
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _content_text(self, result: CallToolResult) -> str:
        chunks = []
        for item in result.content:
            if item.type == "text":
                chunks.append(item.text)
        return "\n".join(chunks).strip()


mcp_client = McpClient()
