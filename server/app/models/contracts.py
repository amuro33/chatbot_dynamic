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


class QueryLogOption(BaseModel):
    id: str
    label: str
    query_param: dict[str, Any] = Field(default_factory=dict)


class SqlCandidate(BaseModel):
    id: str
    title: str
    description: str
    sql: str
    similarity: float | None = None
    parameters: list[BindParameter] = Field(default_factory=list)
    recent_options: list[QueryLogOption] = Field(default_factory=list)


class SearchRequest(BaseModel):
    user_query: str = Field(min_length=1, max_length=2000)


class SearchResponse(BaseModel):
    answer: str | None = None
    candidates: list[SqlCandidate]


class ExecuteRequest(BaseModel):
    candidate_id: str
    sql: str
    binds: dict[str, Any] = Field(default_factory=dict)


class ExecuteResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
