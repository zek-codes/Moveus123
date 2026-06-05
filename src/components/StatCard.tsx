interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'red' | 'amber';
  sub?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-600 text-white',
    value: 'text-blue-700',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-600 text-white',
    value: 'text-emerald-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-600 text-white',
    value: 'text-red-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500 text-white',
    value: 'text-amber-700',
  },
};

export default function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4`}>
      <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className="sm:block" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{label}</p>
        <p className={`text-xl sm:text-2xl font-bold mt-1 ${c.value} truncate`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{sub}</p>}
      </div>
    </div>
  );
}
