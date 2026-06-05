interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
