import { useEffect, useState } from 'react';
import { ClipboardList, Fuel, DollarSign, AlertTriangle, Percent } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Driver, ShiftLog } from '../lib/database.types';
import PageHeader from '../components/PageHeader';

const emptyForm = {
  driver_id: '',
  amount_cashed_in: '',
  amount_owing: '',
  fuel_costs: '',
  shift_date: new Date().toISOString().split('T')[0],
};

function fmt(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShiftLog() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [recentLogs, setRecentLogs] = useState<(ShiftLog & { drivers?: { name: string } })[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    const [d, l] = await Promise.all([
      supabase.from('drivers').select('*').order('name'),
      supabase
        .from('shift_logs')
        .select('*, drivers(name)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setDrivers(d.data ?? []);
    setRecentLogs(l.data ?? []);
  }

  useEffect(() => { load(); }, []);

  const cashedIn = parseFloat(form.amount_cashed_in) || 0;
  const tithePreview = cashedIn * 0.1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.driver_id) { setError('Please select a driver.'); return; }
    if (cashedIn <= 0) { setError('Amount cashed in must be greater than 0.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('shift_logs').insert({
      driver_id: form.driver_id,
      amount_cashed_in: cashedIn,
      amount_owing: parseFloat(form.amount_owing) || 0,
      fuel_costs: parseFloat(form.fuel_costs) || 0,
      shift_date: form.shift_date,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess('Shift log saved. Driver debt profile updated automatically.');
    setForm({ ...emptyForm, shift_date: form.shift_date });
    load();
  }

  return (
    <div>
      <PageHeader title="New Shift Log" subtitle="Record daily earnings, debt, and fuel per driver" />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-600" /> Log a Shift
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Driver</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.driver_id}
                onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
              >
                <option value="">— Select driver —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Shift Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.shift_date}
                onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <DollarSign size={12} /> Amount Cashed In (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                value={form.amount_cashed_in}
                onChange={(e) => setForm({ ...form, amount_cashed_in: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <AlertTriangle size={12} /> Amount Owing / Debt (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                value={form.amount_owing}
                onChange={(e) => setForm({ ...form, amount_owing: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">This will be added to the driver's total debt profile.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Fuel size={12} /> Fuel Costs (R)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                value={form.fuel_costs}
                onChange={(e) => setForm({ ...form, fuel_costs: e.target.value })}
              />
            </div>

            {/* Tithe Preview */}
            {cashedIn > 0 && (
              <div className="bg-amber-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <Percent size={16} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-700 font-medium">Auto-calculated Tithe (10%)</p>
                  <p className="text-lg font-bold text-amber-600">{fmt(tithePreview)}</p>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Shift Log'}
            </button>
          </form>
        </div>

        {/* Recent Logs */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Shift Logs</h2>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">No logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Driver</th>
                    <th className="px-5 py-3 text-right">Cashed In</th>
                    <th className="px-5 py-3 text-right">Owing</th>
                    <th className="px-5 py-3 text-right">Fuel</th>
                    <th className="px-5 py-3 text-right">Tithe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{log.shift_date}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {(log as any).drivers?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">
                        {fmt(Number(log.amount_cashed_in))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={Number(log.amount_owing) > 0 ? 'text-red-500 font-semibold' : 'text-gray-300'}>
                          {fmt(Number(log.amount_owing))}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {fmt(Number(log.fuel_costs))}
                      </td>
                      <td className="px-5 py-3 text-right text-amber-600 font-semibold">
                        {fmt(Number(log.tithe))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
