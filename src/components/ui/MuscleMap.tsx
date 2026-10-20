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
  if (t.includes('dorsal') || t.includes('costas') || t.includes('latiss')) return 'dorsais';
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

  return (
    <div className={className}>
      <div className="flex items-start justify-center gap-5 sm:gap-8">
        <figure className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 100 210" className="h-[168px] w-auto" role="img" aria-label="Frente do corpo com músculos treinados em verde">
            {/* cabeça e pescoço */}
            <circle cx="50" cy="15" r="9.5" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M45 23h10v7H45z" fill={BODY} />
            {/* tronco */}
            <path
              d="M38 29c-5 1-9 3-11 7l-3 12 6 2 2-6v20c0 9 2 18 5 24l4 8h18l4-8c3-6 5-15 5-24V50l2 6 6-2-3-12c-2-4-6-6-11-7l-9 3-9-3Z"
              fill={BODY}
              stroke={BODY_EDGE}
              strokeWidth="1"
            />
            {/* braços */}
            <path d="M23 36c-4 2-6 6-7 11l-3 22 5 1 4-21 4-10-3-3Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M77 36c4 2 6 6 7 11l3 22-5 1-4-21-4-10 3-3Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M17 71l-3 24 6 1 4-24-7-1Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M83 71l3 24-6 1-4-24 7-1Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            {/* pernas */}
            <path d="M35 96c-1 8-1 16 0 24l3 32 2 26h9l2-30 2-24 2 24 2 30h9l2-26 3-32c1-8 1-16 0-24H35Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />

            {/* músculos */}
            <path d="M38 38c0-3 2-5 5-5h5v12h-6c-2 0-4-2-4-4v-3Z" fill={fill('peitoral')} />
            <path d="M62 38c0-3-2-5-5-5h-5v12h6c2 0 4-2 4-4v-3Z" fill={fill('peitoral')} />
            <circle cx="27" cy="40" r="5.5" fill={fill('ombros')} />
            <circle cx="73" cy="40" r="5.5" fill={fill('ombros')} />
            <path d="M22 47c-2 5-2 12-1 18l4-1 2-14-5-3Z" fill={fill('biceps')} />
            <path d="M78 47c2 5 2 12 1 18l-4-1-2-14 5-3Z" fill={fill('biceps')} />
            <path d="M41 52h18v13H41z" fill={fill('abdomen')} opacity="0.92" />
            <path d="M43 66h14v14H43z" fill={fill('abdomen')} opacity="0.7" />
            <path d="M39 51c-1 7-1 14 0 20l3 12h3V51h-6Z" fill={fill('abdomen')} opacity="0.45" />
            <path d="M61 51c1 7 1 14 0 20l-3 12h-3V51h6Z" fill={fill('abdomen')} opacity="0.45" />
            <path d="M37 98c-1 10 0 21 2 31l4 20 4-1-2-21 1-29H37Z" fill={fill('quadriceps')} />
            <path d="M63 98c1 10 0 21-2 31l-4 20-4-1 2-21-1-29h9Z" fill={fill('quadriceps')} />
            <path d="M39 154l3 20 1 12 5-1-2-31h-7Z" fill={fill('panturrilha')} />
            <path d="M61 154l-3 20-1 12-5-1 2-31h7Z" fill={fill('panturrilha')} />
            <path d="M18 76l-2 12 4 1 3-12-5-1Z" fill={fill('antebraco')} opacity="0.8" />
            <path d="M82 76l2 12-4 1-3-12 5-1Z" fill={fill('antebraco')} opacity="0.8" />
          </svg>
          <figcaption className={`text-[12.5px] font-medium ${onLime ? 'text-lime-ink/60' : 'text-muted'}`}>Frente</figcaption>
        </figure>

        <figure className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 100 210" className="h-[168px] w-auto" role="img" aria-label="Costas do corpo com músculos treinados em verde">
            <circle cx="50" cy="15" r="9.5" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M45 23h10v7H45z" fill={BODY} />
            <path
              d="M38 29c-5 1-9 3-11 7l-3 12 6 2 2-6v20c0 9 2 18 5 24l4 8h18l4-8c3-6 5-15 5-24V50l2 6 6-2-3-12c-2-4-6-6-11-7l-9 3-9-3Z"
              fill={BODY}
              stroke={BODY_EDGE}
              strokeWidth="1"
            />
            <path d="M23 36c-4 2-6 6-7 11l-3 22 5 1 4-21 4-10-3-3Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M77 36c4 2 6 6 7 11l3 22-5 1-4-21-4-10 3-3Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M17 71l-3 24 6 1 4-24-7-1Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M83 71l3 24-6 1-4-24 7-1Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />
            <path d="M35 96c-1 8-1 16 0 24l3 32 2 26h9l2-30 2-24 2 24 2 30h9l2-26 3-32c1-8 1-16 0-24H35Z" fill={BODY} stroke={BODY_EDGE} strokeWidth="1" />

            <path d="M36 33h28v9H36z" fill={fill('trapezio')} />
            <path d="M38 42c-2 6-2 12-1 17l6-2V42h-5Z" fill={fill('dorsais')} />
            <path d="M62 42c2 6 2 12 1 17l-6-2V42h5Z" fill={fill('dorsais')} />
            <path d="M45 43h10v18H45z" fill={fill('lombar')} opacity="0.7" />
            <path d="M44 63h12v10H44z" fill={fill('lombar')} />
            <circle cx="27" cy="40" r="5.5" fill={fill('ombros')} opacity="0.75" />
            <circle cx="73" cy="40" r="5.5" fill={fill('ombros')} opacity="0.75" />
            <path d="M22 47c-2 5-2 12-1 18l4-1 2-14-5-3Z" fill={fill('triceps')} />
            <path d="M78 47c2 5 2 12 1 18l-4-1-2-14 5-3Z" fill={fill('triceps')} />
            <path d="M37 96c-1 3-1 7 1 10l6 2h6l2-12H37Z" fill={fill('gluteos')} />
            <path d="M63 96c1 3 1 7-1 10l-6 2h-6l-2-12h15Z" fill={fill('gluteos')} />
            <path d="M38 108c-1 9 0 18 2 26l4 15 4-1-2-18 1-22H38Z" fill={fill('posterior')} />
            <path d="M62 108c1 9 0 18-2 26l-4 15-4-1 2-18-1-22h9Z" fill={fill('posterior')} />
            <path d="M40 152l2 18 1 16 5-1-2-33h-6Z" fill={fill('panturrilha')} />
            <path d="M60 152l-2 18-1 16-5-1 2-33h6Z" fill={fill('panturrilha')} />
            <path d="M18 76l-2 12 4 1 3-12-5-1Z" fill={fill('antebraco')} opacity="0.8" />
            <path d="M82 76l2 12-4 1-3-12 5-1Z" fill={fill('antebraco')} opacity="0.8" />
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

export const muscleLabel = (raw: string) => normalize(raw) ? GROUPS[normalize(raw) as MuscleKey] : raw;
