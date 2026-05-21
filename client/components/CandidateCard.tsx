"use client";

import type { QueryLogOption, SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  rank: number;
  selected: boolean;
  selectedOptionId?: string | null;
  onSelectOption: (candidate: SqlCandidate, option: QueryLogOption) => void;
};

const MAX_RECENT_OPTIONS = 3;

function formatRanAt(ranAt: string): string {
  if (!ranAt) return "";
  return ranAt.length > 5 ? ranAt.slice(5) : ranAt;
}

function summaryEntries(option: QueryLogOption): {
  visible: [string, string][];
  rest: number;
} {
  const entries = Object.entries(option.query_param).map<[string, string]>(
    ([k, v]) => [k, String(v ?? "")],
  );
  const visible = entries.slice(0, 3);
  return { visible, rest: entries.length - visible.length };
}

export function CandidateCard({
  candidate,
  rank,
  selected,
  selectedOptionId,
  onSelectOption,
}: Props) {
  const visibleOpts = candidate.recent_options.slice(0, MAX_RECENT_OPTIONS);
  const tables = candidate.tables ?? [];
  const initials = candidate.author?.name?.slice(0, 1) ?? "?";

  const score =
    typeof candidate.similarity === "number"
      ? candidate.similarity.toFixed(2)
      : null;

  return (
    <article className="sqlcard" data-id={candidate.id}>
      <div className="sqlcard-head">
        <div className="sqlcard-id-wrap">
          <div className="sqlcard-rank">
            #{rank} · {candidate.workspace || "workspace"}
          </div>
          <div className="sqlcard-id">{candidate.id}</div>
        </div>
        {score && (
          <div className="sqlcard-score" title="BM25 기반 유사도 점수">
            <span className="score-label">유사도</span>
            <span className="score-val">{score}</span>
          </div>
        )}
      </div>

      <p className="sqlcard-desc">{candidate.description}</p>

      <div className="recent-options">
        <div className="section-label">최근 실행 옵션</div>
        {visibleOpts.length === 0 ? (
          <div className="param-empty">실행 이력 없음</div>
        ) : (
          <div className="option-list">
            {visibleOpts.map((opt) => {
              const { visible, rest } = summaryEntries(opt);
              const isSelected = selected && selectedOptionId === opt.id;
              return (
                <div
                  key={opt.id}
                  className="option-row"
                  data-selected={isSelected}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectOption(candidate, opt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectOption(candidate, opt);
                    }
                  }}
                >
                  <span className="option-selector" aria-hidden="true" />
                  <div className="row-main">
                    <div className="row-summary">
                      {visible.map(([k, v], i) => (
                        <span key={k}>
                          {i > 0 && (
                            <span style={{ color: "var(--muted)" }}>{" · "}</span>
                          )}
                          <span className="key">{k}</span>
                          <span className="eq">=</span>
                          <span>{v}</span>
                        </span>
                      ))}
                      {rest > 0 && (
                        <span style={{ color: "var(--muted)" }}>
                          {" … 외 "}
                          {rest}
                          {"개"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="row-more">{formatRanAt(opt.ran_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="tables">
        <div className="section-label">관련 테이블</div>
        <div className="table-list">
          {tables.length === 0 ? (
            <span className="param-empty">없음</span>
          ) : (
            tables.map((t) => (
              <span key={t} className="table-tag">
                {t}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="sqlcard-foot">
        <div className="author">
          <div className="author-avatar">{initials}</div>
          <div className="author-name">
            {candidate.author?.name}
            {candidate.author?.team && (
              <>
                {" · "}
                <span style={{ color: "var(--muted)" }}>
                  {candidate.author.team}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
