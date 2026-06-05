import { useEffect, useState } from 'react';
import { CarFront, Trash2, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Car } from '../lib/database.types';
import PageHeader from '../components/PageHeader';

const empty = { name: '', number_plate: '' };

export default function AddCar() {
  const [cars, setCars] = useState<Car[]>([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase.from('cars').select('*').order('created_at', { ascending: false });
    setCars(data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.number_plate.trim()) {
      setError('Car name and number plate are required.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('cars').insert({
      name: form.name.trim(),
      number_plate: form.number_plate.trim().toUpperCase(),
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(empty);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this car from the fleet? Any linked driver assignments will be cleared.')) return;
    await supabase.from('cars').delete().eq('id', id);
    load();
  }

  return (
    <div>
      <PageHeader title="Fleet Cars" subtitle="Register and manage all vehicles in the fleet" />

      {/* Add Car Form */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-4 sm:mb-5 flex items-center gap-2">
          <CarFront size={18} className="text-blue-600 flex-shrink-0" /> Add New Vehicle
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Car Name / Model</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Toyota Corolla"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Number Plate</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="CA 123-456"
              value={form.number_plate}
              onChange={(e) => setForm({ ...form, number_plate: e.target.value })}
            />
          </div>
          <div className="flex flex-col justify-end">
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors w-full sm:w-auto"
            >
              {saving ? 'Saving...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>

      {/* Cars Grid */}
      {cars.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm text-center py-12 sm:py-16">
          <CarFront size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-400">No vehicles in the fleet yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col gap-3 group relative hover:shadow-md transition-shadow"
            >
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
                <CarFront size={20} className="sm:block text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{car.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                  <Hash size={11} /> {car.number_plate}
                </p>
              </div>
              <p className="text-xs text-gray-300">Added {new Date(car.created_at).toLocaleDateString()}</p>
              <button
                onClick={() => handleDelete(car.id)}
                className="absolute top-4 right-4 opacity-0 sm:opacity-100 sm:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                title="Remove vehicle"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
