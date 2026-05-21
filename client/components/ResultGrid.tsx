"use client";

import { Copy, Download } from "lucide-react";
import type { ExecuteResponse } from "../lib/types";

type Props = {
  candidateId: string;
  payload: Record<string, unknown>;
  result: ExecuteResponse | null;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function isNumberLike(value: unknown): boolean {
  return typeof value === "number";
}

export function ResultGrid({ candidateId, payload, result }: Props) {
  if (!result) {
    return <div className="empty">실행 결과가 여기에 표시됩니다.</div>;
  }

  const payloadEntries = Object.entries(payload);
  const rowCount = result.rows.length;
  const colCount = result.columns.length;

  return (
    <section className="result-block">
      <div className="result-head">
        <div className="result-title">
          <span className="pulse" />
          <span style={{ fontFamily: "var(--font-mono-stack)" }}>
            {candidateId}
          </span>
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>
            실행 결과
          </span>
        </div>
        <div className="head-payload">
          {payloadEntries.map(([k, v]) => (
            <span className="payload-chip" key={k} title={`${k} = ${v ?? ""}`}>
              <span className="pk">{k}</span>
              <span className="eq">=</span>
              <span className="pv">
                {v === null || v === undefined || v === "" ? "—" : String(v)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="result-meta-row">
        <div className="result-meta">
          <strong>{rowCount}</strong>
          {" rows · "}
          <strong>{colCount}</strong>
          {" cols"}
          {typeof result.elapsed_ms === "number" && (
            <>
              {" · "}
              <strong>{result.elapsed_ms}ms</strong>
            </>
          )}
          {result.ran_at && (
            <>
              {" · "}
              <span>{result.ran_at}</span>
            </>
          )}
        </div>
        <div className="result-actions">
          <button className="result-action" type="button">
            <Download size={12} />
            CSV
          </button>
          <button className="result-action" type="button">
            <Copy size={12} />
            복사
          </button>
        </div>
      </div>

      {rowCount === 0 ? (
        <div className="empty">조회된 데이터가 없습니다.</div>
      ) : (
        <div className="grid-wrap">
          <table className="data-grid">
            <thead>
              <tr>
                {result.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr key={index}>
                  {result.columns.map((column) => {
                    const v = row[column];
                    return (
                      <td key={column} className={isNumberLike(v) ? "num" : ""}>
                        {displayValue(v)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
