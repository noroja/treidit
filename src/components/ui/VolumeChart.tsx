import React, { useState } from 'react';

export interface ChartPoint {
  label: string;
  value: number;
}

interface VolumeChartProps {
  data: ChartPoint[];
  unit?: string;
  className?: string;
}

const format = (value: number) =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/**
 * Área de uma série única em verde-limão. Sem gradiente: preenchimento chapado
 * a 12%, linha de 2px, pontos só na interação e no último valor.
 */
export const VolumeChart: React.FC<VolumeChartProps> = ({ data, unit = 'kg', className = '' }) => {
  const [hovered, setHovered] = useState<number | null>(data.length - 1);

  const W = 720;
  const H = 240;
  const padTop = 44;
  const padBottom = 32;
  const padX = 8;

  if (data.length === 0) {
    return (
      <div className={`flex h-[220px] items-center justify-center rounded-xl bg-base/60 text-[13.5px] text-muted ${className}`}>
        Nenhuma sessão registrada ainda. Seu primeiro treino vira o primeiro ponto.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin || rawMax * 0.12 || 1;
  const min = Math.max(0, rawMin - span * 0.35);
  const max = rawMax + span * 0.2;

  const x = (i: number) => padX + (i / Math.max(1, data.length - 1)) * (W - padX * 2);
  const y = (v: number) => H - padBottom - ((v - min) / (max - min || 1)) * (H - padTop - padBottom);

  const points = data.map((d, i) => ({ ...d, x: x(i), y: y(d.value) }));
  const line = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const area = `${line} L ${points[points.length - 1].x} ${H - padBottom} L ${points[0].x} ${H - padBottom} Z`;

  const active = hovered === null ? points.length - 1 : hovered;
  const activePoint = points[active];
  const tooltipWidth = Math.max(118, `${activePoint.label} · ${format(activePoint.value)} ${unit}`.length * 6.4 + 22);
  const tooltipX = Math.min(W - tooltipWidth - 4, Math.max(4, activePoint.x - tooltipWidth / 2));
  const labelStep = data.length > 8 ? Math.ceil(data.length / 6) : 2;

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[220px] w-full sm:h-[240px]" role="img" aria-label={`Evolução do volume: ${data.length} registros, de ${format(values[0])} a ${format(values[values.length - 1])} quilos`}>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={W - padX}
            y1={padTop + (H - padTop - padBottom) * t}
            y2={padTop + (H - padTop - padBottom) * t}
            stroke="#1e241a"
            strokeWidth="1"
          />
        ))}
        <line x1={padX} x2={W - padX} y1={H - padBottom} y2={H - padBottom} stroke="#2c3426" strokeWidth="1" />

        <path d={area} fill="#b8f63f" fillOpacity="0.12" />
        <path d={line} fill="none" stroke="#b8f63f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {activePoint && (
          <>
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={activePoint.y}
              y2={H - padBottom}
              stroke="#b8f63f"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#b8f63f" stroke="#070806" strokeWidth="2.5" />
            <g>
              <rect
                x={tooltipX}
                y={Math.max(2, activePoint.y - 38)}
                width={tooltipWidth}
                height={26}
                rx="8"
                fill="#151b12"
                stroke="#2c3426"
              />
              <text
                x={tooltipX + tooltipWidth / 2}
                y={Math.max(2, activePoint.y - 38) + 17}
                textAnchor="middle"
                fill="#f5f8ef"
                fontSize="11.5"
                fontWeight="600"
              >
                {activePoint.label} · {format(activePoint.value)} {unit}
              </text>
            </g>
          </>
        )}

        {points.map((p, i) => (
          <g key={`${p.label}-${i}`}>
            {(i % labelStep === 0 || i === points.length - 1) && (
              <text x={p.x} y={H - 9} textAnchor="middle" fill="#6f786a" fontSize="10.5">
                {p.label}
              </text>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r="16"
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              tabIndex={-1}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
