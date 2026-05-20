from typing import Any

import httpx

from app.core.config import settings


class LlmClient:
    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "x-dep_ticket": settings.llm_x_dep_ticket,
            "Send-System-Name": settings.llm_send_system_name,
            "User-Id": settings.llm_user_id,
            "User-Type": settings.llm_user_type,
        }

    async def chat(self, messages: list[dict[str, str]]) -> str:
        url = f"{str(settings.llm_base_url).rstrip('/')}/chat/completions"
        payload: dict[str, Any] = {
            "model": settings.llm_model,
            "messages": messages,
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload, headers=self._headers())
            response.raise_for_status()
            data = response.json()
        return data["choices"][0]["message"]["content"]


llm_client = LlmClient()

