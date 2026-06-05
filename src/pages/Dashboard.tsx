import { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, Wrench, Percent, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ShiftLog, MaintenanceLog } from '../lib/database.types';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';

interface DashboardMetrics {
  totalCashedIn: number;
  totalOwing: number;
  totalMaintenance: number;
  tithe: number;
  recentShifts: (ShiftLog & { drivers?: { name: string } })[];
  unpaidMaintenance: MaintenanceLog[];
}

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCashedIn: 0,
    totalOwing: 0,
    totalMaintenance: 0,
    tithe: 0,
    recentShifts: [],
    unpaidMaintenance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [shiftsRes, maintenanceRes, driversRes] = await Promise.all([
        supabase.from('shift_logs').select('*, drivers(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('maintenance_logs').select('*, cars(name, number_plate)').order('service_date', { ascending: false }),
        supabase.from('drivers').select('total_debt'),
      ]);

      const shifts: (ShiftLog & { drivers?: { name: string } })[] = shiftsRes.data ?? [];
      const maintenance: MaintenanceLog[] = maintenanceRes.data ?? [];

      const totalCashedIn = shifts.reduce((s, r) => s + Number(r.amount_cashed_in), 0);
      const totalOwing = (driversRes.data ?? []).reduce((s, d) => s + Number(d.total_debt), 0);
      const totalMaintenance = maintenance.reduce((s, m) => s + Number(m.cost), 0);
      const tithe = totalCashedIn * 0.1;
      const unpaidMaintenance = maintenance.filter((m) => !m.is_paid);

      setMetrics({ totalCashedIn, totalOwing, totalMaintenance, tithe, recentShifts: shifts, unpaidMaintenance });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Live overview of your fleet operations" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-8 lg:mb-10">
        <StatCard
          label="Total Cashed In"
          value={fmt(metrics.totalCashedIn)}
          icon={DollarSign}
          color="green"
          sub="Across all shifts"
        />
        <StatCard
          label="Total Amount Owing"
          value={fmt(metrics.totalOwing)}
          icon={AlertCircle}
          color="red"
          sub="Cumulative driver debt"
        />
        <StatCard
          label="Total Maintenance Cost"
          value={fmt(metrics.totalMaintenance)}
          icon={Wrench}
          color="amber"
          sub="All fleet services"
        />
        <StatCard
          label="Tithe (10%)"
          value={fmt(metrics.tithe)}
          icon={Percent}
          color="blue"
          sub="10% of total earnings"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Shifts */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <TrendingUp size={18} className="text-blue-600 flex-shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base text-gray-800">Recent Shifts</h2>
          </div>
          {metrics.recentShifts.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400 text-center py-8 sm:py-12">No shift logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {metrics.recentShifts.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                      {(s as any).drivers?.name ?? 'Unknown Driver'}
                    </p>
                    <p className="text-xs text-gray-400">{s.shift_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-emerald-600">{fmt(Number(s.amount_cashed_in))}</p>
                    {Number(s.amount_owing) > 0 && (
                      <p className="text-xs text-red-500">Owing: {fmt(Number(s.amount_owing))}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Maintenance */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <Calendar size={18} className="text-amber-500 flex-shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base text-gray-800">Unpaid Service Debt</h2>
          </div>
          {metrics.unpaidMaintenance.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400 text-center py-8 sm:py-12">No unpaid service records.</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {metrics.unpaidMaintenance.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">{m.service_type}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {(m as any).cars?.name} — {(m as any).cars?.number_plate}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-red-600">{fmt(Number(m.cost))}</p>
                    <p className="text-xs text-gray-400">{m.service_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
