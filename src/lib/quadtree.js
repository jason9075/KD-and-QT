/**
 * 2D Quadtree implementation.
 * Subdivides when a cell contains more than `capacity` points.
 */

/** @typedef {{ id: string, x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, w: number, h: number }} Rect */
/** @typedef {{ bounds: Rect, points: Point[], children: QTNode[]|null, depth: number }} QTNode */

/**
 * @param {Point[]} points
 * @param {Rect} bounds
 * @param {number} capacity
 * @param {number} depth
 * @returns {QTNode}
 */
export function buildQuadtree(points, bounds, capacity = 4, depth = 0) {
  const inside = points.filter(p => inRect(p, bounds));
  const node = { bounds, points: inside, children: null, depth };

  if (inside.length > capacity && depth < 12) {
    node.children = subdivide(bounds).map(sub =>
      buildQuadtree(inside, sub, capacity, depth + 1)
    );
  }
  return node;
}

/** @param {Rect} r @returns {Rect[]} */
function subdivide(r) {
  const hw = r.w / 2;
  const hh = r.h / 2;
  return [
    { x: r.x,      y: r.y,      w: hw, h: hh },
    { x: r.x + hw, y: r.y,      w: hw, h: hh },
    { x: r.x,      y: r.y + hh, w: hw, h: hh },
    { x: r.x + hw, y: r.y + hh, w: hw, h: hh },
  ];
}

function inRect(p, r) {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

/**
 * Collect all leaf cells for rendering.
 * @param {QTNode} node
 * @returns {QTNode[]}
 */
export function getLeafCells(node) {
  if (!node.children) return [node];
  return node.children.flatMap(getLeafCells);
}

/**
 * Collect all internal divider lines (unique, deduplicated).
 * Each: { x1, y1, x2, y2, depth }
 * @param {QTNode} node
 * @returns {Array<{x1:number,y1:number,x2:number,y2:number,depth:number}>}
 */
export function getDividerLines(node) {
  const lines = [];
  _collectDividers(node, lines);
  return lines;
}

function _collectDividers(node, lines) {
  if (!node.children) return;
  const { x, y, w, h } = node.bounds;
  const mx = x + w / 2;
  const my = y + h / 2;
  lines.push(
    { x1: mx, y1: y,      x2: mx, y2: y + h,  depth: node.depth },
    { x1: x,  y1: my,     x2: x + w, y2: my,  depth: node.depth },
  );
  node.children.forEach(c => _collectDividers(c, lines));
}

/**
 * Nearest-neighbour search within quadtree.
 * Returns { nearest: Point|null, visited: QTNode[] }
 * @param {QTNode} root
 * @param {{ x: number, y: number }} query
 * @returns {{ nearest: Point|null, visited: QTNode[] }}
 */
export function nearestNeighbour(root, query) {
  const visited = [];
  let best = { point: null, dist: Infinity };
  _qtNN(root, query, best, visited);
  return { nearest: best.point, visited };
}

function _qtNN(node, query, best, visited) {
  if (!rectDist2(node.bounds, query) > best.dist) return;
  visited.push(node);

  if (!node.children) {
    for (const p of node.points) {
      const d = dist2(p, query);
      if (d < best.dist) { best.dist = d; best.point = p; }
    }
    return;
  }

  const sorted = [...node.children].sort((a, b) =>
    rectDist2(a.bounds, query) - rectDist2(b.bounds, query)
  );
  for (const child of sorted) {
    if (rectDist2(child.bounds, query) > best.dist) break;
    _qtNN(child, query, best, visited);
  }
}

function dist2(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function rectDist2(r, p) {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return dx * dx + dy * dy;
}

/** @param {QTNode} node @returns {number} */
export function treeHeight(node) {
  if (!node.children) return 1;
  return 1 + Math.max(...node.children.map(treeHeight));
}

/** @param {QTNode} node @returns {number} */
export function nodeCount(node) {
  if (!node.children) return 1;
  return 1 + node.children.reduce((s, c) => s + nodeCount(c), 0);
}
