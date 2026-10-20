import React from 'react';

/**
 * Base skeleton placeholder with shimmering gradient animation.
 */
export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)', className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton loader for KPI / Stat Cards (e.g., Dashboard & Analytics).
 */
export function SkeletonKPI({ count = 4, columns = 'kpi-grid-4' }) {
  return (
    <div className={`stats-grid ${columns}`} aria-busy="true" aria-label="Loading statistics...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card skeleton-card">
          <div className="stat-header">
            <Skeleton width="38px" height="38px" borderRadius="var(--radius-md)" />
            <Skeleton width="70px" height="14px" />
          </div>
          <Skeleton width="45%" height="28px" style={{ margin: '12px 0 8px 0' }} />
          <Skeleton width="65%" height="12px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for Task Cards (e.g., TaskList, Dashboard, PersonalTodos).
 */
export function SkeletonTaskCard({ count = 3 }) {
  return (
    <div className="skeleton-task-list" aria-busy="true" aria-label="Loading tasks...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="task-card skeleton-card">
          <Skeleton width="22px" height="22px" borderRadius="var(--radius-sm)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="task-card-content" style={{ width: '100%' }}>
            <Skeleton width="55%" height="18px" style={{ marginBottom: 8 }} />
            <Skeleton width="85%" height="13px" style={{ marginBottom: 6 }} />
            <Skeleton width="70%" height="13px" style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Skeleton width="60px" height="20px" borderRadius="var(--radius-full)" />
              <Skeleton width="80px" height="20px" borderRadius="var(--radius-full)" />
              <Skeleton width="90px" height="20px" borderRadius="var(--radius-full)" />
            </div>
          </div>
          <div className="task-card-actions">
            <Skeleton width="90px" height="28px" borderRadius="var(--radius-sm)" />
            <Skeleton width="80px" height="28px" borderRadius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for Charts (e.g., Analytics Dashboard).
 */
export function SkeletonChart({ height = 280 }) {
  return (
    <div className="chart-card skeleton-card" aria-busy="true" aria-label="Loading chart...">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width="180px" height="20px" />
        <Skeleton width="60px" height="18px" borderRadius="var(--radius-full)" />
      </div>
      <Skeleton width="240px" height="12px" style={{ marginBottom: 20 }} />
      <Skeleton width="100%" height={`${height}px`} borderRadius="var(--radius-md)" />
    </div>
  );
}

/**
 * Skeleton loader for Data Tables (e.g., Work Submissions, Team Overview).
 */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }} aria-busy="true" aria-label="Loading table...">
      <div className="table-responsive-container">
        <table className="analytics-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}>
                  <Skeleton width="75%" height="14px" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c}>
                    <Skeleton width={c === 0 ? '60%' : c === cols - 1 ? '85px' : '75%'} height="16px" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for User Cards (Team Members & Admin Settings).
 */
export function SkeletonUserCard({ count = 3 }) {
  return (
    <div className="user-grid" aria-busy="true" aria-label="Loading team members...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="user-card skeleton-card">
          <Skeleton width="48px" height="48px" borderRadius="var(--radius-full)" style={{ flexShrink: 0 }} />
          <div className="user-details" style={{ width: '100%' }}>
            <Skeleton width="60%" height="16px" style={{ marginBottom: 6 }} />
            <Skeleton width="80%" height="13px" />
          </div>
          <Skeleton width="60px" height="22px" borderRadius="var(--radius-full)" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
