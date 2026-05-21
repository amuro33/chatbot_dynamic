from typing import Any, Literal

from pydantic import BaseModel, Field


ParameterType = Literal["string", "number", "date", "datetime", "boolean", "select"]


class BindParameter(BaseModel):
    name: str
    label: str | None = None
    type: ParameterType = "string"
    required: bool = True
    description: str | None = None
    default: Any | None = None
    options: list[str] | None = None


class Author(BaseModel):
    name: str
    team: str | None = None


class QueryLogOption(BaseModel):
    id: str
    ran_at: str = ""
    query_param: dict[str, Any] = Field(default_factory=dict)


class SqlCandidate(BaseModel):
    id: str
    workspace: str = ""
    title: str
    description: str
    sql: str
    similarity: float | None = None
    parameters: list[BindParameter] = Field(default_factory=list)
    recent_options: list[QueryLogOption] = Field(default_factory=list)
    tables: list[str] = Field(default_factory=list)
    author: Author = Field(default_factory=lambda: Author(name=""))


class SearchRequest(BaseModel):
    user_query: str = Field(min_length=1, max_length=2000)


class SearchResponse(BaseModel):
    answer: str | None = None
    candidates: list[SqlCandidate]


class ExecuteRequest(BaseModel):
    query_id: str
    query_param: dict[str, Any] = Field(default_factory=dict)


class ExecuteResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    elapsed_ms: int | None = None
    ran_at: str | None = None
