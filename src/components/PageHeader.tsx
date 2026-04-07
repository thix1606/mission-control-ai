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
    <div className="flex items-center gap-4 mb-8">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-600/30">
        <span className="text-indigo-400">{icon}</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}
