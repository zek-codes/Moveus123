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
    <div className={`${c.bg} rounded-2xl p-6 flex items-start gap-4`}>
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${c.value}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
