import fs from 'fs';
import path from 'path';

const root = 'src';
const skip = new Set([
  'DashboardView.tsx',
  'ActiveWorkoutModal.tsx',
  'EvolutionView.tsx',
  'Navbar.tsx',
  'BottomNav.tsx',
]);

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'ui') continue;
      walk(p);
    } else if (e.name.endsWith('.tsx')) files.push(p);
  }
}
walk(root);

const colorMap = {
  'neutral-950': 'base',
  'neutral-900': 'panel',
  'neutral-800': 'elevated',
  'neutral-700': 'line-strong',
  'neutral-600': 'line-strong',
  'neutral-500': 'faint',
  'neutral-400': 'muted',
  'neutral-300': 'strong',
  'neutral-200': 'strong',
  'neutral-100': 'ink',
  'emerald-950': 'lime',
  'emerald-900': 'lime',
  'emerald-800': 'lime',
  'emerald-700': 'lime-dim',
  'emerald-600': 'lime-dim',
  'emerald-500': 'lime',
  'emerald-400': 'lime',
  'emerald-300': 'lime',
  'emerald-200': 'lime',
  'teal-600': 'lime-dim',
  'teal-500': 'lime-dim',
  'teal-400': 'lime-dim',
  'teal-300': 'lime-dim',
  'cyan-600': 'lime-dim',
  'cyan-500': 'lime-dim',
  'cyan-400': 'lime-dim',
  'cyan-300': 'lime-dim',
  'sky-600': 'lime-dim',
  'sky-500': 'lime-dim',
  'sky-400': 'lime-dim',
  'purple-600': 'lime-dim',
  'purple-500': 'lime-dim',
  'purple-400': 'lime-dim',
  'purple-300': 'lime-dim',
  'amber-600': 'lime-dim',
  'amber-500': 'lime-dim',
  'amber-400': 'lime-dim',
  'amber-300': 'lime-dim',
  'rose-600': 'danger',
  'rose-500': 'danger',
  'rose-400': 'danger',
  'rose-300': 'danger',
  'orange-500': 'lime-dim',
  'orange-400': 'lime-dim',
};

for (const file of files) {
  if (skip.has(path.basename(file))) continue;
  let s = fs.readFileSync(file, 'utf8');
  const before = s;

  // gradients: a few brand ones become flat lime, the rest drop their stops
  s = s.replace(/bg-gradient-to-br from-emerald-500 to-teal-700/g, 'bg-lime');
  s = s.replace(/bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500/g, 'bg-lime');
  s = s.replace(/bg-gradient-to-r from-emerald-500 to-teal-500/g, 'bg-lime');
  s = s.replace(/bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400/g, 'bg-lime');
  s = s.replace(/bg-gradient-to-[a-z]+/g, '');
  s = s.replace(/\b(from|via|to)-(emerald|teal|cyan|sky|purple|amber|rose|neutral|orange)-[0-9]{2,3}(\/[0-9.]+)?\b/g, '');

  s = s.replace(/\bshadow-[a-z0-9[\]#/._-]+\b/g, '');
  s = s.replace(/\bfont-black\b/g, 'font-semibold');
  s = s.replace(/\buppercase\b/g, '');
  s = s.replace(/\btracking-(widest|wider|wide)\b/g, '');
  s = s.replace(/text-\[([0-9])px\]/g, 'text-[11px]');
  s = s.replace(/text-\[10\.5px\]/g, 'text-[11px]');

  s = s.replace(
    /(bg|text|border|divide|ring|accent|fill|stroke|placeholder|decoration|outline)-((?:neutral|emerald|teal|cyan|sky|purple|amber|rose|orange)-[0-9]{2,3}(?:\/[0-9.]+)?)/g,
    (m, prop, shade) => {
      const cut = shade.indexOf('/');
      const name = cut === -1 ? shade : shade.slice(0, cut);
      const op = cut === -1 ? '' : shade.slice(cut);
      const mapped = colorMap[name];
      return mapped ? `${prop}-${mapped}${op}` : m;
    }
  );

  // tinted lime backgrounds from emerald-950/40 style stay subtle
  s = s.replace(/bg-lime\/([4-9][0-9]?|100)\b/g, 'bg-lime/10');
  s = s.replace(/border-lime\/([4-9][0-9]?|100)\b/g, 'border-lime/25');

  // tidy double spaces inside className strings
  s = s.replace(/className="\s+/g, 'className="');
  s = s.replace(/\s{2,}(?=["])/g, ' ');

  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log('updated', file);
  }
}
