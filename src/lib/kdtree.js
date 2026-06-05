/**
 * 2D KD-Tree implementation.
 * Points are {id, x, y} objects. Tree nodes carry partition metadata for rendering.
 */

/** @typedef {{ id: string, x: number, y: number }} Point */
/** @typedef {{ point: Point, left: KDNode|null, right: KDNode|null, axis: number, depth: number }} KDNode */

/**
 * @param {Point[]} points
 * @param {number} depth
 * @returns {KDNode|null}
 */
export function buildKDTree(points, depth = 0) {
  if (points.length === 0) return null;
  const axis = depth % 2; // 0 = x, 1 = y
  const sorted = [...points].sort((a, b) => (axis === 0 ? a.x - b.x : a.y - b.y));
  const mid = Math.floor(sorted.length / 2);
  return {
    point: sorted[mid],
    axis,
    depth,
    left: buildKDTree(sorted.slice(0, mid), depth + 1),
    right: buildKDTree(sorted.slice(mid + 1), depth + 1),
  };
}

/**
 * Returns partition lines for rendering.
 * Each line: { x1, y1, x2, y2, depth, axis }
 * bounds: { x, y, w, h } — canvas bounding box
 * @param {KDNode|null} node
 * @param {{ x: number, y: number, w: number, h: number }} bounds
 * @returns {Array<{x1:number,y1:number,x2:number,y2:number,depth:number,axis:number}>}
 */
export function getPartitionLines(node, bounds) {
  if (!node) return [];
  const lines = [];
  _collectLines(node, bounds, lines);
  return lines;
}

function _collectLines(node, bounds, lines) {
  if (!node) return;
  const { point, axis, depth, left, right } = node;
  const { x, y, w, h } = bounds;

  if (axis === 0) {
    // vertical line at point.x
    lines.push({ x1: point.x, y1: y, x2: point.x, y2: y + h, depth, axis });
    _collectLines(left,  { x, y, w: point.x - x, h }, lines);
    _collectLines(right, { x: point.x, y, w: x + w - point.x, h }, lines);
  } else {
    // horizontal line at point.y
    lines.push({ x1: x, y1: point.y, x2: x + w, y2: point.y, depth, axis });
    _collectLines(left,  { x, y, w, h: point.y - y }, lines);
    _collectLines(right, { x, y: point.y, w, h: y + h - point.y }, lines);
  }
}

/**
 * Nearest-neighbour search. Returns { nearest: Point|null, visited: Point[] }.
 * @param {KDNode|null} root
 * @param {{ x: number, y: number }} query
 * @returns {{ nearest: Point|null, visited: Point[] }}
 */
export function nearestNeighbour(root, query) {
  const visited = [];
  let best = { point: null, dist: Infinity };
  _nnSearch(root, query, best, visited);
  return { nearest: best.point, visited };
}

function _nnSearch(node, query, best, visited) {
  if (!node) return;
  visited.push(node.point);
  const d = dist2(node.point, query);
  if (d < best.dist) { best.dist = d; best.point = node.point; }

  const axis = node.axis;
  const diff = axis === 0 ? query.x - node.point.x : query.y - node.point.y;
  const [near, far] = diff < 0 ? [node.left, node.right] : [node.right, node.left];

  _nnSearch(near, query, best, visited);
  if (diff * diff < best.dist) _nnSearch(far, query, best, visited);
}

function dist2(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** @param {KDNode|null} node @returns {number} */
export function treeHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

/** @param {KDNode|null} node @returns {number} */
export function nodeCount(node) {
  if (!node) return 0;
  return 1 + nodeCount(node.left) + nodeCount(node.right);
}
