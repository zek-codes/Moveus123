import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Wrench,
  TruckIcon,
} from 'lucide-react';

export type PageId = 'dashboard' | 'drivers' | 'cars' | 'shift-log' | 'maintenance';

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'drivers', label: 'Manage Drivers', icon: Users },
  { id: 'cars', label: 'Fleet Cars', icon: Car },
  { id: 'shift-log', label: 'New Shift Log', icon: ClipboardList },
  { id: 'maintenance', label: 'Info & Maintenance', icon: Wrench },
];

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <TruckIcon size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-lg leading-none tracking-wide">Moveus</p>
          <p className="text-xs text-gray-400 mt-0.5">Drive Operations</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">Moveus v1.0</p>
      </div>
    </aside>
  );
}
