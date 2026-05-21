"use client";

import { FormEvent, useState } from "react";
import { Bot, Send } from "lucide-react";
import { executeSql, searchSql } from "../lib/api";
import type { ExecuteResponse, QueryLogOption, SqlCandidate } from "../lib/types";
import { CandidateCard } from "../components/CandidateCard";
import { ExecutionPanel } from "../components/ExecutionPanel";
import { ResultGrid } from "../components/ResultGrid";

type TextMessage = {
  id: string;
  role: "user" | "assistant";
  type: "text";
  content: string;
};

type CandidatesMessage = {
  id: string;
  role: "assistant";
  type: "candidates";
  candidates: SqlCandidate[];
};

type ExecutionMessage = {
  id: string;
  role: "assistant";
  type: "execution";
  candidate: SqlCandidate;
  values: Record<string, unknown>;
};

type ResultMessage = {
  id: string;
  role: "assistant";
  type: "result";
  title: string;
  result: ExecuteResponse;
};

type ChatMessage = TextMessage | CandidatesMessage | ExecutionMessage | ResultMessage;

function messageId(): string {
  return crypto.randomUUID();
}
function candidateMaxScore(candidates: SqlCandidate[]): number {
  return Math.max(
    0,
    ...candidates.map((candidate) =>
      typeof candidate.similarity === "number" ? candidate.similarity : 0,
    ),
  );
}

function withoutPendingExecution(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((message) => message.type !== "execution");
}

export default function Home() {
  const [query, setQuery] = useState("웨이퍼 단위 제조 및 측정 데이터");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: messageId(),
      role: "assistant",
      type: "text",
      content: "질문을 입력하면 검색 점수가 높은 SQL 후보와 최근 실행 옵션을 찾아드립니다.",
    },
  ]);
  const [selectedCandidate, setSelectedCandidate] = useState<SqlCandidate | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [queryParam, setQueryParam] = useState<Record<string, unknown>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSelectedCandidate(null);
    setSelectedOptionId(null);
    setQueryParam({});
    setMessages((current) => [
      ...withoutPendingExecution(current),
      { id: messageId(), role: "user", type: "text", content: trimmed },
    ]);

    try {
      const response = await searchSql(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          type: "text",
          content: response.answer || `SQL 후보 ${response.candidates.length}개를 찾았습니다.`,
        },
        {
          id: messageId(),
          role: "assistant",
          type: "candidates",
          candidates: response.candidates,
        },
      ]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "SQL 검색에 실패했습니다.";
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", type: "text", content: message },
      ]);
    } finally {
      setIsSearching(false);
      setQuery("");
    }
  }

  function selectCandidate(candidate: SqlCandidate) {
    setSelectedCandidate(candidate);
    setSelectedOptionId(null);
    setQueryParam({});
    setMessages((current) => [
      ...withoutPendingExecution(current),
      {
        id: messageId(),
        role: "assistant",
        type: "execution",
        candidate,
        values: {},
      },
    ]);
  }

  function selectRecentOption(candidate: SqlCandidate, option: QueryLogOption) {
    setSelectedCandidate(candidate);
    setSelectedOptionId(option.id);
    setQueryParam(option.query_param);
    setMessages((current) => [
      ...withoutPendingExecution(current),
      {
        id: messageId(),
        role: "assistant",
        type: "execution",
        candidate,
        values: option.query_param,
      },
    ]);
  }

  async function runSelectedCandidate() {
    if (!selectedCandidate) return;

    setIsExecuting(true);
    try {
      const response = await executeSql(selectedCandidate, queryParam);
      setMessages((current) => [
        ...withoutPendingExecution(current),
        {
          id: messageId(),
          role: "assistant",
          type: "result",
          title: `${selectedCandidate.title} 실행 결과`,
          result: response,
        },
      ]);
      setSelectedCandidate(null);
      setSelectedOptionId(null);
      setQueryParam({});
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "SQL 실행에 실패했습니다.";
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", type: "text", content: message },
      ]);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <main className="shell">
      <section className="panel chat-panel">
        <div className="messages">
          {messages.map((message) => {
            if (message.type === "text") {
              return (
                <div className={`message ${message.role}`} key={message.id}>
                  {message.content}
                </div>
              );
            }

            if (message.type === "candidates") {
              const maxScore = candidateMaxScore(message.candidates);
              return (
                <div className="message assistant rich-message" key={message.id}>
                  <div className="candidate-list">
                    {message.candidates.map((candidate, index) => (
                      <CandidateCard
                        candidate={candidate}
                        key={candidate.id}
                        onSelect={selectCandidate}
                        onSelectOption={selectRecentOption}
                        rank={index + 1}
                        scoreMax={maxScore}
                        selected={selectedCandidate?.id === candidate.id}
                        selectedOptionId={selectedOptionId}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            if (message.type === "execution") {
              return (
                <div className="message assistant rich-message" key={message.id}>
                  <ExecutionPanel
                    candidate={message.candidate}
                    isExecuting={isExecuting}
                    onSubmit={runSelectedCandidate}
                    values={message.values}
                  />
                </div>
              );
            }

            return (
              <div className="message assistant rich-message" key={message.id}>
                <div className="result-message-title">{message.title}</div>
                <ResultGrid result={message.result} />
              </div>
            );
          })}
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
    </main>
  );
}
