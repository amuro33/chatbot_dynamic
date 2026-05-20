"use client";

import { PlayCircle } from "lucide-react";
import type { SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  selected: boolean;
  onSelect: (candidate: SqlCandidate) => void;
};

export function CandidateCard({ candidate, selected, onSelect }: Props) {
  const similarity = typeof candidate.similarity === "number"
    ? `${Math.round(candidate.similarity * 100)}%`
    : "N/A";

  return (
    <article className="candidate">
      <div className="candidate-header">
        <div>
          <h2>{candidate.title}</h2>
          <p>{candidate.description}</p>
        </div>
        <span className="similarity">유사도 {similarity}</span>
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

