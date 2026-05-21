"use client";

import { Loader2, Play } from "lucide-react";
import type { SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  values: Record<string, unknown>;
  isExecuting: boolean;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ExecutionPanel({
  candidate,
  values,
  isExecuting,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const entries = Object.entries(values);

  return (
    <section className="exec-panel">
      <div className="exec-head">
        <div className="exec-title">
          <div className="exec-eyebrow">
            선택된 실행 옵션 · 값을 수정해 실행할 수 있습니다
          </div>
          <div className="exec-id">{candidate.id}</div>
        </div>
        <div className="exec-actions">
          <button
            className="exec-cancel"
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
          >
            취소
          </button>
          <button
            className="exec-run"
            type="button"
            onClick={onSubmit}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <Loader2 size={12} className="spin" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            {isExecuting ? "실행 중…" : "SQL 실행"}
          </button>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="param-grid">
          {entries.map(([key, value]) => (
            <label className="param-cell" key={key}>
              <span className="pk">{key}</span>
              <input
                className="pv-input"
                type="text"
                value={displayValue(value)}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={isExecuting}
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="param-empty">파라미터 없이 실행합니다.</div>
      )}
    </section>
  );
}
