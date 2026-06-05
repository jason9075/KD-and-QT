import React, { useEffect, useRef, useState } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

const EN = `
<p>Both structures partition 2D space to answer range and nearest-neighbour queries efficiently.</p>
<h3>KD-Tree</h3>
<p>Alternates split axis (x, then y, then x…). At depth $d$, the median point along axis $d\\bmod 2$ becomes the pivot.</p>
<p>Nearest-neighbour search prunes a subtree when the closest possible point in that region is farther than the current best:</p>
<p>$$\\text{prune if}\\quad \\delta_{\\text{axis}}^2 \\geq d^2_{\\text{best}}$$</p>
<p>Expected build time: $O(n \\log n)$. Expected query time: $O(\\sqrt{n})$ for well-distributed data.</p>
<h3>When to use KD-Tree</h3>
<ul>
<li><strong>k-NN classification</strong> — finding the k closest training samples to a query point (scikit-learn uses it internally).</li>
<li><strong>Point cloud processing</strong> — LiDAR / 3D scan data where you need fast radius or nearest-point lookups.</li>
<li><strong>Ray tracing &amp; computer graphics</strong> — accelerating intersection tests against a static set of geometry.</li>
<li><strong>Robotics / motion planning</strong> — RRT (Rapidly-exploring Random Tree) queries the nearest visited node millions of times per second.</li>
</ul>
<h3>Quadtree</h3>
<p>Subdivides a cell into four equal quadrants whenever the point count exceeds capacity $c$:</p>
<p>$$\\text{split if}\\quad |\\text{points in cell}| > c$$</p>
<p>Each level halves cell side length. Max depth is bounded by $\\log_2(W / \\epsilon)$ where $W$ is the canvas width and $\\epsilon$ is the minimum point separation.</p>
<h3>When to use Quadtree</h3>
<ul>
<li><strong>Game collision detection</strong> — only test pairs of objects whose cells overlap, skipping distant objects entirely.</li>
<li><strong>Geographic information systems (GIS)</strong> — spatial indexing of map features (roads, buildings) for viewport queries.</li>
<li><strong>Image compression</strong> — recursively split regions until each quadrant is uniform enough (JPEG-style quad decomposition).</li>
<li><strong>LOD rendering</strong> — terrain engines use quadtrees to decide which tiles to render at high vs. low resolution based on camera distance.</li>
</ul>
<h3>Comparison</h3>
<p>KD-Tree guarantees balanced depth for uniform data; Quadtree adapts to spatial density but can degenerate with clustered inputs. Prefer KD-Tree when your data is a static point set and queries dominate; prefer Quadtree when objects move frequently or you need fast bulk region tests.</p>
`;

const ZH = `
<p>兩種結構都透過切分二維空間，來加速範圍查詢與最近鄰搜尋。</p>
<h3>KD-Tree</h3>
<p>每層交替切割軸（x 軸、y 軸交替）。在深度 $d$，沿 $d\\bmod 2$ 軸的中位數點作為分割基準。</p>
<p>最近鄰搜尋會剪枝：若某子樹最近可能距離已超過目前最佳距離，直接略過：</p>
<p>$$\\text{剪枝條件}\\quad \\delta_{\\text{axis}}^2 \\geq d^2_{\\text{best}}$$</p>
<p>建構時間：$O(n \\log n)$；均勻分布下查詢期望時間：$O(\\sqrt{n})$。</p>
<h3>KD-Tree 的使用場合</h3>
<ul>
<li><strong>k-NN 分類</strong> — 找出最近的 k 個訓練樣本（scikit-learn 內部即使用 KD-Tree）。</li>
<li><strong>點雲處理</strong> — LiDAR／3D 掃描資料中快速查詢最近點或半徑範圍內的點。</li>
<li><strong>光線追蹤</strong> — 對靜態幾何加速射線相交測試。</li>
<li><strong>機器人路徑規劃</strong> — RRT 演算法每秒需查詢數百萬次最近已訪節點，KD-Tree 是標準選擇。</li>
</ul>
<h3>Quadtree</h3>
<p>當格子內點數超過容量 $c$，即四分裂：</p>
<p>$$\\text{分裂條件}\\quad |\\text{格子內點數}| > c$$</p>
<p>每層格子邊長減半，最大深度受 $\\log_2(W / \\epsilon)$ 限制。</p>
<h3>Quadtree 的使用場合</h3>
<ul>
<li><strong>遊戲碰撞偵測</strong> — 只測試同一格或相鄰格的物件，跳過遠距離物件。</li>
<li><strong>地理資訊系統（GIS）</strong> — 對地圖要素（道路、建築）建立空間索引，加速視窗查詢。</li>
<li><strong>影像壓縮</strong> — 遞迴切分區塊直到每個象限色彩均勻（Quadtree 壓縮法）。</li>
<li><strong>地形 LOD 渲染</strong> — 依相機距離決定各區塊的渲染細節等級。</li>
</ul>
<h3>比較</h3>
<p>KD-Tree 對均勻分布保證平衡深度；Quadtree 適應空間密度，但叢集輸入可能退化。資料靜態且查詢頻繁時選 KD-Tree；物件頻繁移動或需要大量區域測試時選 Quadtree。</p>
`;

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(26,26,24,0.6)',
  display: 'grid', placeItems: 'center', zIndex: 200,
};
const panel = {
  width: 'min(680px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 4rem)',
  overflow: 'auto', background: 'var(--color-bg)',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  padding: '1.5rem', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
};

export function MathModal({ onClose }) {
  const [lang, setLang] = useState('en');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.innerHTML = lang === 'en' ? EN : ZH;
    renderMathInElement(bodyRef.current, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }, [lang]);

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={panel} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--color-text)' }}>
            MATH BEHIND THE SCENE
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setLang(l => l === 'en' ? 'zh' : 'en')}
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
              Eng/中
            </button>
            <button onClick={onClose}
              style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '999px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
        <div ref={bodyRef} style={{ lineHeight: 1.8, color: 'var(--color-text)' }} />
      </div>
    </div>
  );
}
