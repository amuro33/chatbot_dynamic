from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_env: str = "local"
    client_origin: str = "http://localhost:3000"

    llm_base_url: AnyHttpUrl = "https://internal-llm.example.com/v1"
    llm_model: str = "internal-chat-model"
    llm_x_dep_ticket: str = ""
    llm_send_system_name: str = ""
    llm_user_id: str = ""
    llm_user_type: str = ""

    mcp_search_sql_url: AnyHttpUrl = "http://localhost:9000/tools/search-sql"
    mcp_execute_sql_url: AnyHttpUrl = "http://localhost:9000/tools/execute-sql"
    mcp_timeout_seconds: float = Field(default=60, gt=0)


settings = Settings()
