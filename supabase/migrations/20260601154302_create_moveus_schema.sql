/*
  # Moveus Drive Operations Manager — Initial Schema

  ## Overview
  Creates the full data model for the Moveus logistics dashboard.

  ## New Tables

  ### 1. `cars`
  - `id` (uuid, PK)
  - `name` (text) — Car make/model
  - `number_plate` (text, unique) — Vehicle registration plate
  - `created_at` (timestamptz)

  ### 2. `drivers`
  - `id` (uuid, PK)
  - `name` (text)
  - `license_number` (text, unique)
  - `phone_number` (text)
  - `car_id` (uuid, FK → cars.id) — assigned vehicle
  - `total_debt` (numeric) — cumulative amount owing, auto-updated on shift log insert
  - `created_at` (timestamptz)

  ### 3. `shift_logs`
  - `id` (uuid, PK)
  - `driver_id` (uuid, FK → drivers.id)
  - `amount_cashed_in` (numeric)
  - `amount_owing` (numeric)
  - `fuel_costs` (numeric)
  - `tithe` (numeric) — auto-calculated as 10% of amount_cashed_in
  - `shift_date` (date)
  - `created_at` (timestamptz)

  ### 4. `mileage_logs`
  - `id` (uuid, PK)
  - `driver_id` (uuid, FK → drivers.id)
  - `car_id` (uuid, FK → cars.id)
  - `mileage_km` (numeric) — weekly mileage entered
  - `fuel_required_litres` (numeric) — auto-calculated (mileage / 12 L/100km)
  - `week_start` (date)
  - `created_at` (timestamptz)

  ### 5. `maintenance_logs`
  - `id` (uuid, PK)
  - `car_id` (uuid, FK → cars.id)
  - `service_type` (text) — e.g. "Oil Change", "Brake Service"
  - `cost` (numeric)
  - `service_date` (date)
  - `odometer_at_service` (numeric) — km reading at service
  - `next_service_km` (numeric) — trigger next service alert at this km
  - `is_paid` (boolean)
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read/write policies for anon role (single-operator app, no auth required)
*/

-- ─── CARS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cars (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  number_plate  text        UNIQUE NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read cars"
  ON cars FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert cars"
  ON cars FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can update cars"
  ON cars FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete cars"
  ON cars FOR DELETE TO anon USING (true);

-- ─── DRIVERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL,
  license_number  text        UNIQUE NOT NULL,
  phone_number    text        NOT NULL DEFAULT '',
  car_id          uuid        REFERENCES cars(id) ON DELETE SET NULL,
  total_debt      numeric     NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read drivers"
  ON drivers FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert drivers"
  ON drivers FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can update drivers"
  ON drivers FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete drivers"
  ON drivers FOR DELETE TO anon USING (true);

-- ─── SHIFT LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id        uuid        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount_cashed_in numeric     NOT NULL DEFAULT 0,
  amount_owing     numeric     NOT NULL DEFAULT 0,
  fuel_costs       numeric     NOT NULL DEFAULT 0,
  tithe            numeric     GENERATED ALWAYS AS (amount_cashed_in * 0.10) STORED,
  shift_date       date        NOT NULL DEFAULT CURRENT_DATE,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE shift_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read shift_logs"
  ON shift_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert shift_logs"
  ON shift_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can update shift_logs"
  ON shift_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete shift_logs"
  ON shift_logs FOR DELETE TO anon USING (true);

-- Trigger: when a shift log is inserted, add amount_owing to the driver's total_debt
CREATE OR REPLACE FUNCTION increment_driver_debt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET total_debt = total_debt + NEW.amount_owing
  WHERE id = NEW.driver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_driver_debt
  AFTER INSERT ON shift_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_driver_debt();

-- ─── MILEAGE LOGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mileage_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id             uuid        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  car_id                uuid        NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  mileage_km            numeric     NOT NULL DEFAULT 0,
  fuel_required_litres  numeric     GENERATED ALWAYS AS (ROUND((mileage_km / 100.0) * 8.5, 2)) STORED,
  week_start            date        NOT NULL DEFAULT CURRENT_DATE,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read mileage_logs"
  ON mileage_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert mileage_logs"
  ON mileage_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can update mileage_logs"
  ON mileage_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete mileage_logs"
  ON mileage_logs FOR DELETE TO anon USING (true);

-- ─── MAINTENANCE LOGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                uuid        NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  service_type          text        NOT NULL DEFAULT '',
  cost                  numeric     NOT NULL DEFAULT 0,
  service_date          date        NOT NULL DEFAULT CURRENT_DATE,
  odometer_at_service   numeric     NOT NULL DEFAULT 0,
  next_service_km       numeric     NOT NULL DEFAULT 0,
  is_paid               boolean     NOT NULL DEFAULT false,
  notes                 text        NOT NULL DEFAULT '',
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read maintenance_logs"
  ON maintenance_logs FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert maintenance_logs"
  ON maintenance_logs FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can update maintenance_logs"
  ON maintenance_logs FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete maintenance_logs"
  ON maintenance_logs FOR DELETE TO anon USING (true);
