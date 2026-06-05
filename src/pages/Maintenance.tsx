import { useEffect, useState } from 'react';
import {
  Wrench, Gauge, Droplets, AlertTriangle, CheckCircle, PlusCircle, Car, DollarSign,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Driver, Car as CarType, MileageLog, MaintenanceLog } from '../lib/database.types';
import PageHeader from '../components/PageHeader';

const FUEL_EFFICIENCY = 8.5; // litres per 100 km
const SERVICE_INTERVAL = 10000; // km between services

function fmt(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const emptyMileage = { driver_id: '', car_id: '', mileage_km: '', week_start: new Date().toISOString().split('T')[0] };
const emptyMaint = {
  car_id: '',
  service_type: '',
  cost: '',
  service_date: new Date().toISOString().split('T')[0],
  odometer_at_service: '',
  next_service_km: '',
  is_paid: false,
  notes: '',
};

export default function Maintenance() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [mileageLogs, setMileageLogs] = useState<(MileageLog & { drivers?: { name: string }; cars?: { name: string; number_plate: string } })[]>([]);
  const [maintLogs, setMaintLogs] = useState<(MaintenanceLog & { cars?: { name: string; number_plate: string } })[]>([]);
  const [mileageForm, setMileageForm] = useState(emptyMileage);
  const [maintForm, setMaintForm] = useState(emptyMaint);
  const [savingMileage, setSavingMileage] = useState(false);
  const [savingMaint, setSavingMaint] = useState(false);
  const [mileageErr, setMileageErr] = useState('');
  const [maintErr, setMaintErr] = useState('');

  async function load() {
    const [d, c, ml, sl] = await Promise.all([
      supabase.from('drivers').select('*').order('name'),
      supabase.from('cars').select('*').order('name'),
      supabase.from('mileage_logs').select('*, drivers(name), cars(name, number_plate)').order('created_at', { ascending: false }).limit(15),
      supabase.from('maintenance_logs').select('*, cars(name, number_plate)').order('service_date', { ascending: false }),
    ]);
    setDrivers(d.data ?? []);
    setCars(c.data ?? []);
    setMileageLogs(ml.data ?? []);
    setMaintLogs(sl.data ?? []);
  }

  useEffect(() => { load(); }, []);

  const mileageKm = parseFloat(mileageForm.mileage_km) || 0;
  const fuelPreview = Math.round((mileageKm / 100) * FUEL_EFFICIENCY * 100) / 100;

  async function handleMileageSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMileageErr('');
    if (!mileageForm.driver_id || !mileageForm.car_id) { setMileageErr('Driver and car are required.'); return; }
    if (mileageKm <= 0) { setMileageErr('Enter a valid mileage.'); return; }
    setSavingMileage(true);
    const { error } = await supabase.from('mileage_logs').insert({
      driver_id: mileageForm.driver_id,
      car_id: mileageForm.car_id,
      mileage_km: mileageKm,
      week_start: mileageForm.week_start,
    });
    setSavingMileage(false);
    if (error) { setMileageErr(error.message); return; }
    setMileageForm(emptyMileage);
    load();
  }

  async function handleMaintSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMaintErr('');
    if (!maintForm.car_id || !maintForm.service_type.trim()) { setMaintErr('Car and service type are required.'); return; }
    setSavingMaint(true);
    const { error } = await supabase.from('maintenance_logs').insert({
      car_id: maintForm.car_id,
      service_type: maintForm.service_type.trim(),
      cost: parseFloat(maintForm.cost) || 0,
      service_date: maintForm.service_date,
      odometer_at_service: parseFloat(maintForm.odometer_at_service) || 0,
      next_service_km: parseFloat(maintForm.next_service_km) || 0,
      is_paid: maintForm.is_paid,
      notes: maintForm.notes.trim(),
    });
    setSavingMaint(false);
    if (error) { setMaintErr(error.message); return; }
    setMaintForm(emptyMaint);
    load();
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('maintenance_logs').update({ is_paid: !current }).eq('id', id);
    load();
  }

  // Determine service alerts: logs where current mileage is within 500 km of next_service_km
  // We find the latest mileage per car and compare with maintenance next_service_km
  const latestMileagePerCar: Record<string, number> = {};
  mileageLogs.forEach((ml) => {
    if (!latestMileagePerCar[ml.car_id] || ml.mileage_km > latestMileagePerCar[ml.car_id]) {
      latestMileagePerCar[ml.car_id] = Number(ml.mileage_km);
    }
  });

  const serviceAlerts = maintLogs.filter((m) => {
    const current = latestMileagePerCar[m.car_id] ?? 0;
    const remaining = Number(m.next_service_km) - current;
    return Number(m.next_service_km) > 0 && remaining <= SERVICE_INTERVAL * 0.1 && remaining >= 0;
  });

  const unpaidDebt = maintLogs.filter((m) => !m.is_paid);
  const totalUnpaid = unpaidDebt.reduce((s, m) => s + Number(m.cost), 0);

  return (
    <div>
      <PageHeader title="Info & Maintenance" subtitle="Track mileage, fuel, and fleet service records" />

      {/* Alerts bar */}
      {(serviceAlerts.length > 0 || unpaidDebt.length > 0) && (
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
          {serviceAlerts.map((m) => {
            const current = latestMileagePerCar[m.car_id] ?? 0;
            const remaining = Number(m.next_service_km) - current;
            return (
              <div key={m.id} className="flex items-start gap-2 sm:gap-3 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2.5 sm:py-3.5">
                <AlertTriangle size={16} className="sm:text-lg text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 truncate">Service Due — {(m as any).cars?.name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">{m.service_type} — {remaining.toLocaleString()} km remaining</p>
                </div>
              </div>
            );
          })}
          {unpaidDebt.length > 0 && (
            <div className="flex items-start gap-2 sm:gap-3 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2.5 sm:py-3.5">
              <AlertTriangle size={16} className="sm:text-lg text-red-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-red-800">Unpaid Service Debt — {fmt(totalUnpaid)}</p>
                <p className="text-xs text-red-600">{unpaidDebt.length} unpaid record{unpaidDebt.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Mileage Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2">
            <Gauge size={18} className="text-blue-600 flex-shrink-0" /> Log Weekly Mileage
          </h2>
          <form onSubmit={handleMileageSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Driver</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={mileageForm.driver_id}
                  onChange={(e) => setMileageForm({ ...mileageForm, driver_id: e.target.value })}
                >
                  <option value="">— Driver —</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Car</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={mileageForm.car_id}
                  onChange={(e) => setMileageForm({ ...mileageForm, car_id: e.target.value })}
                >
                  <option value="">— Car —</option>
                  {cars.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.number_plate})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Weekly Mileage (km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="450"
                  value={mileageForm.mileage_km}
                  onChange={(e) => setMileageForm({ ...mileageForm, mileage_km: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Week Start</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={mileageForm.week_start}
                  onChange={(e) => setMileageForm({ ...mileageForm, week_start: e.target.value })}
                />
              </div>
            </div>
            {mileageKm > 0 && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 flex items-center gap-3">
                <Droplets size={16} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-blue-700 font-medium">Fuel Est. @ {FUEL_EFFICIENCY}L/100km</p>
                  <p className="text-base sm:text-lg font-bold text-blue-600">{fuelPreview}L</p>
                </div>
              </div>
            )}
            {mileageErr && <p className="text-xs text-red-500">{mileageErr}</p>}
            <button
              type="submit"
              disabled={savingMileage}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {savingMileage ? 'Saving...' : 'Log Mileage'}
            </button>
          </form>
        </div>

        {/* Maintenance Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2">
            <Wrench size={18} className="text-amber-500 flex-shrink-0" /> Log Service Record
          </h2>
          <form onSubmit={handleMaintSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Car</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={maintForm.car_id}
                  onChange={(e) => setMaintForm({ ...maintForm, car_id: e.target.value })}
                >
                  <option value="">— Select car —</option>
                  {cars.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.number_plate})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Service Type</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Oil Change"
                  value={maintForm.service_type}
                  onChange={(e) => setMaintForm({ ...maintForm, service_type: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><DollarSign size={11} /> Cost</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  value={maintForm.cost}
                  onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Service Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={maintForm.service_date}
                  onChange={(e) => setMaintForm({ ...maintForm, service_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Odometer (km)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="85000"
                  value={maintForm.odometer_at_service}
                  onChange={(e) => setMaintForm({ ...maintForm, odometer_at_service: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Next Service (km)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="95000"
                  value={maintForm.next_service_km}
                  onChange={(e) => setMaintForm({ ...maintForm, next_service_km: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes..."
                value={maintForm.notes}
                onChange={(e) => setMaintForm({ ...maintForm, notes: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600"
                checked={maintForm.is_paid}
                onChange={(e) => setMaintForm({ ...maintForm, is_paid: e.target.checked })}
              />
              <span className="text-xs text-gray-600">Mark as paid</span>
            </label>
            {maintErr && <p className="text-xs text-red-500">{maintErr}</p>}
            <button
              type="submit"
              disabled={savingMaint}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {savingMaint ? 'Saving...' : 'Log Service Record'}
            </button>
          </form>
        </div>
      </div>

      {/* Mileage Log Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4 sm:mb-6">
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <Gauge size={16} className="text-blue-600 flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-800">Weekly Mileage Logs</h2>
        </div>
        {mileageLogs.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-400 text-center py-8 sm:py-10">No mileage logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-left">Week Start</th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 text-left">Driver</th>
                  <th className="hidden md:table-cell px-3 sm:px-5 py-2 sm:py-3 text-left">Car</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-right">Mileage</th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 text-right">Fuel (L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mileageLogs.map((ml) => (
                  <tr key={ml.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-gray-500 text-xs">{ml.week_start}</td>
                    <td className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">{(ml as any).drivers?.name ?? '—'}</td>
                    <td className="hidden md:table-cell px-3 sm:px-5 py-2 sm:py-3 text-gray-500 text-xs truncate">{(ml as any).cars?.name}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-right font-semibold text-gray-800 text-xs sm:text-sm">{Number(ml.mileage_km).toLocaleString()}</td>
                    <td className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 text-right text-blue-600 font-semibold">{Number(ml.fuel_required_litres).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Log Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
          <Wrench size={16} className="text-amber-500 flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-800">Service History</h2>
        </div>
        {maintLogs.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-400 text-center py-8 sm:py-10">No service records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-left">Date</th>
                  <th className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 text-left">Car</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-left">Service</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-right">Cost</th>
                  <th className="hidden lg:table-cell px-3 sm:px-5 py-2 sm:py-3 text-right">Next (km)</th>
                  <th className="px-3 sm:px-5 py-2 sm:py-3 text-center w-8">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {maintLogs.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-gray-500 text-xs">{m.service_date}</td>
                    <td className="hidden sm:table-cell px-3 sm:px-5 py-2 sm:py-3 font-medium text-gray-900 text-xs sm:text-sm">
                      {(m as any).cars?.name}
                    </td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm truncate">{m.service_type}</td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-right font-semibold text-gray-800 text-xs sm:text-sm whitespace-nowrap">{fmt(Number(m.cost))}</td>
                    <td className="hidden lg:table-cell px-3 sm:px-5 py-2 sm:py-3 text-right text-gray-500 text-xs">
                      {Number(m.next_service_km) > 0 ? Number(m.next_service_km).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 sm:px-5 py-2 sm:py-3 text-center">
                      <button
                        onClick={() => togglePaid(m.id, m.is_paid)}
                        className="transition-colors flex-shrink-0"
                        title={m.is_paid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {m.is_paid
                          ? <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                          : <AlertTriangle size={16} className="text-red-400 mx-auto" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
