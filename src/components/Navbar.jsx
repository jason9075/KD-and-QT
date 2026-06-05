import React from 'react';

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    height: 'var(--navbar-h)', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 1.5rem',
    background: 'var(--color-bg)',
    borderBottom: '1px solid var(--color-border)',
  },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600,
    letterSpacing: '0.35em', color: 'var(--color-text)',
  },
  tags: { display: 'flex', gap: '0.5rem' },
  tag: (bg, color) => ({
    fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 500,
    letterSpacing: '0.08em', padding: '0.2rem 0.65rem',
    borderRadius: '3px', background: bg, color,
  }),
};

export function Navbar() {
  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>PARTITION</span>
      <div style={styles.tags}>
        <span style={styles.tag('var(--color-kd)', '#fff')}>KD-Tree</span>
        <span style={styles.tag('var(--color-qt)', '#fff')}>Quadtree</span>
      </div>
    </nav>
  );
}
