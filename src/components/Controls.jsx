import React from 'react';

const S = {
  bar: {
    display: 'flex', flexWrap: 'wrap', gap: '1.25rem',
    justifyContent: 'center', alignItems: 'center',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
  },
  group: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  label: { fontSize: '0.72rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', userSelect: 'none' },
  range: { accentColor: 'var(--color-text)', width: '100px' },
  toggle: (active) => ({
    fontFamily: 'var(--font-body)', fontSize: '0.72rem',
    padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
    border: '1px solid var(--color-border)',
    background: active ? 'var(--color-text)' : 'transparent',
    color: active ? 'var(--color-bg)' : 'var(--color-text)',
    transition: 'background 0.15s, color 0.15s',
  }),
  btn: {
    fontFamily: 'var(--font-body)', fontSize: '0.72rem',
    padding: '0.3rem 0.8rem', borderRadius: '999px', cursor: 'pointer',
    border: '1px solid var(--color-border)',
    background: 'transparent', color: 'var(--color-text)',
  },
};

export function Controls({ state, dispatch }) {
  const { maxPoints, qtCapacity, showDepth, animSpeed } = state;
  return (
    <div style={S.bar}>
      <div style={S.group}>
        <label style={S.label}>MAX POINTS</label>
        <input type="range" min={10} max={200} step={5} value={maxPoints} style={S.range}
          onChange={e => dispatch({ type: 'SET_MAX_POINTS', value: +e.target.value })} />
        <span style={S.label}>{maxPoints}</span>
      </div>

      <div style={S.group}>
        <label style={S.label}>QT THRESHOLD</label>
        <input type="range" min={1} max={8} step={1} value={qtCapacity} style={S.range}
          onChange={e => dispatch({ type: 'SET_QT_CAPACITY', value: +e.target.value })} />
        <span style={S.label}>{qtCapacity}</span>
      </div>

      <div style={S.group}>
        <label style={S.label}>ANIM SPEED</label>
        <input type="range" min={0.5} max={3} step={0.25} value={animSpeed} style={S.range}
          onChange={e => dispatch({ type: 'SET_ANIM_SPEED', value: +e.target.value })} />
      </div>

      <div style={S.group}>
        <button style={S.toggle(showDepth)}
          onClick={() => dispatch({ type: 'TOGGLE_DEPTH' })}>
          Depth Colors
        </button>
      </div>

      <div style={S.group}>
        <button style={S.btn}
          onClick={() => dispatch({ type: 'RANDOM_POINTS', count: maxPoints, mode: 'uniform' })}>
          Random (Uniform)
        </button>
        <button style={S.btn}
          onClick={() => dispatch({ type: 'RANDOM_POINTS', count: maxPoints, mode: 'cluster' })}>
          Random (Cluster)
        </button>
        <button style={{ ...S.btn, color: 'var(--color-point)', borderColor: 'var(--color-point)' }}
          onClick={() => dispatch({ type: 'CLEAR' })}>
          Clear
        </button>
      </div>
    </div>
  );
}
