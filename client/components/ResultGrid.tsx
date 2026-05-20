"use client";

import type { ExecuteResponse } from "../lib/types";

type Props = {
  result: ExecuteResponse | null;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ResultGrid({ result }: Props) {
  if (!result) {
    return <div className="empty">실행 결과가 여기에 표시됩니다.</div>;
  }

  if (result.rows.length === 0) {
    return <div className="empty">조회된 데이터가 없습니다.</div>;
  }

  return (
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
              {result.columns.map((column) => (
                <td key={column}>{displayValue(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

