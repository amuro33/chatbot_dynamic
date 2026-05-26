"use client";

import { useState } from "react";
import { AlignLeft, Braces, Loader2, Play } from "lucide-react";
import type { SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  values: Record<string, unknown>;
  isExecuting: boolean;
  onChange: (key: string, value: string) => void;
  onReplace: (payload: Record<string, unknown>) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

type Mode = "form" | "json";

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
  onReplace,
  onSubmit,
  onCancel,
}: Props) {
  const entries = Object.entries(values);
  const [mode, setMode] = useState<Mode>("form");
  const [draft, setDraft] = useState<string>(() =>
    JSON.stringify(values, null, 2),
  );
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: Mode) {
    if (nextMode === "json") {
      setDraft(JSON.stringify(values, null, 2));
      setError(null);
    }
    setMode(nextMode);
  }

  function handleJsonChange(text: string) {
    setDraft(text);
    try {
      const parsed = JSON.parse(text);
      if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        setError("JSON 객체가 필요합니다");
        return;
      }

      setError(null);
      onReplace(parsed as Record<string, unknown>);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid JSON");
    }
  }

  const jsonInvalid = error !== null;
  const runDisabled = isExecuting || (mode === "json" && jsonInvalid);

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
          <div className="mode-toggle" role="tablist" aria-label="payload editor mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "form"}
              data-active={mode === "form"}
              onClick={() => switchMode("form")}
              disabled={isExecuting}
            >
              <AlignLeft size={11} />
              Form
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "json"}
              data-active={mode === "json"}
              onClick={() => switchMode("json")}
              disabled={isExecuting}
            >
              <Braces size={11} />
              JSON
            </button>
          </div>
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
            disabled={runDisabled}
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

      {mode === "form" ? (
        entries.length > 0 ? (
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
        )
      ) : (
        <>
          <div className="json-editor" data-invalid={jsonInvalid}>
            <textarea
              value={draft}
              onChange={(e) => handleJsonChange(e.target.value)}
              disabled={isExecuting}
              spellCheck={false}
              placeholder={'{\n  "factory_id": "F02"\n}'}
            />
            <span className="json-status" data-ok={!jsonInvalid}>
              <span className="dot" />
              {jsonInvalid ? "Invalid" : "Valid"}
            </span>
          </div>
          {error ? (
            <div className="json-hint err">오류: {error}</div>
          ) : (
            <div className="json-hint">
              key/value를 직접 추가, 수정, 삭제할 수 있습니다.
            </div>
          )}
        </>
      )}
    </section>
  );
}
