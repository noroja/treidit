import React from 'react';

export type MuscleKey =
  | 'peitoral'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'abdomen'
  | 'dorsais'
  | 'trapezio'
  | 'lombar'
  | 'gluteos'
  | 'quadriceps'
  | 'posterior'
  | 'panturrilha'
  | 'antebraco';

const GROUPS: Record<MuscleKey, string> = {
  peitoral: 'Peitoral',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdomen: 'Abdômen',
  dorsais: 'Dorsais',
  trapezio: 'Trapézio',
  lombar: 'Lombar',
  gluteos: 'Glúteos',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  panturrilha: 'Panturrilha',
  antebraco: 'Antebraço',
};

const normalize = (raw: string): MuscleKey | null => {
  const t = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (t.includes('peitor') || t.includes('peito')) return 'peitoral';
  if (t.includes('ombro') || t.includes('delto')) return 'ombros';
  if (t.includes('bicep')) return 'biceps';
  if (t.includes('tricep')) return 'triceps';
  if (t.includes('abd') || t.includes('core')) return 'abdomen';
  if (t.includes('dorsa') || t.includes('costas') || t.includes('latiss')) return 'dorsais';
  if (t.includes('trap')) return 'trapezio';
  if (t.includes('lombar')) return 'lombar';
  if (t.includes('glute')) return 'gluteos';
  if (t.includes('quadri')) return 'quadriceps';
  if (t.includes('posterior') || t.includes('isquio')) return 'posterior';
  if (t.includes('pantur') || t.includes('gemeo')) return 'panturrilha';
  if (t.includes('antebra')) return 'antebraco';
  return null;
};

interface MuscleMapProps {
  muscles: string[];
  /** Opcional: série semanal por grupo, usada no rótulo. */
  volumes?: Partial<Record<MuscleKey, number>>;
  className?: string;
  showLegend?: boolean;
  tone?: 'dark' | 'onLime';
}

/**
 * Overlay muscular do lado ESQUERDO (x < 50); o lado direito é o mesmo path
 * espelhado (matrix -1 0 0 1 100 0) — simetria perfeita sem duplicar paths.
 */
type Overlay = { d: string; key: MuscleKey; opacity?: number };

// ------------------------------ FRENTE ------------------------------
const OVERLAY_FRONT: Overlay[] = [
  // peitoral: dois lobos que descem do ombro ao esterno (par espelhado)
  { d: 'M33.4 40.2 C33 37 34.6 35.2 37.4 34.8 C41.4 34.2 45.2 34.6 47.8 35.4 C48.1 40 48.3 44.6 47.9 48.9 C44.4 50.8 39 50.2 36 48.2 C34 46.8 33.6 43.4 33.4 40.2 Z', key: 'peitoral' },
  // deltóide: gorro arredondado sobre o ombro
  { d: 'M29.4 35.8 C26.4 37.2 24.4 40.2 24.2 43.6 C24.1 46.2 25.8 47.9 28.2 47.6 C30.6 47.2 32.4 45 33 42.4 C33.5 39.9 32.4 37.4 30.6 36 Z', key: 'ombros' },
  // bíceps: fuso no braço
  { d: 'M23.8 49.6 C21.9 55.2 21.7 61.9 23.4 67.7 C24.3 70.4 26.8 70.1 27.7 67.5 C29.4 62.3 29.5 55.4 28.1 50.3 C27.4 48.2 24.9 47.7 23.8 49.6 Z', key: 'biceps' },
  // antebraço
  { d: 'M20.5 72.4 C19.5 78.2 20.3 85 22.7 90.1 C24.4 92 26.9 91.4 27.7 89.3 C26.4 83.9 25.8 77.8 26.1 72.9 C24.6 71.2 22.1 71 20.5 72.4 Z', key: 'antebraco', opacity: 0.8 },
  // abdômen: duas colunas com 2 blocos (metade esquerda; direita espelhada)
  { d: 'M42.4 50.8 C41.5 55.9 41.8 61 43.6 65.4 C45.7 67 47.1 66.5 48.2 65.8 L48.4 50.8 Z', key: 'abdomen', opacity: 0.9 },
  { d: 'M43.2 68.2 C42.5 72.3 43.2 76.3 45.2 79.4 C46.8 80.3 47.8 79.9 48.4 79.2 L48.5 67.6 Z', key: 'abdomen', opacity: 0.65 },
  // oblíquos
  { d: 'M39.8 51.2 C38.4 58.2 38.9 65.6 41.4 71.8 C42.4 73.4 43.8 72.9 44.3 71.4 C42.4 65.4 41.6 58.2 42 51.6 C41.2 50.8 40.3 50.7 39.8 51.2 Z', key: 'abdomen', opacity: 0.45 },
  // quadríceps: gota da coxa afinando no joelho
  { d: 'M33 101.4 C31.6 112.6 32.8 127.8 37 146.4 L44.2 147.6 C43.8 130.4 44.2 114.4 45.4 101.8 C41.2 100.2 36.6 100.2 33 101.4 Z', key: 'quadriceps' },
  // panturrilha (frente, por dentro da canela)
  { d: 'M38.4 153.6 C37 161.4 38 171.4 40.8 181.6 L45.2 182 C44.6 172.4 44.6 162.4 44.8 154.2 Z', key: 'panturrilha' },
];

