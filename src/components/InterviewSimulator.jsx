import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// ─────────────────────────────────────────────
// TOPIC LIBRARY
// ─────────────────────────────────────────────
const CATEGORY_META = {
  Frontend:              { color: '#38bdf8', glyph: '◈' },
  Backend:               { color: '#34d399', glyph: '⬡' },
  Database:              { color: '#fb923c', glyph: '◆' },
  Infrastructure:        { color: '#60a5fa', glyph: '⬢' },
  Architecture:          { color: '#a78bfa', glyph: '◉' },
  'CS Fundamentals':     { color: '#f472b6', glyph: '◎' },
  Aptitude:              { color: '#fbbf24', glyph: '◐' },
  'Enterprise / Legacy': { color: '#94a3b8', glyph: '◇' },
};

const TOPIC_CATEGORIES = {
  Frontend: [
    { id: 'React',       label: 'React',         icon: '⚛️', tags: ['Hooks', 'Reconciliation', 'Performance'] },
    { id: 'TypeScript',  label: 'TypeScript',     icon: '🔷', tags: ['Generics', 'Utility Types', 'Decorators'] },
    { id: 'HTML/CSS/JS', label: 'HTML · CSS · JS',icon: '🌐', tags: ['Web APIs', 'CSS Arch', 'ES2024'] },
    { id: 'Vue.js',      label: 'Vue.js',          icon: '💚', tags: ['Composition API', 'Reactivity', 'Pinia'] },
  ],
  Backend: [
    { id: 'Java',        label: 'Java',        icon: '☕', tags: ['JVM', 'Concurrency', 'Streams'] },
    { id: 'Node.js',     label: 'Node.js',     icon: '🟢', tags: ['Event Loop', 'Streams', 'Workers'] },
    { id: 'Python',      label: 'Python',      icon: '🐍', tags: ['Asyncio', 'GIL', 'Decorators'] },
    { id: 'Spring Boot', label: 'Spring Boot', icon: '🍃', tags: ['DI', 'AOP', 'Security'] },
    { id: 'Go',          label: 'Go',          icon: '🔵', tags: ['Goroutines', 'Channels', 'Interfaces'] },
  ],
  Database: [
    { id: 'SQL & PostgreSQL', label: 'SQL / PostgreSQL', icon: '🗄️', tags: ['Indexing', 'ACID', 'Query Plans'] },
    { id: 'MongoDB',          label: 'MongoDB',           icon: '🍀', tags: ['Aggregation', 'Sharding'] },
    { id: 'Redis',            label: 'Redis',             icon: '🔴', tags: ['Data Structures', 'Pub/Sub'] },
  ],
  Infrastructure: [
    { id: 'Docker & Kubernetes', label: 'Docker & K8s',   icon: '🐳', tags: ['Helm', 'RBAC', 'Operators'] },
    { id: 'AWS & Cloud',         label: 'AWS / Cloud',     icon: '☁️', tags: ['VPC', 'Lambda', 'IAM'] },
    { id: 'CI/CD & DevOps',      label: 'CI/CD & DevOps', icon: '🚀', tags: ['GitHub Actions', 'ArgoCD'] },
  ],
  Architecture: [
    { id: 'System Design',  label: 'System Design',  icon: '🏗️', tags: ['CAP', 'Scale', 'Trade-offs'] },
    { id: 'Microservices',  label: 'Microservices',  icon: '🔧', tags: ['Saga', 'gRPC', 'CQRS'] },
    { id: 'GraphQL',        label: 'GraphQL',         icon: '⬡', tags: ['Schema', 'DataLoader', 'Federation'] },
  ],
  'CS Fundamentals': [
    { id: 'Data Structures & Algorithms', label: 'DSA',              icon: '📊', tags: ['Complexity', 'DP', 'Graphs'] },
    { id: 'DBMS Theory',                  label: 'DBMS Theory',      icon: '📚', tags: ['Normalization', 'Transactions'] },
    { id: 'Operating Systems',            label: 'Operating Systems', icon: '💻', tags: ['Scheduling', 'Memory'] },
    { id: 'Computer Networks',            label: 'Computer Networks', icon: '🌍', tags: ['TCP/IP', 'HTTP/3', 'TLS'] },
  ],
  Aptitude: [
    { id: 'Logical Reasoning',      label: 'Logical Reasoning', icon: '🧠', tags: ['Syllogisms', 'Sequences', 'Puzzles'] },
    { id: 'Quantitative Aptitude',  label: 'Quantitative',      icon: '🔢', tags: ['Arithmetic', 'Algebra', 'Probability'] },
    { id: 'Verbal Ability',         label: 'Verbal Ability',    icon: '📝', tags: ['Comprehension', 'Grammar', 'Vocabulary'] },
    { id: 'Data Interpretation',    label: 'Data Interpretation',icon: '📈', tags: ['Charts', 'Tables', 'Inference'] },
    { id: 'Puzzles & Brain Teasers',label: 'Puzzles',            icon: '🧩', tags: ['Lateral Thinking', 'Logic', 'Math'] },
  ],
  'Enterprise / Legacy': [
    { id: 'Liferay DXP', label: 'Liferay DXP', icon: '🌀', tags: ['OSGi', 'Portlets', 'Workflow'] },
  ],
};

const Q_TYPES = [
  { id: 'short', label: 'Short Answer',    icon: '✍️', desc: 'Open-ended — explain your thinking in depth' },
  { id: 'mcq',   label: 'Multiple Choice', icon: '🔘', desc: 'Pick from 4 options — tests precision & speed' },
];

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────
const buildPromptShort = (topicId, experience, numQ) => `
You are a world-class senior technical interviewer at a FAANG-tier company.
CANDIDATE: ${topicId} engineer, ${experience} YOE, ${numQ} questions total.
ADAPTIVE DIFFICULTY: Start intermediate-to-advanced for ${experience} YOE.
- Score >= 8 → escalate. Score <= 4 → step down slightly (never trivial).
- Prefer "why", trade-offs, real-world scenarios.

FORMAT AFTER EVERY RESPONSE:
[SCORE: X/10]
Strong: <what was correct>
Improve: <correction or "Excellent — nothing to add.">
Then immediately ask the next question.

FINAL EVALUATION after question #${numQ}:
[FINAL RESULTS]
Total: X / ${numQ * 10}
Grade: [S/A/B/C/D]
Verdict: [Strong Hire / Hire / Borderline / No Hire]
Strengths:
- <point>
- <point>
Areas to Focus:
- <point>
- <point>
Next Steps: <advice>

TONE: Direct, professional, no filler praise.
`;

const buildPromptMCQ = (topicId, experience, numQ) => `
You are a technical interviewer doing an MCQ interview.
CANDIDATE: ${topicId} engineer, ${experience} YOE, ${numQ} questions total.

QUESTION FORMAT — every question MUST follow this exact format:
Question: <question text>

A) <option>
B) <option>
C) <option>
D) <option>

AFTER CANDIDATE ANSWERS (they type A/B/C/D):
1. Say correct/incorrect, state the right answer, explain in 2-3 sentences.
2. [SCORE: X/10] — correct=10, wrong=0.
3. Ask the next question immediately.

DIFFICULTY: Intermediate for ${experience} YOE. Correct→harder, Wrong→slightly easier.

FINAL EVALUATION after question #${numQ}:
[FINAL RESULTS]
Total: X / ${numQ * 10}
Grade: [S/A/B/C/D]
Verdict: [Strong Hire / Hire / Borderline / No Hire]
Strengths:
- <point>
- <point>
Areas to Focus:
- <point>
- <point>
Next Steps: <advice>

TONE: Clear and direct.
`;

