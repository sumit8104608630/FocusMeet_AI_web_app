import React from 'react';
import { Outlet } from 'react-router-dom';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #06070d;
    --surface: #0d1021;
    --surface2: #131629;
    --border: rgba(255,255,255,0.07);
    --primary: #4f6ef7;
    --primary-glow: rgba(79,110,247,0.25);
    --accent: #7c3aed;
    --success: #22d3a0;
    --warning: #f59e0b;
    --danger: #ef4444;
    --text: #e8eaf2;
    --muted: #6b7280;
    --heading: 'Figtree', sans-serif;
    --body: 'Nunito', sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--body); }

  /* Glass cards */
  .glass {
    background: rgba(13,16,33,0.6);
    border: 1px solid var(--border);
    backdrop-filter: blur(16px);
    border-radius: 16px;
  }
  .glass-hover {
    background: rgba(13,16,33,0.5);
    border: 1px solid var(--border);
    backdrop-filter: blur(16px);
    border-radius: 16px;
    transition: border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s;
  }
  .glass-hover:hover {
    border-color: rgba(79,110,247,0.35);
    background: rgba(79,110,247,0.06);
    transform: translateY(-3px);
    box-shadow: 0 20px 50px rgba(79,110,247,0.12);
  }

  /* Buttons */
  .glow-btn {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: #fff; border: none; border-radius: 50px;
    padding: 14px 32px; font-family: var(--heading);
    font-weight: 700; font-size: 14px; cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 0 30px var(--primary-glow);
    display: inline-flex; align-items: center; gap: 8px;
  }
  .glow-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--primary-glow); }

  .outline-btn {
    background: transparent; color: var(--text);
    border: 1px solid var(--border); border-radius: 50px;
    padding: 13px 28px; font-family: var(--heading);
    font-weight: 600; font-size: 14px; cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .outline-btn:hover { border-color: var(--primary); background: rgba(79,110,247,0.08); }

  /* Utilities */
  .gradient-text {
    background: linear-gradient(135deg, var(--primary), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .orb {
    position: absolute; border-radius: 50%;
    filter: blur(90px); pointer-events: none;
  }
  .tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--heading); font-weight: 600;
    font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--primary);
  }

  /* Animations */
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes pulse-glow{ 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

  .fade-up    { animation: fadeUp 0.7s ease both; }
  .float      { animation: float 4s ease-in-out infinite; }
  .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }

  /* Score badges */
  .score-badge {
    position: absolute; top: 8px; right: 8px;
    font-size: 10px; font-family: var(--heading); font-weight: 700;
    padding: 2px 7px; border-radius: 20px;
  }
  .score-high { background: rgba(34,211,160,0.15); color: var(--success); }
  .score-mid  { background: rgba(245,158,11,0.15);  color: var(--warning); }
  .score-low  { background: rgba(239,68,68,0.15);   color: var(--danger);  }

  /* Pricing cards */
  .plan-card {
    border-radius: 20px; padding: 28px;
    display: flex; flex-direction: column;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .plan-card:hover { transform: translateY(-4px); }
  .plan-default   { background: var(--surface); border: 1px solid var(--border); }
  .plan-highlight {
    background: linear-gradient(145deg, rgba(79,110,247,0.08), rgba(124,58,237,0.06));
    border: 2px solid rgba(79,110,247,0.4);
    box-shadow: 0 0 60px rgba(79,110,247,0.12);
  }

  /* Control buttons (mock meeting UI) */
  .ctrl-btn {
    width: 40px; height: 40px; border-radius: 12px;
    background: rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--muted); cursor: pointer;
    transition: background 0.2s;
    font-family: var(--heading); font-weight: 700;
  }
  .ctrl-btn:hover { background: rgba(79,110,247,0.25); color: var(--primary); }
  .ctrl-end       { background: rgba(239,68,68,0.8); color: #fff; }
  .ctrl-end:hover { background: rgba(239,68,68,1); }

  section { position: relative; overflow: hidden; }

  @media(max-width:768px){
    .hide-mob { display: none !important; }
    .mob-col  { flex-direction: column !important; }
  }
`;

export default function Layout() {
  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
    {/* pt-16 so page content starts below the fixed header */}
        <main >
          <Outlet />
        </main>
      </div>
    </>
  );
}