// ------------------------------ COSTAS ------------------------------
const OVERLAY_BACK: Overlay[] = [
  // trapézio (metade): asa do pescoço até meio das costas
  { d: 'M48.4 30.8 C43.4 33 38.6 36.2 35.8 40 C38 42.6 41.6 44.2 45.6 44.6 L48.2 44 Z', key: 'trapezio' },
  // dorsal: leque largo no sovaco que afila até a cintura
  { d: 'M31 45.4 C30 56 32.4 66.8 38.2 76.8 C41 79.4 44.6 78.8 47 77.2 C46.2 66.6 45.8 55.8 47.2 46 C42.4 43.8 36.4 43.6 31 45.4 Z', key: 'dorsais' },
  // lombar: coluna baixa
  { d: 'M44.6 76.4 C44.2 82.4 44.6 88.6 46.2 93.2 L48.8 93.4 L48.6 75.8 Z', key: 'lombar', opacity: 0.7 },
  { d: 'M45.4 66.4 C45.2 70 45.4 73.6 46.2 76.2 L48.6 76 L48.4 66.2 Z', key: 'lombar', opacity: 0.45 },
  // tríceps: fuso na parte de trás do braço
  { d: 'M23.6 50 C22 55.8 22.4 62.8 24.4 68.2 C25.6 70.4 28 69.8 28.8 67.4 C30 62.2 29.8 55.2 28.4 50.4 C27.4 48.6 24.8 48.9 23.6 50 Z', key: 'triceps' },
  // antebraço (mesma posição do lado de trás)
  { d: 'M20.5 72.4 C19.5 78.2 20.3 85 22.7 90.1 C24.4 92 26.9 91.4 27.7 89.3 C26.4 83.9 25.8 77.8 26.1 72.9 C24.6 71.2 22.1 71 20.5 72.4 Z', key: 'antebraco', opacity: 0.8 },
  // glúteo: lóbulo redondo
  { d: 'M33 95.4 C31.4 101 33.4 106.2 38.2 108.6 C41.4 110.1 45 108.4 46.2 105.4 C45.4 101.6 43.6 98 41.2 95.6 C38.4 94.8 35.2 94.8 33 95.4 Z', key: 'gluteos' },
  // posterior de coxa
  { d: 'M33.8 101 C32.4 112.4 34 128.4 38 146.6 L44.8 147.4 C44 130.4 44 114.4 44.8 102 C41.2 100.6 37.2 100.4 33.8 101 Z', key: 'posterior' },
  // panturrilha (costas, gêmeos)
  { d: 'M38 150.8 C36.2 158.4 37.8 168.8 40.8 179.6 L45.4 179.8 C45 170.4 45 160.4 45.2 151 Z', key: 'panturrilha' },
];

// Silhueta com curvas Bézier — sem placas retas (era isso que dava cara de robô).
const SILHOUETTE = {
  front: {
    torso: 'M44 28.6 C40 29.8 35.8 32 32.8 35.2 C29.6 38.6 28.4 43.6 28.8 49 C29.6 63 30.2 79 30.8 91 C31 96.6 33.2 100.8 36.6 102.4 C41.4 104.6 58.6 104.6 63.4 102.4 C66.8 100.8 69 96.6 69.2 91 C69.8 79 70.4 63 71.2 49 C71.6 43.6 70.4 38.6 67.2 35.2 C64.2 32 60 29.8 56 28.6 C52 30.2 48 30.2 44 28.6 Z',
    arm: 'M31.2 36 C27.8 37.8 25 41.4 23.4 46.2 C21.6 53.4 20.6 62.2 20.4 71 C20.2 80 21 88.2 23 93.8 C23.8 95.8 26.4 95.8 27.4 94 C28.6 85.6 29 76 28.2 66.4 C27.4 56.6 25.6 45.8 31.2 36 Z',
    leg: 'M31 100.4 C30.4 111 31.4 122 33.6 132 C34 144.6 35 156.6 36.4 169 C37.2 178.6 38.2 187.6 40 195.4 C40.6 200.2 44 202.2 46.6 201.4 C48.2 200.4 48.4 193.8 47.8 186.4 C47.2 176.6 45.8 164.6 44.8 152.6 C43.6 134.6 43 112 43.2 101 Z',
  },
};

