"use client";

import { Play } from "lucide-react";
import type { SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  values: Record<string, unknown>;
  isExecuting: boolean;
  onSubmit: () => void;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ExecutionPanel({ candidate, values, isExecuting, onSubmit }: Props) {
  const entries = Object.entries(values);

  return (
    <section className="form-panel">
      <div>
        <strong>{candidate.title}</strong>
        <div className="param-summary">선택한 실행 옵션</div>
      </div>

      {entries.length > 0 ? (
        <div className="selected-param-list">
          {entries.map(([key, value]) => (
            <div className="selected-param" key={key}>
              <span>{key}</span>
              <strong>{displayValue(value)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="param-summary">선택한 옵션값 없이 실행합니다.</div>
      )}

      <button className="primary-button" disabled={isExecuting} onClick={onSubmit} type="button">
        <Play size={16} />
        {isExecuting ? "실행 중" : "SQL 실행"}
      </button>
    </section>
  );
}
