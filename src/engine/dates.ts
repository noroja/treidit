/**
 * DATAS LOCAIS — fonte única para ofensiva, histórico e check-ins.
 * ----------------------------------------------------------------
 * O app roda no fuso do usuário. `new Date().toISOString()` corta o dia em UTC
 * (no Brasil, 21h já vira "amanhã"), então toda data de calendário usada em
 * sequência/streak passa por aqui e é formatada em YYYY-MM-DD LOCAL.
 */

/** Data local no formato YYYY-MM-DD (nunca UTC). */
export function toLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Soma/subtrai dias de uma data ISO local (meio-dia evita DST). */
export function shiftISODate(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

/** Dia da semana 0=domingo … 6=sábado. */
export function isoWeekday(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

/** Rótulo curto em pt-BR (seg, ter, qua…). */
export function shortWeekday(iso: string): string {
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');
}

/** Diferença em dias inteiros entre duas datas ISO locais (b - a). */
export function daysBetweenISO(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`).getTime();
  const db = new Date(`${b}T12:00:00`).getTime();
  return Math.round((db - da) / 86_400_000);
}
