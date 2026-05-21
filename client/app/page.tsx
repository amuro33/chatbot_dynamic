"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Send } from "lucide-react";
import { executeSql, searchSql } from "../lib/api";
import type { ExecuteResponse, QueryLogOption, SearchResponse, SqlCandidate } from "../lib/types";
import { CandidateCard } from "../components/CandidateCard";
import { ExecutionPanel } from "../components/ExecutionPanel";
import { ResultGrid } from "../components/ResultGrid";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [query, setQuery] = useState("웨이퍼 단위 제조 및 측정 데이터");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "질문을 입력하면 검색 점수가 높은 SQL 3개를 찾아 실행 설정까지 연결합니다.",
    },
  ]);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<SqlCandidate | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [bindValues, setBindValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = searchResponse?.candidates ?? [];
  const hasCandidates = candidates.length > 0;
  const maxCandidateScore = Math.max(
    0,
    ...candidates.map((candidate) =>
      typeof candidate.similarity === "number" ? candidate.similarity : 0,
    ),
  );

  const status = useMemo(() => {
    if (isSearching) return "SQL 검색 중";
    if (isExecuting) return "SQL 실행 중";
    if (selectedCandidate) return "실행 옵션 선택됨";
    return "대기";
  }, [isExecuting, isSearching, selectedCandidate]);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setIsSearching(true);
    setSearchResponse(null);
    setSelectedCandidate(null);
    setSelectedOptionId(null);
    setBindValues({});
    setResult(null);
    setMessages((current) => [...current, { role: "user", content: trimmed }]);

    try {
      const response = await searchSql(trimmed);
      setSearchResponse(response);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer || `SQL 후보 ${response.candidates.length}개를 찾았습니다.`,
        },
      ]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "SQL 검색에 실패했습니다.";
      setError(message);
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setIsSearching(false);
      setQuery("");
    }
  }

  function selectCandidate(candidate: SqlCandidate) {
    setSelectedCandidate(candidate);
    setSelectedOptionId(null);
    setBindValues({});
    setResult(null);
    setError(null);
  }

  function selectRecentOption(candidate: SqlCandidate, option: QueryLogOption) {
    setSelectedCandidate(candidate);
    setSelectedOptionId(option.id);
    setBindValues(option.query_param);
    setResult(null);
    setError(null);
  }

  async function runSelectedCandidate() {
    if (!selectedCandidate) return;

    setError(null);
    setIsExecuting(true);
    try {
      const response = await executeSql(selectedCandidate, bindValues);
      setResult(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "SQL 실행에 실패했습니다.");
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <h1>SQL Query Chatbot</h1>
        <span className="status">{status}</span>
      </header>

      <div className="workspace">
        <section className="panel chat-panel">
          <div className="messages">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={index}>
                {message.content}
              </div>
            ))}
          </div>
          <form className="composer" onSubmit={onSearch}>
            <textarea
              disabled={isSearching}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 지난달 VIP 고객별 매출 현황을 보고 싶어"
              value={query}
            />
            <button className="primary-button" disabled={isSearching || !query.trim()} type="submit">
              {isSearching ? <Bot size={16} /> : <Send size={16} />}
              {isSearching ? "검색 중" : "질문 보내기"}
            </button>
          </form>
        </section>

        <section className="panel results-panel">
          <div>
            <h2>SQL 후보</h2>
            {error ? <div className="error">{error}</div> : null}
            {!hasCandidates && !error ? (
              <div className="empty">질문을 보내면 검색 점수가 높은 SQL 3개가 표시됩니다.</div>
            ) : (
              <div className="candidate-list">
                {candidates.map((candidate, index) => (
                  <CandidateCard
                    candidate={candidate}
                    key={candidate.id}
                    onSelect={selectCandidate}
                    onSelectOption={selectRecentOption}
                    rank={index + 1}
                    scoreMax={maxCandidateScore}
                    selected={selectedCandidate?.id === candidate.id}
                    selectedOptionId={selectedOptionId}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="execution-area">
            {selectedCandidate ? (
              <ExecutionPanel
                candidate={selectedCandidate}
                isExecuting={isExecuting}
                onSubmit={runSelectedCandidate}
                values={bindValues}
              />
            ) : null}
            <ResultGrid result={result} />
          </div>
        </section>
      </div>
    </main>
  );
}
