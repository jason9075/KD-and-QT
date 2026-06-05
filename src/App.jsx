import React, { useReducer, useState, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { Hero } from './components/Hero.jsx';
import { SplitCanvas } from './components/SplitCanvas.jsx';
import { Controls } from './components/Controls.jsx';
import { StatsPanel } from './components/StatsPanel.jsx';
import { MathModal } from './components/MathModal.jsx';

/** Points stored as normalized coords {id, nx, ny} to be resolution-independent */
function makeId() { return Math.random().toString(36).slice(2); }

const initialState = {
  points: [],
  maxPoints: 50,
  qtCapacity: 4,
  showDepth: true,
  animSpeed: 1.5,
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_POINT': {
      if (state.points.length >= state.maxPoints) return state;
      return { ...state, points: [...state.points, { id: makeId(), nx: action.nx, ny: action.ny }] };
    }
    case 'DELETE_POINT':
      return { ...state, points: state.points.filter(p => p.id !== action.id) };
    case 'MOVE_POINT':
      return {
        ...state,
        points: state.points.map(p => p.id === action.id ? { ...p, nx: action.nx, ny: action.ny } : p),
      };
    case 'CLEAR':
      return { ...state, points: [] };
    case 'RANDOM_POINTS': {
      const count = Math.min(action.count, state.maxPoints);
      const pts = [];
      if (action.mode === 'cluster') {
        const centers = Array.from({ length: 3 }, () => ({ cx: Math.random(), cy: Math.random() }));
        for (let i = 0; i < count; i++) {
          const c = centers[i % centers.length];
          pts.push({ id: makeId(), nx: clamp(c.cx + randn() * 0.1), ny: clamp(c.cy + randn() * 0.1) });
        }
      } else {
        for (let i = 0; i < count; i++) pts.push({ id: makeId(), nx: Math.random(), ny: Math.random() });
      }
      return { ...state, points: pts };
    }
    case 'SET_MAX_POINTS':    return { ...state, maxPoints: action.value };
    case 'SET_QT_CAPACITY':   return { ...state, qtCapacity: action.value };
    case 'TOGGLE_DEPTH':      return { ...state, showDepth: !state.showDepth };
    case 'SET_ANIM_SPEED':    return { ...state, animSpeed: action.value };
    default: return state;
  }
}

function clamp(v) { return Math.max(0.01, Math.min(0.99, v)); }
function randn() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

const defaultStats = { height: 0, nodes: 0, nnVisited: null, buildMs: '—' };

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [kdStats, setKdStats] = useState(defaultStats);
  const [qtStats, setQtStats] = useState(defaultStats);
  const [showMath, setShowMath] = useState(false);
  const canvasContainerRef = useRef(null);

  const handleStatsUpdate = useCallback(({ kdMs, qtMs, kdH, kdN, qtH, qtN }) => {
    setKdStats(s => ({ ...s, height: kdH, nodes: kdN, buildMs: kdMs }));
    setQtStats(s => ({ ...s, height: qtH, nodes: qtN, buildMs: qtMs }));
  }, []);

  const handleCanvasClick = useCallback((e) => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = r.width;
    const H = r.height;
    const half = W / 2;
    // Click coordinates — use the half that was clicked to get nx
    const rawX = e.clientX - r.left;
    const rawY = e.clientY - r.top;
    // Normalize: if clicking left half, nx = rawX/half; right half: nx = (rawX-half)/half
    const nx = rawX < half ? rawX / half : (rawX - half) / half;
    const ny = rawY / H;
    dispatch({ type: 'ADD_POINT', nx: clamp(nx), ny: clamp(ny) });
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Hero />

      <Controls state={state} dispatch={dispatch} />

      {/* Canvas area */}
      <div
        ref={canvasContainerRef}
        onClick={handleCanvasClick}
        style={{
          flex: '1 0 420px', position: 'relative',
          borderBottom: '1px solid var(--color-border)',
          minHeight: '420px',
        }}
      >
        <SplitCanvas
          points={state.points}
          showDepth={state.showDepth}
          qtCapacity={state.qtCapacity}
          animSpeed={state.animSpeed}
          onStatsUpdate={handleStatsUpdate}
        />
        {/* 💡 Math button */}
        <button
          onClick={e => { e.stopPropagation(); setShowMath(true); }}
          aria-label="Explain the math"
          style={{
            position: 'absolute', bottom: '1rem', right: '1rem',
            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
            border: '1px solid var(--color-border)', background: 'var(--color-bg)',
            fontSize: '1.25rem', cursor: 'pointer', display: 'grid', placeItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >💡</button>
      </div>

      <StatsPanel kdStats={kdStats} qtStats={qtStats} />

      {showMath && <MathModal onClose={() => setShowMath(false)} />}
    </div>
  );
}
