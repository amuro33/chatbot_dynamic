"use client";

import type { QueryLogOption, SqlCandidate } from "../lib/types";

type Props = {
  candidate: SqlCandidate;
  rank: number;
  maxRecentOptions?: number;
  selected: boolean;
  selectedOptionId?: string | null;
  onSelectOption: (candidate: SqlCandidate, option: QueryLogOption) => void;
};

const DEFAULT_MAX_OPTIONS = 3;

function formatRanAt(ranAt: string): string {
  // "2026-05-20 09:30" → "05-20 09:30"
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
  maxRecentOptions = DEFAULT_MAX_OPTIONS,
  selected,
  selectedOptionId,
  onSelectOption,
}: Props) {
  const visibleOpts = candidate.recent_options.slice(0, maxRecentOptions);
  const hiddenCount = candidate.recent_options.length - visibleOpts.length;
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
              const isSelected =
                selected && selectedOptionId === opt.id;
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
            {hiddenCount > 0 && (
              <div className="option-more">+ {hiddenCount}개 더 보기</div>
            )}
          </div>
        )}
      </div>

      <div className="tables">
        <div className="section-label">연관 테이블</div>
        <div className="table-list">
          {candidate.tables.length === 0 ? (
            <span className="param-empty">없음</span>
          ) : (
            candidate.tables.map((t) => (
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
        <button
          className="run-btn"
          type="button"
          onClick={() => {
            const firstOpt = candidate.recent_options[0];
            if (firstOpt) onSelectOption(candidate, firstOpt);
          }}
          disabled={candidate.recent_options.length === 0}
          title="가장 최근 옵션으로 실행 준비"
        >
          실행
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </article>
  );
}
