"use client";

import { Play } from "lucide-react";
import type { BindParameter, SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  values: Record<string, unknown>;
  isExecuting: boolean;
  onChange: (name: string, value: unknown) => void;
  onSubmit: () => void;
};

function inputType(parameter: BindParameter): string {
  if (parameter.type === "number") return "number";
  if (parameter.type === "date") return "date";
  if (parameter.type === "datetime") return "datetime-local";
  return "text";
}

export function BindParameterForm({ candidate, values, isExecuting, onChange, onSubmit }: Props) {
  return (
    <section className="form-panel">
      <div>
        <strong>{candidate.title}</strong>
        <div className="param-summary">
          실행 파라미터 {candidate.parameters.length}개
        </div>
      </div>

      {candidate.parameters.length > 0 ? (
        <div className="form-grid">
          {candidate.parameters.map((parameter) => (
            <label className="field" key={parameter.name}>
              <span>
                {parameter.label || parameter.name}
                {parameter.required ? " *" : ""}
              </span>
              {parameter.type === "select" ? (
                <select
                  required={parameter.required}
                  value={String(values[parameter.name] ?? "")}
                  onChange={(event) => onChange(parameter.name, event.target.value)}
                >
                  <option value="">선택</option>
                  {(parameter.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : parameter.type === "boolean" ? (
                <select
                  required={parameter.required}
                  value={String(values[parameter.name] ?? "")}
                  onChange={(event) => onChange(parameter.name, event.target.value === "true")}
                >
                  <option value="">선택</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  required={parameter.required}
                  type={inputType(parameter)}
                  value={String(values[parameter.name] ?? "")}
                  onChange={(event) => {
                    const value = parameter.type === "number"
                      ? Number(event.target.value)
                      : event.target.value;
                    onChange(parameter.name, value);
                  }}
                />
              )}
              {parameter.description ? <small>{parameter.description}</small> : null}
            </label>
          ))}
        </div>
      ) : (
        <div className="param-summary">필요한 바인드 파라미터가 없습니다.</div>
      )}

      <button className="primary-button" disabled={isExecuting} onClick={onSubmit} type="button">
        <Play size={16} />
        {isExecuting ? "실행 중" : "SQL 실행"}
      </button>
    </section>
  );
}

