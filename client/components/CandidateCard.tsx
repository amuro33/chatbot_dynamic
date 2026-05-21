"use client";

import { PlayCircle } from "lucide-react";
import type { QueryLogOption, SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  rank: number;
  scoreMax: number;
  selected: boolean;
  selectedOptionId?: string | null;
  onSelect: (candidate: SqlCandidate) => void;
  onSelectOption: (candidate: SqlCandidate, option: QueryLogOption) => void;
};

function optionSummary(option: QueryLogOption): string {
  const entries = Object.entries(option.query_param);
  if (entries.length === 0) return "파라미터 없음";

  const summary = entries
    .slice(0, 3)
    .map(([key, value]) => `${key}=${formatOptionValue(value)}`)
    .join(", ");
  return entries.length > 3 ? `${summary} 외 ${entries.length - 3}개` : summary;
}

function formatOptionValue(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (!text) return "";
  return text.length > 24 ? `${text.slice(0, 24)}...` : text;
}

export function CandidateCard({
  candidate,
  rank,
  scoreMax,
  selected,
  selectedOptionId,
  onSelect,
  onSelectOption,
}: Props) {
  const score = typeof candidate.similarity === "number"
    ? candidate.similarity.toLocaleString("ko-KR", { maximumFractionDigits: 2 })
    : "N/A";
  const scoreRatio = typeof candidate.similarity === "number" && scoreMax > 0
    ? Math.max(0, Math.min((candidate.similarity / scoreMax) * 100, 100))
    : 0;

  return (
    <article className="candidate">
      <div className="candidate-header">
        <div>
          <h2>
            <span className="candidate-rank">#{rank}</span>
            {candidate.title}
          </h2>
          <p>{candidate.description}</p>
        </div>
        <div className="score" title="BM25 원점수입니다. 같은 검색 결과 안에서 상대 비교용으로 보세요.">
          <span>검색 점수 {score}</span>
          <div className="score-track" aria-hidden="true">
            <div className="score-fill" style={{ width: `${scoreRatio}%` }} />
          </div>
        </div>
      </div>
      <pre className="sql-preview">{candidate.sql}</pre>
      <div className="recent-options">
        <div className="recent-options-title">최근 실행 옵션</div>
        {candidate.recent_options.length > 0 ? (
          <div className="recent-option-list">
            {candidate.recent_options.map((option) => (
              <button
                className="recent-option"
                data-selected={selected && selectedOptionId === option.id}
                key={option.id}
                onClick={() => onSelectOption(candidate, option)}
                type="button"
              >
                <span>{option.label}</span>
                <small>{optionSummary(option)}</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="param-summary">최근 실행 옵션이 없습니다.</div>
        )}
      </div>
      <div className="candidate-actions">
        <button className="secondary-button" onClick={() => onSelect(candidate)} type="button">
          <PlayCircle size={16} />
          {selected ? "선택됨" : "실행 설정"}
        </button>
      </div>
    </article>
  );
}