/** Corpo INTEIRO (silhueta) com metade esquerda + espelho — silhueta é o mesmo nos dois lados. */
const BodySilhouette: React.FC<{ color: string; edge: string }> = ({ color, edge }) => {
  const parts = [SILHOUETTE.front.torso, SILHOUETTE.front.arm, SILHOUETTE.front.leg];
  const mirror = (d: string) => (
    <path key={d.slice(0, 24) + 'm'} d={d} transform="matrix(-1 0 0 1 100 0)" />
  );
  return (
    <g fill={color} stroke={edge} strokeWidth="1" strokeLinejoin="round">
      {/* cabeça */}
      <circle cx="50" cy="14" r="9.5" />
      {/* pescoço */}
      <rect x="45.6" y="21.4" width="8.8" height="8.4" rx="3" />
      {parts.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
      {parts.map(mirror)}
    </g>
  );
};

const MirroredOverlays: React.FC<{ overlays: Overlay[]; fill: (k: MuscleKey) => string; edge: ActiveEdge }> = ({ overlays, fill, edge }) => (
  <g strokeLinejoin="round">
    {overlays.map((o, i) => (
      <React.Fragment key={o.key + i}>
        <path d={o.d} fill={fill(o.key)} opacity={o.opacity} />
        <path
          key={i}
          d={o.d}
          fill={fill(o.key)}
          opacity={o.opacity}
          transform="matrix(-1 0 0 1 100 0)"
          stroke={fill(o.key) === edge.active ? edge.color : undefined}
          strokeWidth="0.6"
        />
      </React.Fragment>
    ))}
  </g>
);

type ActiveEdge = { active: string; color: string };

export const MuscleMap: React.FC<MuscleMapProps> = ({
  muscles,
  volumes,
  className = '',
  showLegend = true,
  tone = 'dark',
}) => {
  const active = new Set<MuscleKey>();
  muscles.forEach((m) => {
    const key = normalize(m);
    if (key) active.add(key);
  });

  const onLime = tone === 'onLime';
  const BODY = onLime ? 'rgba(8,10,6,0.16)' : '#1c2417';
  const BODY_EDGE = onLime ? 'rgba(8,10,6,0.28)' : '#2d3626';
  const ACTIVE = onLime ? '#080a06' : '#b8f63f';
  const PLANNED = onLime ? 'rgba(8,10,6,0.34)' : '#3a4a2b';
  const IDLE = onLime ? 'rgba(8,10,6,0.26)' : '#242d1d';

  const fill = (key: MuscleKey) =>
    active.has(key) ? ACTIVE : volumes && (volumes[key] || 0) > 0 ? PLANNED : IDLE;

  const list = Array.from(active).map((key) => ({
    key,
    label: GROUPS[key],
    volume: volumes?.[key],
  }));

  const edge: ActiveEdge = { active: ACTIVE, color: 'rgba(11,13,8,0.5)' };

  return (
    <div className={className}>
      <div className="flex items-start justify-center gap-5 sm:gap-8">
        <figure className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 100 210" className="h-[168px] w-auto" role="img" aria-label="Frente do corpo com músculos treinados em verde">
            <BodySilhouette color={BODY} edge={BODY_EDGE} />
            {/* separações suaves: ombro→peito e coxas */}
            <MirroredOverlays overlays={OVERLAY_FRONT} fill={fill} edge={edge} />
          </svg>
          <figcaption className={`text-[12.5px] font-medium ${onLime ? 'text-lime-ink/60' : 'text-muted'}`}>Frente</figcaption>
        </figure>

        <figure className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 100 210" className="h-[168px] w-auto" role="img" aria-label="Costas do corpo com músculos treinados em verde">
            <BodySilhouette color={BODY} edge={BODY_EDGE} />
            <MirroredOverlays overlays={OVERLAY_BACK} fill={fill} edge={edge} />
          </svg>
          <figcaption className={`text-[12.5px] font-medium ${onLime ? 'text-lime-ink/60' : 'text-muted'}`}>Costas</figcaption>
        </figure>
      </div>

      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
          <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <span className="h-2 w-2 rounded-full bg-lime" /> treinado
          </span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <span className="h-2 w-2 rounded-full bg-[#3a4a2b]" /> no plano
          </span>
          {list.length > 0 && (
            <span className="text-[12.5px] text-strong">{list.map((m) => m.label).join(' · ')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const muscleLabel = (raw: string) => {
  const k = normalize(raw);
  return k ? GROUPS[k] : raw;
};
