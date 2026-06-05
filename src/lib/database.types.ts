export interface Database {
  public: {
    Tables: {
      cars: {
        Row: Car;
        Insert: Omit<Car, 'id' | 'created_at'>;
        Update: Partial<Omit<Car, 'id' | 'created_at'>>;
      };
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'id' | 'created_at' | 'total_debt'>;
        Update: Partial<Omit<Driver, 'id' | 'created_at'>>;
      };
      shift_logs: {
        Row: ShiftLog;
        Insert: Omit<ShiftLog, 'id' | 'created_at' | 'tithe'>;
        Update: Partial<Omit<ShiftLog, 'id' | 'created_at' | 'tithe'>>;
      };
      mileage_logs: {
        Row: MileageLog;
        Insert: Omit<MileageLog, 'id' | 'created_at' | 'fuel_required_litres'>;
        Update: Partial<Omit<MileageLog, 'id' | 'created_at' | 'fuel_required_litres'>>;
      };
      maintenance_logs: {
        Row: MaintenanceLog;
        Insert: Omit<MaintenanceLog, 'id' | 'created_at'>;
        Update: Partial<Omit<MaintenanceLog, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Car {
  id: string;
  name: string;
  number_plate: string;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  phone_number: string;
  car_id: string | null;
  total_debt: number;
  created_at: string;
  cars?: Car;
}

export interface ShiftLog {
  id: string;
  driver_id: string;
  amount_cashed_in: number;
  amount_owing: number;
  fuel_costs: number;
  tithe: number;
  shift_date: string;
  created_at: string;
  drivers?: Driver;
}

export interface MileageLog {
  id: string;
  driver_id: string;
  car_id: string;
  mileage_km: number;
  fuel_required_litres: number;
  week_start: string;
  created_at: string;
  drivers?: Driver;
  cars?: Car;
}

export interface MaintenanceLog {
  id: string;
  car_id: string;
  service_type: string;
  cost: number;
  service_date: string;
  odometer_at_service: number;
  next_service_km: number;
  is_paid: boolean;
  notes: string;
  created_at: string;
  cars?: Car;
}
