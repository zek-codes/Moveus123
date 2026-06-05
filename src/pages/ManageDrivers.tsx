import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Phone, CreditCard, Car } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Driver, Car as CarType } from '../lib/database.types';
import PageHeader from '../components/PageHeader';

const empty = { name: '', license_number: '', phone_number: '', car_id: '' };

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cars, setCars] = useState<CarType[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const [d, c] = await Promise.all([
      supabase.from('drivers').select('*, cars(name, number_plate)').order('created_at', { ascending: false }),
      supabase.from('cars').select('*').order('name'),
    ]);
    setDrivers(d.data ?? []);
    setCars(c.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.license_number.trim() || !form.phone_number.trim()) {
      setError('Name, license number, and phone number are required.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('drivers').insert({
      name: form.name.trim(),
      license_number: form.license_number.trim(),
      phone_number: form.phone_number.trim(),
      car_id: form.car_id || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this driver? Their shift logs will also be deleted.')) return;
    await supabase.from('drivers').delete().eq('id', id);
    load();
  }

  function fmt(n: number) {
    return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div>
      <PageHeader title="Manage Drivers" subtitle="Register drivers and assign fleet vehicles" />

      {/* Add Driver Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-600" /> Add New Driver
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">License Number</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. DL123456"
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 071 000 0000"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Assign Car (optional)</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.car_id}
              onChange={(e) => setForm({ ...form, car_id: e.target.value })}
            >
              <option value="">— No car assigned —</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.number_plate})</option>
              ))}
            </select>
          </div>
          {error && <p className="col-span-full text-xs text-red-500">{error}</p>}
          <div className="col-span-full">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Drivers ({drivers.length})</h2>
        </div>
        {drivers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No drivers registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Driver</th>
                  <th className="px-6 py-3 text-left">License</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Assigned Car</th>
                  <th className="px-6 py-3 text-right">Total Debt</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-1.5"><CreditCard size={13} />{d.license_number}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <span className="flex items-center gap-1.5"><Phone size={13} />{d.phone_number}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {(d as any).cars ? (
                        <span className="flex items-center gap-1.5">
                          <Car size={13} />
                          {(d as any).cars.name} <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{(d as any).cars.number_plate}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">No car</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${Number(d.total_debt) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {fmt(d.total_debt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove driver"
                      >
                        <Trash2 size={16} />
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
