"use client";

import { PlayCircle } from "lucide-react";
import type { SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  rank: number;
  scoreMax: number;
  selected: boolean;
  onSelect: (candidate: SqlCandidate) => void;
};

export function CandidateCard({ candidate, rank, scoreMax, selected, onSelect }: Props) {
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
      <div className="candidate-header">
        <span className="param-summary">
          바인드 파라미터: {candidate.parameters.length > 0
            ? candidate.parameters.map((parameter) => parameter.name).join(", ")
            : "없음"}
        </span>
        <button className="secondary-button" onClick={() => onSelect(candidate)} type="button">
          <PlayCircle size={16} />
          {selected ? "선택됨" : "실행 설정"}
        </button>
      </div>
    </article>
  );
}
