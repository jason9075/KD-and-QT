import React, { useRef, useEffect, useCallback } from 'react';
import { buildKDTree, getPartitionLines, nearestNeighbour as kdNN } from '../lib/kdtree.js';
import { buildQuadtree, getDividerLines, getLeafCells, nearestNeighbour as qtNN } from '../lib/quadtree.js';

const POINT_R = 5;
const KD_COLOR = '#1B3A6B';
const QT_COLOR = '#0D4A30';
const POINT_COLOR = '#C84B2F';
const HIGHLIGHT_COLOR = '#F0A500';

/** Alpha for a given depth (deeper = lighter) */
function depthAlpha(depth, showDepth) {
  if (!showDepth) return 0.7;
  return Math.max(0.12, 0.85 - depth * 0.12);
}

/** Interpolate line alpha for animation progress [0,1] */
function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

export function SplitCanvas({ points, showDepth, qtCapacity, animSpeed, onStatsUpdate, onHoverStats }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    animLines: [],   // { line, progress, speed }
    animCells: [],   // { cell, progress, speed }
    raf: null,
    hoverPos: null,
    kdTree: null,
    qtTree: null,
    mouseDown: null,
    dragging: null,
  });

  // Expose dispatch to parent for add/delete/drag
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
  }, []);

  // Main draw + rebuild on points/settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width / devicePixelRatio;
    const H = canvas.height / devicePixelRatio;
    const half = W / 2;

    ctx.scale(devicePixelRatio, devicePixelRatio);

    const kdBounds = { x: 0, y: 0, w: half, h: H };
    const qtBounds = { x: half, y: 0, w: half, h: H };

    // Map points to each side
    const toKD = points.map(p => ({ ...p, x: p.nx * half, y: p.ny * H }));
    const toQT = points.map(p => ({ ...p, x: half + p.nx * half, y: p.ny * H }));

    const t0 = performance.now();
    const kdTree = buildKDTree(toKD);
    const kdMs = (performance.now() - t0).toFixed(2);

    const t1 = performance.now();
    const qtTree = buildQuadtree(toQT, qtBounds, qtCapacity);
    const qtMs = (performance.now() - t1).toFixed(2);

    stateRef.current.kdTree = kdTree;
    stateRef.current.qtTree = qtTree;
    stateRef.current.kdBounds = kdBounds;
    stateRef.current.qtBounds = qtBounds;
    stateRef.current.toKD = toKD;
    stateRef.current.toQT = toQT;
    stateRef.current.W = W;
    stateRef.current.H = H;

    // Trigger new line animations
    const kdLines = getPartitionLines(kdTree, kdBounds);
    const qtLines = getDividerLines(qtTree);
    const spd = animSpeed;
    stateRef.current.animLines = kdLines.map(l => ({ l, p: 0, spd }));
    stateRef.current.animCells = qtLines.map(l => ({ l, p: 0, spd }));

    if (onStatsUpdate) {
      const { treeHeight: kdH, nodeCount: kdN } = await_import_counts('kd', kdTree);
      const { treeHeight: qtH, nodeCount: qtN } = await_import_counts('qt', qtTree);
      onStatsUpdate({ kdMs, qtMs, kdH, kdN, qtH, qtN });
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [points, showDepth, qtCapacity, animSpeed]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function frame() {
      const ctx = canvas.getContext('2d');
      const dpr = devicePixelRatio;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      const half = W / 2;
      const s = stateRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#F8F7F4';
      ctx.fillRect(0, 0, W, H);

      // Center divider
      ctx.strokeStyle = '#D0CFC8';
      ctx.lineWidth = 1;
      drawLine(ctx, half, 0, half, H);

      // Labels — blink while animation is in progress
      const now = Date.now();
      const kdAnimating = s.animLines.length > 0 && s.animLines.some(item => item.p < 1);
      const qtAnimating = s.animCells.length > 0 && s.animCells.some(item => item.p < 1);
      const blinkAlpha = 0.3 + 0.7 * Math.abs(Math.sin(now / 300));

      ctx.font = '600 11px "IBM Plex Mono", monospace';
      ctx.letterSpacing = '0.1em';
      ctx.fillStyle = kdAnimating ? `rgba(27,58,107,${blinkAlpha})` : KD_COLOR;
      ctx.fillText('KD-TREE', 12, 22);
      ctx.fillStyle = qtAnimating ? `rgba(13,74,48,${blinkAlpha})` : QT_COLOR;
      ctx.fillText('QUADTREE', half + 12, 22);

      // Draw KD partition lines — sequential: each line starts only after previous finishes
      for (let i = 0; i < s.animLines.length; i++) {
        const item = s.animLines[i];
        if (i === 0 || s.animLines[i - 1].p >= 1) {
          item.p = Math.min(1, item.p + 0.04 * item.spd);
        }
        if (item.p <= 0) continue;
        const { l, p } = item;
        const alpha = depthAlpha(l.depth, showDepth);
        ctx.strokeStyle = `rgba(27,58,107,${alpha})`;
        ctx.lineWidth = l.depth === 0 ? 1.5 : 1;
        const mx = l.x1 + (l.x2 - l.x1) * p;
        const my = l.y1 + (l.y2 - l.y1) * p;
        ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(mx, my); ctx.stroke();
      }

      // Draw QT divider lines — sequential: each line starts only after previous finishes
      for (let i = 0; i < s.animCells.length; i++) {
        const item = s.animCells[i];
        if (i === 0 || s.animCells[i - 1].p >= 1) {
          item.p = Math.min(1, item.p + 0.05 * item.spd);
        }
        if (item.p <= 0) continue;
        const { l, p } = item;
        const alpha = depthAlpha(l.depth, showDepth);
        ctx.strokeStyle = `rgba(13,74,48,${alpha})`;
        ctx.lineWidth = l.depth === 0 ? 1.5 : 1;
        const cx = (l.x1 + l.x2) / 2;
        const cy = (l.y1 + l.y2) / 2;
        const ex1 = cx + (l.x1 - cx) * p;
        const ey1 = cy + (l.y1 - cy) * p;
        const ex2 = cx + (l.x2 - cx) * p;
        const ey2 = cy + (l.y2 - cy) * p;
        ctx.beginPath(); ctx.moveTo(ex1, ey1); ctx.lineTo(ex2, ey2); ctx.stroke();
      }

      // Hover NN highlight
      const hover = s.hoverPos;
      if (hover && s.kdTree) {
        const side = hover.x < half ? 'kd' : 'qt';
        if (side === 'kd') {
          const res = kdNN(s.kdTree, hover);
          for (const p of res.visited) {
            ctx.beginPath(); ctx.arc(p.x, p.y, POINT_R + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(240,165,0,0.3)'; ctx.fill();
          }
          if (res.nearest) {
            ctx.beginPath(); ctx.arc(res.nearest.x, res.nearest.y, POINT_R + 4, 0, Math.PI * 2);
            ctx.strokeStyle = HIGHLIGHT_COLOR; ctx.lineWidth = 2; ctx.stroke();
          }
        } else if (s.qtTree) {
          const res = qtNN(s.qtTree, hover);
          for (const cell of res.visited) {
            ctx.fillStyle = 'rgba(240,165,0,0.08)';
            ctx.fillRect(cell.bounds.x, cell.bounds.y, cell.bounds.w, cell.bounds.h);
          }
          if (res.nearest) {
            ctx.beginPath(); ctx.arc(res.nearest.x, res.nearest.y, POINT_R + 4, 0, Math.PI * 2);
            ctx.strokeStyle = HIGHLIGHT_COLOR; ctx.lineWidth = 2; ctx.stroke();
          }
        }
      }

      // Draw points (both sides)
      const allPts = [...(s.toKD || []), ...(s.toQT || [])];
      for (const pt of allPts) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, POINT_R, 0, Math.PI * 2);
        ctx.fillStyle = POINT_COLOR; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }

      stateRef.current.raf = requestAnimationFrame(frame);
    }

    stateRef.current.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(stateRef.current.raf);
  }, [showDepth]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        stateRef.current.hoverPos = { x: e.clientX - r.left, y: e.clientY - r.top };
      }}
      onMouseLeave={() => { stateRef.current.hoverPos = null; }}
    />
  );
}

// Inline import to avoid circular dep
function await_import_counts(type, tree) {
  if (type === 'kd') {
    let h = 0, n = 0;
    function walk(node) {
      if (!node) return;
      n++;
      h = Math.max(h, node.depth + 1);
      walk(node.left); walk(node.right);
    }
    walk(tree);
    return { treeHeight: h, nodeCount: n };
  } else {
    let h = 0, n = 0;
    function walk(node) {
      if (!node) return;
      n++;
      h = Math.max(h, node.depth + 1);
      if (node.children) node.children.forEach(walk);
    }
    walk(tree);
    return { treeHeight: h, nodeCount: n };
  }
}
