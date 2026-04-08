// ============================================================
// COMPONENTE — CABEÇALHO DE PÁGINA
// ============================================================

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
      <div className="flex items-center justify-center w-9 h-9 md:w-12 md:h-12 rounded-xl bg-indigo-600/20 border border-indigo-600/30 shrink-0">
        <span className="text-indigo-400 scale-75 md:scale-100">{icon}</span>
      </div>
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
        <p className="text-xs md:text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}
