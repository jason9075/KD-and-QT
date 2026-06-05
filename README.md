# PARTITION — KD-Tree vs Quadtree

An interactive side-by-side visualizer comparing two classic 2D spatial partitioning structures: **KD-Tree** and **Quadtree**.

**Live demo:** https://github.com/jason9075/KD-and-QT

---

## Features

- Place points by clicking the canvas; drag to move, right-click to delete
- Both trees rebuild instantly on every change
- Sequential split animation — watch each partition line draw one at a time, root to leaves
- Hover anywhere to run a nearest-neighbour (NN) search and see the visited nodes highlighted in real time
- Controls: max points, QT capacity threshold, animation speed, depth color toggle
- Random point generation — uniform or clustered distribution
- Stats panel: tree height, node count, NN visited nodes
- Math & use-case reference modal (English / 中文)

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 18 (no state-management library) |
| Rendering | HTML5 Canvas (imperative, RAF loop) |
| Math typesetting | KaTeX |
| Build | Vite |
| Package manager | npm |
| Dev environment | Nix flake + direnv |
| Task runner | just |

## Getting Started

### Prerequisites

- [Nix](https://nixos.org/) with flakes enabled, or Node.js 20+

### With Nix (recommended)

```sh
nix develop        # enter the dev shell
just dev           # start Vite dev server
```

### Without Nix

```sh
npm install
npm run dev
```

Then open `http://localhost:5173`.

### Build for production

```sh
just build
# or: npm run build
```

Output is in `dist/`.

## Project Structure

```
src/
├── App.jsx                  # root state & layout
├── components/
│   ├── Navbar.jsx
│   ├── Hero.jsx
│   ├── Controls.jsx         # sliders & buttons
│   ├── SplitCanvas.jsx      # canvas rendering & animation loop
│   ├── StatsPanel.jsx
│   └── MathModal.jsx        # KaTeX math + use-case explanations
└── lib/
    ├── kdtree.js            # KD-Tree build & NN search
    └── quadtree.js          # Quadtree build & NN search
```

## License

MIT © 2025 [Jason Kuan](https://github.com/jason9075)
