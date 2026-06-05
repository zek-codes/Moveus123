import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Wrench,
  TruckIcon,
  Menu,
  X,
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
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (pageId: PageId) => {
    onNavigate(pageId);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">Moveus v1.0</p>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
