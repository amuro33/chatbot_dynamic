from fastapi import APIRouter, HTTPException
from httpx import HTTPStatusError, RequestError

from app.models.contracts import ExecuteRequest, ExecuteResponse, SearchRequest, SearchResponse
from app.services.llm_client import llm_client
from app.services.mcp_client import mcp_client

router = APIRouter()


@router.post("/chat/search", response_model=SearchResponse)
async def search(request: SearchRequest) -> SearchResponse:
    try:
        response = await mcp_client.search_sql(request)
        if response.answer:
            return response

        try:
            response.answer = await llm_client.chat(
                [
                    {
                        "role": "system",
                        "content": "You briefly explain that SQL candidates were found. Do not invent SQL or parameters.",
                    },
                    {
                        "role": "user",
                        "content": (
                            f"User question: {request.user_query}\n"
                            f"Candidate titles: {[candidate.title for candidate in response.candidates]}"
                        ),
                    },
                ]
            )
        except Exception:
            response.answer = f"SQL 후보 {len(response.candidates)}개를 찾았습니다."

        return response
    except HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"MCP SQL search failed: {exc.response.text}") from exc
    except RequestError as exc:
        raise HTTPException(status_code=502, detail=f"MCP SQL search unavailable: {exc}") from exc


@router.post("/sql/execute", response_model=ExecuteResponse)
async def execute(request: ExecuteRequest) -> ExecuteResponse:
    try:
        return await mcp_client.execute_sql(request)
    except HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"MCP SQL execute failed: {exc.response.text}") from exc
    except RequestError as exc:
        raise HTTPException(status_code=502, detail=f"MCP SQL execute unavailable: {exc}") from exc
