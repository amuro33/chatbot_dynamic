# SQL Query Chatbot

사내 OpenAI 호환 LLM과 MCP 기반 SQL 검색/실행 도구를 연결하는 챗봇입니다.

## 구조

- `server/`: FastAPI API 서버
- `client/`: Next.js 클라이언트

## 핵심 흐름

1. 사용자가 질문을 입력합니다.
2. 서버는 질문을 `user_query`로 MCP SQL 검색 도구에 전달합니다.
3. 유사도 상위 SQL 후보 3개와 설명, 실행에 필요한 바인드 파라미터 스키마를 반환합니다.
4. 클라이언트는 후보별 실행 버튼을 표시합니다.
5. 실행 버튼을 누르면 후보의 바인드 파라미터 스키마로 동적 폼을 엽니다.
6. 사용자가 값을 입력하고 실행하면 서버의 실행 라우트로 SQL ID와 파라미터를 전달합니다.
7. 실행 결과 list를 grid로 표시합니다.

## 서버 실행

```bash
cd server
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

서버는 Python 3.12 기준입니다. `server/.python-version`과 `server/pyproject.toml`에서 3.12 계열로 고정하고, 의존성은 `uv.lock`으로 잠급니다.

이미 다른 가상환경이 활성화된 셸에서 `uv sync`를 실행하면 `VIRTUAL_ENV ... will be ignored` 경고가 나올 수 있습니다. 이 프로젝트는 `server/.venv`를 기준으로 쓰므로 보통은 `deactivate` 후 다시 실행하면 됩니다. 현재 활성 가상환경에 의존성을 설치하려는 의도가 있을 때만 `uv sync --active`를 사용하세요.

## 클라이언트 실행

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

## MCP 연결 지점

서버는 streamable-http MCP 서버에 직접 연결해서 `ClientSession.call_tool()`로 도구를 호출합니다.

- `MCP_SERVER_URL`: `mcp.run(transport="streamable-http")`로 띄운 MCP 서버 URL
- `MCP_SEARCH_TOOL_NAME`: SQL 후보 검색 도구명, 기본값 `search_sql`
- `MCP_EXECUTE_TOOL_NAME`: SQL 실행 도구명, 기본값 `execute_sql`

검색 도구는 `{ "user_query": "..." }`, 실행 도구는 `{ "sql_id": "...", "sql": "...", "binds": { ... } }` 인자를 받는다고 가정합니다. 응답 스키마가 다르면 `server/app/services/mcp_client.py`만 수정하면 됩니다.