// ─────────────────────────────────────────────
// PARSERS
// ─────────────────────────────────────────────
const parseScore = t => { const m = t.match(/\[SCORE:\s*(\d+)\/10\]/i); return m ? +m[1] : null; };
const isFinal   = t => t.includes('[FINAL RESULTS]');
const fmtTime   = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function parseMCQOptions(text) {
  const labels = ['A','B','C','D'];
  const opts = labels.map(l => {
    const m = text.match(new RegExp(`^${l}[).]\\s+(.+)$`, 'm'));
    return m ? { label: l, text: m[1].trim() } : null;
  }).filter(Boolean);
  return opts.length === 4 ? opts : [];
}

function parseFinalResults(text) {
  const verdict  = (text.match(/Verdict:\s*(.+)/)?.[1] ?? '').trim();
  const strengths = [...text.matchAll(/^- (.+)/gm)].map(m => m[1]).filter((_, i, arr) => {
    // take lines after "Strengths:" and before "Areas"
    const si = text.indexOf('Strengths:');
    const ai = text.indexOf('Areas to Focus:');
    const pos = text.indexOf(`- ${arr[i]}`);
    return pos > si && (ai === -1 || pos < ai);
  });
  const areas = [...text.matchAll(/^- (.+)/gm)].map(m => m[1]).filter((_, i, arr) => {
    const ai = text.indexOf('Areas to Focus:');
    const ni = text.indexOf('Next Steps:');
    const pos = text.indexOf(`- ${arr[i]}`);
    return ai !== -1 && pos > ai && (ni === -1 || pos < ni);
  });
  const nextSteps = (text.match(/Next Steps:\s*(.+)/)?.[1] ?? '').trim();
  return { verdict, strengths, areas, nextSteps };
}

function getGrade(pct) {
  if (pct >= 90) return { label: 'S', color: '#a78bfa', desc: 'Outstanding' };
  if (pct >= 75) return { label: 'A', color: '#34d399', desc: 'Excellent' };
  if (pct >= 60) return { label: 'B', color: '#60a5fa', desc: 'Good' };
  if (pct >= 45) return { label: 'C', color: '#fbbf24', desc: 'Average' };
  return { label: 'D', color: '#f87171', desc: 'Needs Work' };
}

