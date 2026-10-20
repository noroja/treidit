import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-panel/80 border border-elevated rounded-xl p-3 text-xs text-muted flex items-start gap-2.5 ">
      <Info className="w-4 h-4 text-lime shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-strong">Aviso Científico & Responsabilidade: </span>
        Os cálculos metabólicos e estimativas de composição corporal são aproximações estatísticas científicas (Mifflin-St Jeor / US Navy) e não constituem diagnósticos clínicos. Modificações dietéticas e de treino devem respeitar sua individualidade biológica.
      </div>
    </div>
  );
};
