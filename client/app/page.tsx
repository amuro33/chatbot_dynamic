"use client";

import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { executeSql, searchSql } from "../lib/api";
import type {
  ExecuteResponse,
  QueryLogOption,
  SqlCandidate,
} from "../lib/types";
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
  optionId: string;
  values: Record<string, unknown>;
};

type ResultMessage = {
  id: string;
  role: "assistant";
  type: "result";
  candidate: SqlCandidate;
  payload: Record<string, unknown>;
  result: ExecuteResponse;
};

type ChatMessage =
  | TextMessage
  | CandidatesMessage
  | ExecutionMessage
  | ResultMessage;

function messageId(): string {
  return crypto.randomUUID();
}

function withoutPendingExecution(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.type !== "execution");
}

function payloadSummary(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload);
  const head = entries
    .slice(0, 2)
    .map(([k, v]) => `${k}=${String(v ?? "")}`)
    .join(", ");
  return entries.length > 2
    ? `${head} 외 ${entries.length - 2}개`
    : head || "(파라미터 없음)";
}

export default function Home() {
  const [query, setQuery] = useState("웨이퍼 단위 제조 및 측정 데이터");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: messageId(),
      role: "assistant",
      type: "text",
      content:
        "질문을 입력하면 검색 점수가 높은 SQL 후보와 최근 실행 옵션을 찾아드립니다.",
    },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Currently pending execution: which candidate + optionId we picked,
  // and the (possibly edited) payload to run.
  const [pending, setPending] = useState<{
    candidate: SqlCandidate;
    optionId: string;
    payload: Record<string, unknown>;
  } | null>(null);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setPending(null);
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
          content:
            response.answer ||
            `SQL 후보 ${response.candidates.length}개를 찾았습니다.`,
        },
        {
          id: messageId(),
          role: "assistant",
          type: "candidates",
          candidates: response.candidates,
        },
      ]);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "SQL 검색에 실패했습니다.";
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "assistant", type: "text", content: message },
      ]);
    } finally {
      setIsSearching(false);
      setQuery("");
    }
  }

  function selectRecentOption(candidate: SqlCandidate, option: QueryLogOption) {
    const payload = { ...option.query_param };
    setPending({ candidate, optionId: option.id, payload });
    setMessages((current) => [
      ...withoutPendingExecution(current),
      {
        id: messageId(),
        role: "user",
        type: "text",
        content: `${candidate.id} 의 옵션 선택`,
      },
      {
        id: messageId(),
        role: "assistant",
        type: "execution",
        candidate,
        optionId: option.id,
        values: payload,
      },
    ]);
  }

  function updatePending(key: string, value: string) {
    setPending((prev) =>
      prev
        ? { ...prev, payload: { ...prev.payload, [key]: value } }
        : prev,
    );
    setMessages((current) =>
      current.map((m) =>
        m.type === "execution"
          ? { ...m, values: { ...m.values, [key]: value } }
          : m,
      ),
    );
  }

  function replacePending(payload: Record<string, unknown>) {
    setPending((prev) => (prev ? { ...prev, payload } : prev));
    setMessages((current) =>
      current.map((m) =>
        m.type === "execution" ? { ...m, values: payload } : m,
      ),
    );
  }

  function cancelPending() {
    setPending(null);
    setMessages((current) => withoutPendingExecution(current));
  }

  async function runPending() {
    if (!pending) return;
    const { candidate, payload } = pending;

    setIsExecuting(true);
    try {
      const response = await executeSql(candidate, payload);
      setMessages((current) => [
        ...withoutPendingExecution(current),
        {
          id: messageId(),
          role: "user",
          type: "text",
          content: `실행 — ${payloadSummary(payload)}`,
        },
        {
          id: messageId(),
          role: "assistant",
          type: "result",
          candidate,
          payload,
          result: response,
        },
      ]);
      setPending(null);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "SQL 실행에 실패했습니다.";
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
      <section className="chat-panel">
        <div className="messages">
          {messages.map((message) => {
            if (message.type === "text") {
              return (
                <div
                  className={message.role === "user" ? "user-row" : undefined}
                  key={message.id}
                >
                  {message.role === "assistant" ? (
                    <div className="assistant-row">
                      <div className="avatar">AI</div>
                      <div className="message assistant">{message.content}</div>
                    </div>
                  ) : (
                    <div className="message user">{message.content}</div>
                  )}
                </div>
              );
            }

            if (message.type === "candidates") {
              return (
                <div className="assistant-row" key={message.id}>
                  <div className="avatar">AI</div>
                  <div className="rich-body">
                    <div className="candidate-list">
                      {message.candidates.map((candidate, index) => (
                        <CandidateCard
                          key={candidate.id}
                          candidate={candidate}
                          rank={index + 1}
                          selected={pending?.candidate.id === candidate.id}
                          selectedOptionId={pending?.optionId}
                          onSelectOption={selectRecentOption}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (message.type === "execution") {
              return (
                <div className="assistant-row" key={message.id}>
                  <div className="avatar">AI</div>
                  <div className="rich-body">
                    <ExecutionPanel
                      candidate={message.candidate}
                      values={message.values}
                      isExecuting={isExecuting}
                      onChange={updatePending}
                      onReplace={replacePending}
                      onSubmit={runPending}
                      onCancel={cancelPending}
                    />
                  </div>
                </div>
              );
            }

            // result
            return (
              <div className="assistant-row" key={message.id}>
                <div className="avatar">AI</div>
                <div className="rich-body">
                  <ResultGrid
                    candidateId={message.candidate.id}
                    payload={message.payload}
                    result={message.result}
                  />
                </div>
              </div>
            );
          })}

          {isSearching && (
            <div className="assistant-row">
              <div className="avatar">AI</div>
              <div className="typing">
                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="label">
                  자료를 찾는 중이에요. 데이터가 많으면 조금 걸릴 수 있어요
                </span>
              </div>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={onSearch}>
          <div className="composer-row">
            <textarea
              disabled={isSearching}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="질문을 입력하세요 (Enter 전송 · Shift+Enter 줄바꿈)"
              value={query}
            />
            <button
              className="primary-button"
              disabled={isSearching || !query.trim()}
              type="submit"
            >
              {isSearching ? (
                <Loader2 size={16} className="spin-icon" />
              ) : (
                <Send size={16} />
              )}
              {isSearching ? "조회 중…" : "질문 보내기"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
