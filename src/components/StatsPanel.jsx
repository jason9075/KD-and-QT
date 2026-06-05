import React, { useEffect, useRef } from 'react';

const S = {
  panel: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '0', borderBottom: '1px solid var(--color-border)',
  },
  col: (color) => ({
    padding: '0.75rem 1.5rem', borderRight: '1px solid var(--color-border)',
  }),
  header: (color) => ({
    fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.12em',
    fontWeight: 600, color, marginBottom: '0.5rem',
  }),
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' },
  key: { fontSize: '0.72rem', color: 'var(--color-text-muted)' },
  val: { fontSize: '0.72rem', fontFamily: 'var(--font-display)', color: 'var(--color-text)', minWidth: '3ch', textAlign: 'right' },
};

function AnimNum({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    if (!ref.current || prev.current === value) { prev.current = value; return; }
    ref.current.animate(
      [{ transform: 'translateY(-6px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 220, easing: 'ease-out', fill: 'forwards' }
    );
    prev.current = value;
  }, [value]);
  return <span ref={ref} style={S.val}>{value}</span>;
}

function Col({ label, color, stats }) {
  return (
    <div style={S.col(color)}>
      <div style={S.header(color)}>{label}</div>
      {stats.map(([k, v]) => (
        <div key={k} style={S.row}>
          <span style={S.key}>{k}</span>
          <AnimNum value={v} />
        </div>
      ))}
    </div>
  );
}

export function StatsPanel({ kdStats, qtStats }) {
  return (
    <div style={S.panel}>
      <Col label="KD-TREE" color="var(--color-kd)" stats={[
        ['Height',        kdStats.height],
        ['Nodes',         kdStats.nodes],
        ['NN visited',    kdStats.nnVisited ?? '—'],
      ]} />
      <Col label="QUADTREE" color="var(--color-qt)" stats={[
        ['Height',        qtStats.height],
        ['Nodes (total)', qtStats.nodes],
        ['NN visited',    qtStats.nnVisited ?? '—'],
      ]} />
    </div>
  );
}