// ─────────────────────────────────────────────
// SCORECARD GENERATOR (opens printable tab)
// ─────────────────────────────────────────────
function downloadScorecard({ userName, topic, qType, experience, numQ, scores, date, finalText }) {
  const total  = scores.reduce((a,b)=>a+b,0);
  const pct    = scores.length > 0 ? Math.round((total / (scores.length * 10)) * 100) : 0;
  const grade  = getGrade(pct);
  const parsed = parseFinalResults(finalText);
  const accent = CATEGORY_META[Object.keys(TOPIC_CATEGORIES).find(cat => TOPIC_CATEGORIES[cat].some(t=>t.id===topic?.id))]?.color ?? '#8b5cf6';

  const barHTML = scores.map((s,i) => {
    const col = s>=8?'#34d399':s>=5?'#fbbf24':'#f87171';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <span style="font-size:10px;color:#888;font-family:monospace">${s}</span>
      <div style="width:20px;height:${Math.max(6,s*4)}px;background:${col};border-radius:4px 4px 2px 2px"></div>
      <span style="font-size:10px;color:#555">Q${i+1}</span>
    </div>`;
  }).join('');

  const strengthsHTML = parsed.strengths.slice(0,3).map(s=>`<li>${s}</li>`).join('');
  const areasHTML     = parsed.areas.slice(0,3).map(a=>`<li>${a}</li>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>InterviewAI Scorecard — ${userName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#0a0a14; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px 20px; font-family:'Inter',sans-serif; }
  .card { width:680px; background:linear-gradient(160deg,#12102a 0%,#0e0c1e 60%,#100e20 100%); border:1px solid rgba(139,92,246,0.25); border-radius:24px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset; }
  .top-bar { height:5px; background:linear-gradient(90deg,${accent},#7c3aed,#4f46e5,${accent}); }
  .header { padding:36px 40px 28px; background:linear-gradient(180deg,rgba(139,92,246,0.1) 0%,transparent 100%); border-bottom:1px solid rgba(139,92,246,0.12); position:relative; overflow:hidden; }
  .header::before { content:''; position:absolute; top:-60px; right:-60px; width:200px; height:200px; background:radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%); }
  .logo-row { display:flex; align-items:center; gap:10px; margin-bottom:24px; }
  .logo { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#7c3aed,#4f46e5); display:flex; align-items:center; justify-content:center; }
  .logo svg { width:18px; height:18px; }
  .brand { font-size:1rem; font-weight:900; background:linear-gradient(90deg,#f0f0ff,#c4b5fd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-0.02em; }
  .brand-sub { font-size:0.65rem; color:#4a4a6a; margin-top:1px; }
  .sc-label { font-size:0.68rem; color:#6b6b8a; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; }
  .user-name { font-size:2.4rem; font-weight:900; letter-spacing:-0.04em; background:linear-gradient(135deg,#ffffff 0%,#e0d7ff 50%,#a78bfa 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1.1; margin-bottom:16px; }
  .meta-row { display:flex; gap:8px; flex-wrap:wrap; }
  .chip { padding:4px 12px; border-radius:99px; font-size:0.72rem; font-weight:700; }
  .body { padding:32px 40px; display:flex; flex-direction:column; gap:28px; }
  .grade-row { display:flex; align-items:center; gap:28px; }
  .grade-box { width:100px; height:100px; border-radius:20px; border:2px solid ${grade.color}40; background:${grade.color}12; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 0 30px ${grade.color}20; }
  .grade-letter { font-size:3.2rem; font-weight:900; color:${grade.color}; line-height:1; }
  .grade-desc { font-size:0.7rem; color:${grade.color}; font-weight:700; opacity:0.8; margin-top:2px; }
  .score-info { flex:1; }
  .score-big { font-size:2.6rem; font-weight:900; color:#f0f0ff; letter-spacing:-0.03em; line-height:1; }
  .score-big span { color:#4a4a7a; font-size:1.8rem; }
  .score-pct { font-size:0.85rem; color:#6b6b9a; margin-top:4px; font-weight:600; }
  .verdict-badge { display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:6px 14px; border-radius:8px; font-size:0.78rem; font-weight:800; background:${grade.color}14; border:1px solid ${grade.color}30; color:${grade.color}; }
  .section-title { font-size:0.72rem; color:#4a4a6a; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .section-title::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(139,92,246,0.2),transparent); }
  .bars { display:flex; gap:6px; align-items:flex-end; height:80px; padding:8px 0; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .list-box { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:16px; }
  .list-box ul { list-style:none; display:flex; flex-direction:column; gap:8px; }
  .list-box ul li { font-size:0.8rem; color:#9090b0; line-height:1.5; display:flex; gap:8px; }
  .list-box ul li::before { content:'▸'; color:${accent}; flex-shrink:0; }
  .next-box { background:rgba(139,92,246,0.06); border:1px solid rgba(139,92,246,0.15); border-radius:12px; padding:16px; font-size:0.82rem; color:#9090c0; line-height:1.65; }
  .footer { padding:20px 40px; border-top:1px solid rgba(139,92,246,0.1); display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.2); }
  .footer-left { font-size:0.7rem; color:#3a3a5a; }
  .footer-right { font-size:0.7rem; color:#3a3a5a; font-family:'JetBrains Mono',monospace; }
  @media print { body { background:#fff; } .card { box-shadow:none; border-color:#ddd; } }
</style>
</head>
<body>
<div class="card">
  <div class="top-bar"></div>
  <div class="header">
    <div class="logo-row">
      <div class="logo">
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="18" stroke="white" stroke-width="3.5" stroke-opacity="0.9"/>
          <circle cx="32" cy="32" r="10" stroke="white" stroke-width="2.5" stroke-opacity="0.7"/>
          <circle cx="32" cy="32" r="4" fill="white" fill-opacity="0.95"/>
          <line x1="32" y1="10" x2="32" y2="19" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="32" y1="45" x2="32" y2="54" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="10" y1="32" x2="19" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="45" y1="32" x2="54" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <div class="brand">InterviewAI</div>
        <div class="brand-sub">Adaptive Technical Interviews · Gemini 2.5 Flash</div>
      </div>
    </div>
    <div class="sc-label">Interview Scorecard</div>
    <div class="user-name">${userName}</div>
    <div class="meta-row">
      <span class="chip" style="background:${accent}18;border:1px solid ${accent}35;color:${accent}">${topic?.icon} ${topic?.label}</span>
      <span class="chip" style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);color:#fbbf24">${qType==='mcq'?'🔘 MCQ':'✍️ Short Answer'}</span>
      <span class="chip" style="background:rgba(96,165,250,0.12);border:1px solid rgba(96,165,250,0.25);color:#60a5fa">${experience} YOE</span>
      <span class="chip" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#6b6b9a">${numQ} Questions</span>
    </div>
  </div>

  <div class="body">
    <!-- Grade + Score -->
    <div class="grade-row">
      <div class="grade-box">
        <div class="grade-letter">${grade.label}</div>
        <div class="grade-desc">${grade.desc}</div>
      </div>
      <div class="score-info">
        <div class="score-big">${total}<span>/${numQ*10}</span></div>
        <div class="score-pct">${pct}% correct · ${scores.length} questions answered</div>
        ${parsed.verdict ? `<div class="verdict-badge">⚡ ${parsed.verdict}</div>` : ''}
      </div>
    </div>

    <!-- Per-question bars -->
    <div>
      <div class="section-title">Question Breakdown</div>
      <div class="bars">${barHTML}</div>
    </div>

    <!-- Strengths + Areas -->
    ${(strengthsHTML || areasHTML) ? `
    <div class="two-col">
      ${strengthsHTML ? `<div>
        <div class="section-title">Strengths</div>
        <div class="list-box"><ul>${strengthsHTML}</ul></div>
      </div>` : ''}
      ${areasHTML ? `<div>
        <div class="section-title">Areas to Focus</div>
        <div class="list-box"><ul>${areasHTML}</ul></div>
      </div>` : ''}
    </div>` : ''}

    <!-- Next Steps -->
    ${parsed.nextSteps ? `
    <div>
      <div class="section-title">Next Steps</div>
      <div class="next-box">${parsed.nextSteps}</div>
    </div>` : ''}
  </div>

  <div class="footer">
    <div class="footer-left">Generated by InterviewAI · ${date}</div>
    <div class="footer-right">${total}/${numQ*10} · Grade ${grade.label}</div>
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

// ─────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────
function renderInline(text) {
  const parts = []; let rem = String(text), k = 0;
  while (rem.length > 0) {
    const bi = rem.indexOf('**'), ci = rem.indexOf('`');
    let pick = null;
    if (bi !== -1 && (ci === -1 || bi <= ci)) pick = 'bold';
    else if (ci !== -1) pick = 'code';
    if (!pick) { parts.push(<span key={k++}>{rem}</span>); break; }
    if (pick === 'bold') {
      const end = rem.indexOf('**', bi + 2); if (end === -1) { parts.push(<span key={k++}>{rem}</span>); break; }
      if (bi > 0) parts.push(<span key={k++}>{rem.slice(0, bi)}</span>);
      parts.push(<strong key={k++} style={{ fontWeight:700, color:'#f0f0ff' }}>{rem.slice(bi+2, end)}</strong>);
      rem = rem.slice(end + 2);
    } else {
      const end = rem.indexOf('`', ci + 1); if (end === -1) { parts.push(<span key={k++}>{rem}</span>); break; }
      if (ci > 0) parts.push(<span key={k++}>{rem.slice(0, ci)}</span>);
      parts.push(<code key={k++} style={{ background:'rgba(139,92,246,0.18)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'5px', padding:'1px 7px', fontSize:'0.85em', fontFamily:"'JetBrains Mono',monospace", color:'#c4b5fd' }}>{rem.slice(ci+1, end)}</code>);
      rem = rem.slice(end + 1);
    }
  }
  return parts;
}

function MD({ text }) {
  const lines = text.split('\n'); const els = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const cb = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) { cb.push(lines[i]); i++; }
      els.push(<pre key={`cb${i}`} style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'10px', padding:'14px 16px', overflowX:'auto', margin:'10px 0', fontSize:'0.83rem', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.7, color:'#e2e8f0' }}><code>{cb.join('\n')}</code></pre>);
      i++; continue;
    }
    if (/^[-=]{3,}$/.test(l.trim())) { els.push(<div key={`hr${i}`} style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.4),transparent)', margin:'12px 0' }} />); i++; continue; }
    if (l.startsWith('### ')) { els.push(<h3 key={i} style={{ margin:'10px 0 4px', fontSize:'0.95rem', fontWeight:700, color:'#e0e0f0' }}>{renderInline(l.slice(4))}</h3>); i++; continue; }
    if (l.startsWith('## '))  { els.push(<h2 key={i} style={{ margin:'10px 0 4px', fontSize:'1.05rem', fontWeight:700, color:'#eeeeff' }}>{renderInline(l.slice(3))}</h2>); i++; continue; }
    if (l.startsWith('# '))   { els.push(<h1 key={i} style={{ margin:'10px 0 4px', fontSize:'1.15rem', fontWeight:800, color:'#f8fafc' }}>{renderInline(l.slice(2))}</h1>); i++; continue; }
    const bm = l.match(/^([•\-\*]) (.+)/);
    if (bm) { els.push(<div key={i} style={{ display:'flex', gap:'8px', margin:'4px 0' }}><span style={{ color:'#8b5cf6', flexShrink:0 }}>▸</span><span>{renderInline(bm[2])}</span></div>); i++; continue; }
    const nm = l.match(/^(\d+)\. (.+)/);
    if (nm) { els.push(<div key={i} style={{ display:'flex', gap:'8px', margin:'4px 0' }}><span style={{ color:'#8b5cf6', flexShrink:0, fontWeight:700 }}>{nm[1]}.</span><span>{renderInline(nm[2])}</span></div>); i++; continue; }
    if (/^[A-D][).]\s+/.test(l)) { i++; continue; }
    if (l.trim() === '') { if (i > 0 && lines[i-1].trim() !== '') els.push(<div key={i} style={{ height:'6px' }} />); i++; continue; }
    els.push(<p key={i} style={{ margin:'3px 0', lineHeight:1.78 }}>{renderInline(l)}</p>);
    i++;
  }
  return <div style={{ fontSize:'0.93rem' }}>{els}</div>;
}

// ─────────────────────────────────────────────
// MCQ OPTION BUTTONS
// ─────────────────────────────────────────────
function MCQOptions({ options, onPick, disabled }) {
  const colors = ['#38bdf8','#34d399','#fb923c','#a78bfa'];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'14px' }}>
      {options.map((opt,i) => (
        <button key={opt.label} disabled={disabled} onClick={()=>onPick(opt.label)}
          style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'12px', textAlign:'left', width:'100%', color:'#c0c0d8', fontSize:'0.9rem', lineHeight:1.5, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, transition:'all 0.15s' }}
          onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.background=`${colors[i]}12`; e.currentTarget.style.borderColor=`${colors[i]}50`; e.currentTarget.style.transform='translateX(3px)'; }}}
          onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; e.currentTarget.style.transform='translateX(0)'; }}
        >
          <span style={{ width:'26px', height:'26px', borderRadius:'8px', background:`${colors[i]}18`, border:`1px solid ${colors[i]}40`, color:colors[i], fontWeight:800, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{opt.label}</span>
          <span style={{ paddingTop:'2px' }}>{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// INLINE SCORECARD (shown in app after done)
// ─────────────────────────────────────────────
function InlineScorecard({ userName, topic, qType, experience, numQ, scores, finalText, accent, onDownload, onNew, onLinkedIn, copied }) {
  const total   = scores.reduce((a,b)=>a+b,0);
  const pct     = scores.length > 0 ? Math.round((total/(scores.length*10))*100) : 0;
  const grade   = getGrade(pct);
  const parsed  = parseFinalResults(finalText);

  return (
    <div style={{ margin:'0', animation:'fadeUp 0.4s ease forwards' }}>
      {/* Top accent bar */}
      <div style={{ height:'4px', background:`linear-gradient(90deg,${accent},#7c3aed,#4f46e5,${accent})`, borderRadius:'0' }} />

      {/* Card header */}
      <div style={{ padding:'32px 36px 24px', background:'linear-gradient(180deg,rgba(139,92,246,0.1) 0%,transparent 100%)', borderBottom:'1px solid rgba(139,92,246,0.12)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', background:`radial-gradient(circle,${accent}20,transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ fontSize:'0.68rem', color:'#6b6b8a', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>Interview Scorecard</div>
        <div style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-0.04em', background:'linear-gradient(135deg,#ffffff 0%,#e0d7ff 50%,#a78bfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1.1, marginBottom:'14px' }}>
          {userName}
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <Chip color={accent}>{topic?.icon} {topic?.label}</Chip>
          <Chip color={qType==='mcq'?'#fbbf24':'#a78bfa'}>{qType==='mcq'?'🔘 MCQ':'✍️ Short Answer'}</Chip>
          <Chip color="#60a5fa">{experience} YOE</Chip>
          <Chip color="#6b7280">{numQ} Questions</Chip>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:'28px 36px', display:'flex', flexDirection:'column', gap:'24px' }}>
        {/* Grade + Score row */}
        <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
          <div style={{ width:'88px', height:'88px', borderRadius:'18px', border:`2px solid ${grade.color}40`, background:`${grade.color}10`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 28px ${grade.color}20` }}>
            <div style={{ fontSize:'3rem', fontWeight:900, color:grade.color, lineHeight:1 }}>{grade.label}</div>
            <div style={{ fontSize:'0.65rem', color:grade.color, fontWeight:700, opacity:0.8, marginTop:'2px' }}>{grade.desc}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'2.4rem', fontWeight:900, color:'#f0f0ff', letterSpacing:'-0.03em', lineHeight:1 }}>
              {total}<span style={{ color:'#3a3a6a', fontSize:'1.6rem' }}>/{numQ*10}</span>
            </div>
            <div style={{ fontSize:'0.82rem', color:'#6060a0', marginTop:'4px', fontWeight:600 }}>{pct}% · {scores.length} questions answered</div>
            {parsed.verdict && (
              <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'10px', padding:'5px 12px', borderRadius:'8px', fontSize:'0.76rem', fontWeight:800, background:`${grade.color}14`, border:`1px solid ${grade.color}30`, color:grade.color }}>
                ⚡ {parsed.verdict}
              </div>
            )}
          </div>
        </div>

        {/* Per-question bar chart */}
        <div>
          <SLabel>Question Breakdown</SLabel>
          <div style={{ display:'flex', gap:'6px', alignItems:'flex-end', height:'72px', padding:'4px 0' }}>
            {scores.map((s,i) => {
              const c = s>=8?'#34d399':s>=5?'#fbbf24':'#f87171';
              return (
                <div key={i} title={`Q${i+1}: ${s}/10`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                  <span style={{ fontSize:'0.62rem', color:'#5a5a7a', fontFamily:"'JetBrains Mono',monospace" }}>{s}</span>
                  <div style={{ width:'18px', height:`${Math.max(6,s*4)}px`, background:`linear-gradient(180deg,${c},${c}88)`, borderRadius:'4px 4px 2px 2px' }} />
                  <span style={{ fontSize:'0.6rem', color:'#3a3a5a' }}>Q{i+1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths + Areas */}
        {(parsed.strengths.length > 0 || parsed.areas.length > 0) && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            {parsed.strengths.length > 0 && (
              <div>
                <SLabel>Strengths</SLabel>
                <div style={{ background:'rgba(52,211,153,0.05)', border:'1px solid rgba(52,211,153,0.15)', borderRadius:'12px', padding:'14px' }}>
                  {parsed.strengths.slice(0,3).map((s,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', fontSize:'0.78rem', color:'#9090b0', lineHeight:1.55, marginBottom: i<2?'8px':0 }}>
                      <span style={{ color:'#34d399', flexShrink:0 }}>▸</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {parsed.areas.length > 0 && (
              <div>
                <SLabel>Areas to Focus</SLabel>
                <div style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.15)', borderRadius:'12px', padding:'14px' }}>
                  {parsed.areas.slice(0,3).map((a,i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', fontSize:'0.78rem', color:'#9090b0', lineHeight:1.55, marginBottom: i<2?'8px':0 }}>
                      <span style={{ color:'#fbbf24', flexShrink:0 }}>▸</span>{a}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next steps */}
        {parsed.nextSteps && (
          <div>
            <SLabel>Next Steps</SLabel>
            <div style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:'12px', padding:'14px', fontSize:'0.82rem', color:'#9090c0', lineHeight:1.7 }}>
              {parsed.nextSteps}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', paddingTop:'4px' }}>
          <button onClick={onDownload} style={{ ...P, display:'flex', alignItems:'center', gap:'7px', fontSize:'0.88rem' }}>
            📄 Download Scorecard
          </button>
          <button className="gbtn" onClick={onLinkedIn} style={G}>{copied?'✓ Copied!':'🔗 Copy for LinkedIn'}</button>
          <button className="gbtn" onClick={onNew} style={{ ...G, marginLeft:'auto' }}>New Interview →</button>
        </div>
      </div>
    </div>
  );
}

function SLabel({ children }) {
  return <div style={{ fontSize:'0.68rem', color:'#4a4a6a', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px', display:'flex', alignItems:'center', gap:'8px' }}>{children}<div style={{ flex:1, height:'1px', background:'linear-gradient(90deg,rgba(139,92,246,0.2),transparent)' }} /></div>;
}

// ─────────────────────────────────────────────
// MISC ATOMS
// ─────────────────────────────────────────────
function Chip({ color, children }) {
  return <span style={{ padding:'4px 11px', background:`${color}1a`, border:`1px solid ${color}35`, borderRadius:'99px', fontSize:'0.75rem', fontWeight:700, color, whiteSpace:'nowrap' }}>{children}</span>;
}
function Label({ children }) {
  return <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#3a3a5a', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>{children}</div>;
}
function Dots() {
  return <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'2px 4px' }}>{[0,1,2].map(i=><div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#6366f1)', animation:`bounce 1.1s ease-in-out ${i*0.17}s infinite` }} />)}</div>;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;}
  body{margin:0;background:#0d0d1a;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:99px;}
  input[type=number]{-moz-appearance:textfield;}
  input[type=number]::-webkit-inner-spin-button{opacity:0.3;}
  .tc{transition:all 0.18s ease;}.tc:hover{transform:translateY(-2px);}.tc.sel{transform:translateY(-2px);}
  .qt-card{transition:all 0.18s ease;cursor:pointer;}.qt-card:hover{transform:translateY(-2px);border-color:rgba(139,92,246,0.5)!important;}
  .ivinput:focus{border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,0.2)!important;outline:none;}
  .ivta:focus{border-color:#8b5cf6!important;box-shadow:0 0 0 3px rgba(139,92,246,0.2)!important;outline:none;}
  .startbtn{transition:all 0.2s ease;}.startbtn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(139,92,246,0.4)!important;}
  .gbtn{transition:all 0.15s;}.gbtn:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.15)!important;color:#e2e8f0!important;}
  .pbtn{transition:all 0.15s;}.pbtn:hover{opacity:0.88;}
  .sndbtn{transition:all 0.15s;}.sndbtn:hover:not(:disabled){opacity:0.88;box-shadow:0 6px 20px rgba(139,92,246,0.35)!important;}
  .msg{animation:fadeUp 0.22s ease forwards;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}
  @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.3;}40%{transform:translateY(-6px);opacity:1;}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.4);}50%{box-shadow:0 0 40px rgba(124,58,237,0.7);}}
`;

const INP = { width:'100%', padding:'13px 15px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#eeeeff', fontSize:'0.93rem', outline:'none', fontFamily:'inherit', transition:'border-color 0.2s, box-shadow 0.2s' };
const G   = { padding:'9px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#6060a0', borderRadius:'10px', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 };
const P   = { padding:'10px 18px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'0.82rem', fontWeight:800, boxShadow:'0 4px 14px rgba(124,58,237,0.3)' };

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// GOOGLE SHEETS HELPERS
// ─────────────────────────────────────────────
const SHEETS_URL   = import.meta.env.VITE_SHEETS_URL   ?? '';
const SHEETS_TOKEN = import.meta.env.VITE_SHEETS_TOKEN ?? '';

async function sheetsPost(payload) {
  if (!SHEETS_URL) return;
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script redirects; we don't need the response body
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, token: SHEETS_TOKEN }),
    });
  } catch { /* silent — don't block the UI */ }
}

export default function InterviewSimulator() {
  const [phase, setPhase]             = useState('setup');
  const [userName, setUserName]       = useState('');
  const [selectedTopic, setTopic]     = useState(null);
  const [selCat, setSelCat]           = useState(null);
  const [qType, setQType]             = useState('short');
  const [experience, setExperience]   = useState('');
  const [numQ, setNumQ]               = useState(5);
  const [sessionId]                   = useState(() => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`);
  const [chat, setChat]               = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [typing, setTyping]           = useState(false);
  const [qNum, setQNum]               = useState(0);
  const [scores, setScores]           = useState([]);
  const [timer, setTimer]             = useState(180);
  const [timerOn, setTimerOn]         = useState(false);
  const [done, setDone]               = useState(false);
  const [copied, setCopied]           = useState(false);
  const [mcqPicked, setMcqPicked]     = useState(false);
  const [finalText, setFinalText]     = useState('');
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing]);
  useEffect(() => {
    if (!timerOn || timer <= 0) return;
    const id = setInterval(()=>setTimer(t=>t-1), 1000);
    return ()=>clearInterval(id);
  }, [timerOn, timer]);

  const tMax    = qType==='mcq' ? 60 : 180;
  const accent  = selCat ? (CATEGORY_META[selCat]?.color ?? '#8b5cf6') : '#8b5cf6';
  const total   = scores.reduce((a,b)=>a+b,0);
  const pct     = scores.length>0 ? Math.round((total/(scores.length*10))*100) : 0;
  const grade   = getGrade(pct);
  const tPct    = (timer/tMax)*100;
  const tColor  = timer>(tMax*0.66)?'#34d399':timer>(tMax*0.33)?'#fbbf24':'#f87171';
  const lowT    = timer<=(tMax*0.17) && timerOn;

  const lastAiMsg    = [...messages].reverse().find(m=>m.from==='ai');
  const mcqOpts      = (qType==='mcq' && lastAiMsg && !done) ? parseMCQOptions(lastAiMsg.text) : [];
  const showMCQBtns  = mcqOpts.length===4 && !mcqPicked && !typing;

  const parseApiError = (err) => {
    const msg = err?.message ?? String(err);
    if (msg.includes('503') || msg.toLowerCase().includes('high demand') || msg.toLowerCase().includes('unavailable')) return '503';
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) return '429';
    return 'unknown';
  };

  const startInterview = async (e) => {
    e.preventDefault();
    if (!selectedTopic || !experience || !userName.trim()) return;
    setPhase('interview'); setTyping(true); setMessages([]);
    setScores([]); setQNum(0); setDone(false); setMcqPicked(false); setFinalText('');

    // 📊 Create row in Google Sheet as soon as interview starts
    const category = Object.keys(TOPIC_CATEGORIES).find(cat => TOPIC_CATEGORIES[cat].some(t => t.id === selectedTopic.id)) ?? '';
    sheetsPost({
      action: 'create',
      sessionId,
      name: userName.trim(),
      topic: selectedTopic.label ?? selectedTopic.id,
      category,
      qType,
      experience,
      numQ,
      startTime: new Date().toLocaleString(),
    });

    const prompt = qType==='mcq' ? buildPromptMCQ(selectedTopic.id, experience, numQ) : buildPromptShort(selectedTopic.id, experience, numQ);
    try {
      const model = genAI.getGenerativeModel({ model:'gemini-2.5-flash' });
      const session = model.startChat({
        history:[
          { role:'user',  parts:[{ text:prompt }] },
          { role:'model', parts:[{ text:'Understood. Starting now.' }] },
        ],
      });
      setChat(session);
      const res = await session.sendMessage(`Begin. Candidate name: ${userName.trim()}. ${experience} YOE in ${selectedTopic.id}.`);
      setMessages([{ id:Date.now(), from:'ai', text:res.response.text() }]);
      setQNum(1); setTimer(tMax); setTimerOn(true);
    } catch(err) {
      const code = parseApiError(err);
      const msg = code === '503'
        ? '🔴 Gemini is under high demand right now (503). Wait a few seconds, then tap **Retry** below.'
        : code === '429'
        ? '🟡 API rate limit hit (429). Please wait a moment and **Retry**.'
        : '⚠️ Could not start. Check your VITE_GEMINI_API_KEY and try again.';
      setMessages([{ id:Date.now(), from:'ai', text: msg, retryFn: () => startInterview({ preventDefault:()=>{} }) }]);
    } finally { setTyping(false); }
  };

  const sendAnswer = async (text) => {
    if (!text.trim() || !chat || typing) return;
    setMessages(p=>[...p,{ id:Date.now(), from:'user', text }]);
    setInput(''); setTyping(true); setTimerOn(false); setMcqPicked(true);
    try {
      const res = await chat.sendMessage(text);
      const resp = res.response.text();
      const sc = parseScore(resp);
      if (sc !== null) setScores(p=>[...p,sc]);
      if (isFinal(resp)) {
        setDone(true); setFinalText(resp); setTimerOn(false);

        // 📊 Update Google Sheet row with final results
        const allScores = sc !== null ? [...scores, sc] : scores;
        const total     = allScores.reduce((a,b) => a+b, 0);
        const maxScore  = allScores.length * 10;
        const pct       = allScores.length > 0 ? Math.round((total / maxScore) * 100) : 0;
        const gradeObj  = getGrade(pct);
        const { verdict } = parseFinalResults(resp);
        sheetsPost({
          action: 'update',
          sessionId,
          score: total,
          maxScore,
          percentage: pct,
          grade: gradeObj.label,
          verdict,
        });
      }
      else { setQNum(p=>Math.min(p+1,numQ)); setTimer(tMax); setTimerOn(true); setMcqPicked(false); }
      setMessages(p=>[...p,{ id:Date.now(), from:'ai', text:resp }]);
      setTimeout(()=>inputRef.current?.focus(), 80);
    } catch(err) {
      const code = parseApiError(err);
      const msg = code === '503'
        ? '🔴 Gemini is overloaded (503). Your answer was saved — tap **Retry** to resubmit.'
        : code === '429'
        ? '🟡 Rate limit hit (429). Wait a moment, then tap **Retry**.'
        : '⚠️ Connection error. Please try again.';
      setMessages(p=>[...p,{ id:Date.now(), from:'ai', text: msg, retryFn: () => sendAnswer(text) }]);
      setMcqPicked(false);
    } finally { setTyping(false); }
  };

  const onKey = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(input); } };

  const handleDownload = () => downloadScorecard({ userName:userName.trim(), topic:selectedTopic, qType, experience, numQ, scores, date:new Date().toLocaleDateString(), finalText });

  const handleLinkedIn = () => {
    const g = grade.label;
    const tag = selectedTopic?.id.replace(/[^a-zA-Z0-9]/g,'');
    navigator.clipboard.writeText(`Scored ${total}/${numQ*10} (Grade ${g}) in an AI-powered ${qType==='mcq'?'MCQ':'open-ended'} ${selectedTopic?.label} interview 🎯\n\nAdaptive difficulty + per-question scoring powered by Gemini 2.5 Flash.\n\n#${tag} #SoftwareEngineering #TechInterview #InterviewPrep`);
    setCopied(true); setTimeout(()=>setCopied(false),2500);
  };

  const reset = () => {
    setPhase('setup'); setChat(null); setMessages([]); setTopic(null); setSelCat(null);
    setUserName(''); setExperience(''); setNumQ(5); setScores([]);
    setQNum(0); setDone(false); setTimerOn(false); setMcqPicked(false); setFinalText('');
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0d0d1a 0%,#0f0e1f 40%,#110d1e 100%)', color:'#c0c0d0', fontFamily:"'Inter',-apple-system,sans-serif", padding:'28px 16px', position:'relative', overflow:'hidden' }}>
      <style>{CSS}</style>
      <div style={{ position:'fixed', top:'-120px', left:'50%', transform:'translateX(-50%)', width:'800px', height:'500px', background:'radial-gradient(ellipse,rgba(139,92,246,0.14) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-80px', right:'-100px', width:'500px', height:'400px', background:'radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      <div style={{ maxWidth:'920px', margin:'0 auto', position:'relative', zIndex:1 }}>

        {/* NAV */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'36px', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'13px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, animation:'glow 3s ease-in-out infinite', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.2),transparent 60%)', borderRadius:'13px' }} />
              <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="18" stroke="white" strokeWidth="3.5" strokeOpacity="0.9"/>
                <circle cx="32" cy="32" r="10" stroke="white" strokeWidth="2.5" strokeOpacity="0.7"/>
                <circle cx="32" cy="32" r="4" fill="white" fillOpacity="0.95"/>
                <line x1="32" y1="10" x2="32" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="32" y1="45" x2="32" y2="54" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="10" y1="32" x2="19" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="45" y1="32" x2="54" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:'1.15rem', fontWeight:900, letterSpacing:'-0.03em', background:'linear-gradient(90deg,#f0f0ff 0%,#c4b5fd 60%,#818cf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>InterviewAI</div>
              <div style={{ fontSize:'0.7rem', color:'#4a4a6a', marginTop:'1px', fontWeight:500 }}>Adaptive Technical Interviews · Gemini 2.5 Flash</div>
            </div>
          </div>
          {phase==='interview' && !done && <button className="gbtn" onClick={reset} style={G}>✕ End Session</button>}
        </nav>

        {/* CARD */}
        <div style={{ background:'rgba(18,14,35,0.85)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'1px solid rgba(139,92,246,0.18)', borderRadius:'22px', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04) inset' }}>

          {/* ══ SETUP ══ */}
          {phase==='setup' && (
            <form onSubmit={startInterview}>
              <div style={{ padding:'44px 40px 36px', borderBottom:'1px solid rgba(139,92,246,0.12)', background:'linear-gradient(180deg,rgba(139,92,246,0.08) 0%,transparent 100%)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(139,92,246,0.07) 1px,transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />
                <div style={{ position:'relative' }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 14px', background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.28)', borderRadius:'99px', marginBottom:'20px' }}>
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#8b5cf6', display:'inline-block', animation:'pulse 2s ease infinite' }} />
                    <span style={{ fontSize:'0.7rem', color:'#a78bfa', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase' }}>AI-Powered · Adaptive Difficulty</span>
                  </div>
                  <h1 style={{ fontSize:'2.3rem', fontWeight:900, margin:'0 0 10px', letterSpacing:'-0.04em', lineHeight:1.1, background:'linear-gradient(135deg,#ffffff 0%,#e0d7ff 40%,#a78bfa 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    Configure Your<br/>Interview Session
                  </h1>
                  <p style={{ fontSize:'0.9rem', color:'#5a5a7a', margin:0, maxWidth:'480px', lineHeight:1.6 }}>
                    Enter your name, pick a domain &amp; style, and get grilled by an AI that adapts to how well you answer.
                  </p>
                </div>
              </div>

              <div style={{ padding:'36px 40px', display:'flex', flexDirection:'column', gap:'32px' }}>

                {/* ── NAME ── */}
                <div>
                  <Label>Your Name</Label>
                  <input className="ivinput" type="text" value={userName} onChange={e=>setUserName(e.target.value)} placeholder="e.g. Rahul Roy" required maxLength={60}
                    style={{ ...INP, fontSize:'1.05rem', fontWeight:600, background: userName ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.04)', borderColor: userName ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)' }}
                  />
                  <div style={{ fontSize:'0.72rem', color:'#3a3a5a', marginTop:'6px' }}>This will appear on your scorecard after the interview.</div>
                </div>

                {/* ── QUESTION TYPE ── */}
                <div>
                  <Label>Question Type</Label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    {Q_TYPES.map(qt => {
                      const sel = qType===qt.id;
                      return (
                        <div key={qt.id} className="qt-card" onClick={()=>setQType(qt.id)}
                          style={{ padding:'18px 20px', borderRadius:'14px', border:`1px solid ${sel?'rgba(139,92,246,0.6)':'rgba(255,255,255,0.07)'}`, background:sel?'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.08))':'rgba(255,255,255,0.03)', userSelect:'none', position:'relative', overflow:'hidden', boxShadow:sel?'0 0 24px rgba(139,92,246,0.18)':'none' }}>
                          {sel && <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px', background:'radial-gradient(circle,rgba(139,92,246,0.2),transparent 70%)', pointerEvents:'none' }} />}
                          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                            <span style={{ fontSize:'1.4rem' }}>{qt.icon}</span>
                            <span style={{ fontSize:'0.95rem', fontWeight:800, color:sel?'#f0f0ff':'#8080a0' }}>{qt.label}</span>
                            {sel && <div style={{ marginLeft:'auto', width:'8px', height:'8px', borderRadius:'50%', background:'#8b5cf6', boxShadow:'0 0 8px #8b5cf6' }} />}
                          </div>
                          <p style={{ fontSize:'0.79rem', color:sel?'#9090c0':'#3a3a5a', margin:0, lineHeight:1.5 }}>{qt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                  {qType==='mcq' && (
                    <div style={{ marginTop:'10px', padding:'10px 14px', background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'10px', fontSize:'0.78rem', color:'#a89060', display:'flex', gap:'8px', alignItems:'center' }}>
                      <span>⏱</span><span>MCQ mode uses a <strong style={{ color:'#fbbf24' }}>60-second</strong> timer per question.</span>
                    </div>
                  )}
                </div>

                {/* ── DOMAIN ── */}
                <div>
                  <Label>Domain</Label>
                  {Object.entries(TOPIC_CATEGORIES).map(([cat,topics]) => {
                    const meta = CATEGORY_META[cat] || { color:'#8b5cf6', glyph:'◆' };
                    return (
                      <div key={cat} style={{ marginBottom:'22px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                          <span style={{ color:meta.color, fontSize:'0.85rem', opacity:0.8 }}>{meta.glyph}</span>
                          <span style={{ fontSize:'0.7rem', color:meta.color, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', opacity:0.85 }}>{cat}</span>
                          <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,${meta.color}30,transparent)`, marginLeft:'4px' }} />
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(162px,1fr))', gap:'8px' }}>
                          {topics.map(t => {
                            const sel = selectedTopic?.id===t.id;
                            return (
                              <div key={t.id} className={`tc${sel?' sel':''}`} onClick={()=>{ setTopic(t); setSelCat(cat); }}
                                style={{ background:sel?`linear-gradient(135deg,${meta.color}14,${meta.color}08)`:'rgba(255,255,255,0.03)', border:`1px solid ${sel?meta.color+'60':'rgba(255,255,255,0.07)'}`, borderRadius:'13px', padding:'14px', cursor:'pointer', userSelect:'none', position:'relative', overflow:'hidden', boxShadow:sel?`0 0 20px ${meta.color}20,inset 0 0 20px ${meta.color}08`:'none' }}>
                                {sel && <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'70px', height:'70px', background:`radial-gradient(circle,${meta.color}25,transparent 70%)`, pointerEvents:'none' }} />}
                                <div style={{ fontSize:'1.35rem', marginBottom:'7px' }}>{t.icon}</div>
                                <div style={{ fontSize:'0.84rem', fontWeight:700, color:sel?'#f0f0ff':'#b0b0c8', marginBottom:'5px' }}>{t.label}</div>
                                <div style={{ fontSize:'0.67rem', color:sel?meta.color:'#3a3a5a', fontWeight:500, lineHeight:1.5 }}>{t.tags.join(' · ')}</div>
                                {sel && <div style={{ position:'absolute', top:'10px', right:'10px', width:'7px', height:'7px', borderRadius:'50%', background:meta.color, boxShadow:`0 0 6px ${meta.color}` }} />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── PARAMS ── */}
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                  <div style={{ flex:1, minWidth:'180px' }}>
                    <Label>Years of Experience</Label>
                    <input className="ivinput" type="number" min="0" step="0.5" value={experience} onChange={e=>setExperience(e.target.value)} placeholder="e.g. 3.5" required style={INP} />
                  </div>
                  <div style={{ flex:1, minWidth:'180px' }}>
                    <Label>Number of Questions</Label>
                    <input className="ivinput" type="number" min="1" max="15" value={numQ} onChange={e=>setNumQ(+e.target.value||5)} required style={INP} />
                  </div>
                </div>

                {/* ── CTA ── */}
                <button className="startbtn" type="submit" disabled={!selectedTopic||!experience||!userName.trim()}
                  style={{ padding:'18px', borderRadius:'14px', fontSize:'1rem', fontWeight:800, letterSpacing:'-0.01em', cursor:(!selectedTopic||!experience||!userName.trim())?'not-allowed':'pointer', border:'none',
                    background:(!selectedTopic||!experience||!userName.trim())?'rgba(255,255,255,0.04)':`linear-gradient(135deg,${accent} 0%,#4f46e5 100%)`,
                    color:(!selectedTopic||!experience||!userName.trim())?'#3a3a5a':'#ffffff',
                    boxShadow:(!selectedTopic||!experience||!userName.trim())?'none':`0 4px 24px ${accent}40`,
                  }}>
                  {!userName.trim() ? 'Enter your name to continue'
                   : !selectedTopic ? 'Select a domain to continue'
                   : `Start ${selectedTopic.label} ${qType==='mcq'?'MCQ ':''}Interview →`}
                </button>
              </div>
            </form>
          )}

          {/* ══ INTERVIEW ══ */}
          {phase==='interview' && !done && (
            <>
              <div style={{ padding:'14px 26px', borderBottom:'1px solid rgba(139,92,246,0.12)', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', background:'linear-gradient(180deg,rgba(139,92,246,0.07) 0%,transparent 100%)' }}>
                <Chip color={accent}>{selectedTopic?.icon} {selectedTopic?.label}</Chip>
                <Chip color={qType==='mcq'?'#fbbf24':'#a78bfa'}>{qType==='mcq'?'🔘 MCQ':'✍️ Short Answer'}</Chip>
                <Chip color="#60a5fa">{experience} YOE</Chip>
                <Chip color="#6b7280">Q {Math.min(qNum,numQ)} / {numQ}</Chip>
                <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                  {Array.from({length:numQ}).map((_,i)=>(
                    <div key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', transition:'all 0.3s', background:i<qNum-1?accent:i===qNum-1?accent:'rgba(255,255,255,0.1)', boxShadow:i===qNum-1?`0 0 8px ${accent}`:'none', opacity:i<qNum-1?0.5:1 }} />
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginLeft:'auto' }}>
                  <div style={{ width:'90px', height:'4px', background:'rgba(255,255,255,0.07)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${tPct}%`, background:`linear-gradient(90deg,${tColor},${tColor}88)`, borderRadius:'2px', transition:'width 1s linear, background 0.4s' }} />
                  </div>
                  <span style={{ fontSize:'0.82rem', fontWeight:800, color:tColor, fontFamily:"'JetBrains Mono',monospace", minWidth:'36px', animation:lowT?'pulse 0.7s ease infinite':'none' }}>{fmtTime(timer)}</span>
                </div>
              </div>

              <div style={{ height:'520px', overflowY:'auto', padding:'28px 26px', display:'flex', flexDirection:'column', gap:'22px', background:'linear-gradient(180deg,rgba(10,8,24,0.6) 0%,rgba(8,6,20,0.8) 100%)' }}>
                {messages.map((msg,idx) => {
                  const isLastAI = msg.from==='ai' && idx===messages.length-1;
                  const opts = (isLastAI && qType==='mcq') ? parseMCQOptions(msg.text) : [];
                  return (
                    <div key={msg.id} className="msg" style={{ display:'flex', gap:'10px', flexDirection:msg.from==='user'?'row-reverse':'row', alignItems:'flex-start' }}>
                      <div style={{ width:'30px', height:'30px', borderRadius:'9px', flexShrink:0, marginTop:'1px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', background:msg.from==='ai'?'linear-gradient(135deg,#7c3aed,#4f46e5)':'rgba(255,255,255,0.06)', border:msg.from==='ai'?'none':'1px solid rgba(255,255,255,0.1)', boxShadow:msg.from==='ai'?'0 0 14px rgba(124,58,237,0.4)':'none' }}>
                        {msg.from==='ai'?'🤖':'👤'}
                      </div>
                      <div style={{ maxWidth:'82%' }}>
                        <div style={{ fontSize:'0.65rem', fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase', color:msg.from==='user'?'#7c3aed':'#3a3a5a', marginBottom:'5px', textAlign:msg.from==='user'?'right':'left', paddingInline:'2px' }}>
                          {msg.from==='user' ? userName || 'You' : 'AI Interviewer'}
                        </div>
                        <div style={{ background:msg.from==='user'?'linear-gradient(135deg,#5b21b6 0%,#4c1d95 100%)':'rgba(255,255,255,0.04)', border:`1px solid ${msg.from==='user'?'rgba(139,92,246,0.4)':'rgba(255,255,255,0.07)'}`, borderRadius:msg.from==='user'?'18px 4px 18px 18px':'4px 18px 18px 18px', padding:'14px 18px', color:msg.from==='user'?'#ede9fe':'#b8b8d0', lineHeight:1.7, boxShadow:msg.from==='user'?'0 6px 24px rgba(76,29,149,0.35)':'0 2px 10px rgba(0,0,0,0.25)', backdropFilter:'blur(8px)' }}>
                          {msg.from==='user' ? <div style={{ whiteSpace:'pre-wrap', fontSize:'0.93rem' }}>{msg.text}</div> : <MD text={msg.text} />}
                          {opts.length===4 && <MCQOptions options={opts} disabled={mcqPicked||typing} onPick={l=>sendAnswer(l)} />}
                          {msg.retryFn && !typing && (
                            <button onClick={msg.retryFn} style={{ marginTop:'12px', padding:'7px 18px', borderRadius:'8px', border:'1px solid rgba(251,191,36,0.4)', background:'rgba(251,191,36,0.1)', color:'#fbbf24', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                              ↺ Retry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typing && (
                  <div className="msg" style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <div style={{ width:'30px', height:'30px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', background:'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow:'0 0 14px rgba(124,58,237,0.4)' }}>🤖</div>
                    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'4px 18px 18px 18px', padding:'14px 18px' }}><Dots /></div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {scores.length>0 && (
                <div style={{ padding:'11px 26px', borderTop:'1px solid rgba(139,92,246,0.1)', display:'flex', alignItems:'center', gap:'12px', background:'rgba(8,6,20,0.6)', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'0.67rem', color:'#3a3a5a', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em' }}>Performance</span>
                  <div style={{ display:'flex', gap:'3px', alignItems:'flex-end', height:'28px' }}>
                    {scores.map((s,i)=>{ const c=s>=8?'#34d399':s>=5?'#fbbf24':'#f87171'; return <div key={i} title={`Q${i+1}: ${s}/10`} style={{ width:'14px', height:`${Math.max(4,s*2.4)}px`, background:c, borderRadius:'3px 3px 2px 2px', opacity:0.9 }} />; })}
                  </div>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:'#6060a0' }}>{total}/{scores.length*10}</span>
                </div>
              )}

              {!done && (
                <div style={{ padding:'16px 26px', borderTop:'1px solid rgba(139,92,246,0.1)', background:'rgba(12,10,28,0.8)', backdropFilter:'blur(12px)' }}>
                  {showMCQBtns && <div style={{ fontSize:'0.76rem', color:'#5a5a7a', marginBottom:'10px' }}>👆 Click an option above, or type <strong style={{ color:'#8b8bcf' }}>A / B / C / D</strong> below</div>}
                  <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                    <textarea ref={inputRef} className="ivta" rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey} disabled={typing}
                      placeholder={typing?'Evaluating…':showMCQBtns?'Or type A / B / C / D and press Enter':'Your answer  ·  Enter to submit  ·  Shift+Enter for newline'}
                      style={{ flex:1, padding:'13px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'13px', color:'#eeeeff', fontSize:'0.93rem', outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.55, transition:'border-color 0.2s,box-shadow 0.2s' }}
                    />
                    <button className="sndbtn" onClick={()=>sendAnswer(input)} disabled={typing||!input.trim()}
                      style={{ padding:'13px 22px', borderRadius:'13px', fontWeight:800, fontSize:'0.9rem', cursor:(typing||!input.trim())?'not-allowed':'pointer', whiteSpace:'nowrap', flexShrink:0, border:'none', background:(typing||!input.trim())?'rgba(255,255,255,0.04)':'linear-gradient(135deg,#7c3aed,#4f46e5)', color:(typing||!input.trim())?'#3a3a5a':'#ffffff', boxShadow:(typing||!input.trim())?'none':'0 4px 18px rgba(124,58,237,0.35)' }}>
                      Submit →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ SCORECARD ══ */}
          {phase==='interview' && done && (
            <InlineScorecard
              userName={userName}
              topic={selectedTopic}
              qType={qType}
              experience={experience}
              numQ={numQ}
              scores={scores}
              finalText={finalText}
              accent={accent}
              onDownload={handleDownload}
              onNew={reset}
              onLinkedIn={handleLinkedIn}
              copied={copied}
            />
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:'24px', fontSize:'0.68rem', color:'#1e1e38', letterSpacing:'0.04em' }}>
          Adaptive difficulty · Short Answer & MCQ · Personalised Scorecards · Gemini 2.5 Flash
        </div>
      </div>
    </div>
  );
}
