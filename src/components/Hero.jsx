import React from 'react';

const styles = {
  hero: {
    height: '30vh', display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '0 1.5rem',
    position: 'relative',
    background: `
      linear-gradient(var(--color-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--color-border) 1px, transparent 1px)
    `,
    backgroundSize: '32px 32px',
    backgroundColor: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
    fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--color-text)',
    marginBottom: '0.5rem',
  },
  sub: {
    fontFamily: 'var(--font-body)', fontSize: '0.9rem',
    color: 'var(--color-text-muted)', maxWidth: '560px',
  },
};

export function Hero({ onShowMath }) {
  return (
    <section style={styles.hero}>
      <h1 style={styles.title}>Two ways to cut space.</h1>
      <p style={styles.sub}>
        KD-Tree partitions recursively along alternating axes.
        Quadtree subdivides cells into four equal quadrants.
        Click the canvas to place points and watch both structures rebuild in real time.
      </p>
      <button
        onClick={onShowMath}
        aria-label="Explain the math"
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          border: '1px solid var(--color-border)', background: 'var(--color-bg)',
          fontSize: '1.25rem', cursor: 'pointer', display: 'grid', placeItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >💡</button>
    </section>
  );
}
