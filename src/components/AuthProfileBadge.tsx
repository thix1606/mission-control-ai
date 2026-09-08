// ============================================================
// COMPONENTE — BADGE DE PERFIL DE AUTH PINADO
// ============================================================
// Mostra o perfil de credencial pinado no ref do modelo do agente
// (ex: "@anthropic:default"). O OpenClaw usa esse sufixo como escolha
// explícita de credencial, necessário para assinaturas (token/oauth)
// executadas via Claude CLI. O Mission Control preserva o sufixo ao
// trocar o modelo; este badge deixa isso visível.
// ============================================================

import { KeyRound } from 'lucide-react';

interface Props {
  authProfile?: string | null;
  className?: string;
}

export function AuthProfileBadge({ authProfile, className = '' }: Props) {
  if (!authProfile) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
      title={`Perfil de credencial pinado no modelo (@${authProfile}). Preservado automaticamente ao trocar o modelo.`}
    >
      <KeyRound className="w-2.5 h-2.5" />
      @{authProfile}
    </span>
  );
}
