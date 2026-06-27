export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid'
export type InteriorClean = 'good' | 'fair' | 'poor'
export type TireStatus = 'normal' | 'wear' | 'replace'
export type IncidentType = 'damage' | 'battery_dead' | 'other'
export type DocType = 'insurance' | 'inspection' | 'tax' | 'license'
export type UserRole = 'admin' | 'field'

// ─────────────────────────────────────────────────────────────
// vehicles
// ─────────────────────────────────────────────────────────────
export interface VehicleRow {
  id: string
  name: string
  plate: string
  fuel_type: FuelType | null
  year: number | null
  capacity: number | null
  current_mileage: number
  insurance_company: string | null
  insurance_policy_no: string | null
  insurance_expire_date: string | null
  last_inspection_date: string | null
  next_inspection_date: string | null
  last_tax_paid_date: string | null
  tax_payment_method: string
  annual_tax_prepaid: boolean
  vin: string | null
  primary_operation_time: string | null
  assigned_field_user_id: string | null
  created_at: string
  updated_at: string
}

export interface VehicleInsert {
  id?: string
  name: string
  plate: string
  fuel_type?: FuelType | null
  year?: number | null
  capacity?: number | null
  current_mileage?: number
  insurance_company?: string | null
  insurance_policy_no?: string | null
  insurance_expire_date?: string | null
  last_inspection_date?: string | null
  next_inspection_date?: string | null
  last_tax_paid_date?: string | null
  tax_payment_method?: string
  annual_tax_prepaid?: boolean
  vin?: string | null
  primary_operation_time?: string | null
  assigned_field_user_id?: string | null
  created_at?: string
  updated_at?: string
}

export type VehicleUpdate = Partial<VehicleInsert>

// ─────────────────────────────────────────────────────────────
// weekly_inspections
// ─────────────────────────────────────────────────────────────
export interface WeeklyInspectionRow {
  id: string
  vehicle_id: string
  week_start: string
  mileage: number
  exterior_ok: boolean
  interior_clean: InteriorClean | null
  car_wash_done: boolean
  lights_ok: boolean
  fluids_ok: boolean
  tire_status: TireStatus | null
  note: string | null
  exterior_photo_url: string | null
  submitted_by: string | null
  submitted_at: string
}

export interface WeeklyInspectionInsert {
  id?: string
  vehicle_id: string
  week_start: string
  mileage: number
  exterior_ok: boolean
  interior_clean?: InteriorClean | null
  car_wash_done?: boolean
  lights_ok: boolean
  fluids_ok: boolean
  tire_status?: TireStatus | null
  note?: string | null
  exterior_photo_url?: string | null
  submitted_by?: string | null
  submitted_at?: string
}

export type WeeklyInspectionUpdate = Partial<WeeklyInspectionInsert>

// ─────────────────────────────────────────────────────────────
// maintenance_records
// ─────────────────────────────────────────────────────────────
export interface MaintenanceRecordRow {
  id: string
  vehicle_id: string
  part_category: string
  part_name: string
  mileage_at_service: number
  service_date: string
  cost: number | null
  receipt_url: string | null
  note: string | null
  registered_by: string | null
  created_at: string
}

export interface MaintenanceRecordInsert {
  id?: string
  vehicle_id: string
  part_category: string
  part_name: string
  mileage_at_service: number
  service_date: string
  cost?: number | null
  receipt_url?: string | null
  note?: string | null
  registered_by?: string | null
  created_at?: string
}

export type MaintenanceRecordUpdate = Partial<MaintenanceRecordInsert>

// ─────────────────────────────────────────────────────────────
// incident_records
// ─────────────────────────────────────────────────────────────
export interface IncidentRecordRow {
  id: string
  vehicle_id: string
  incident_type: IncidentType | null
  photo_url: string | null
  note: string
  registered_by: string | null
  created_at: string
}

export interface IncidentRecordInsert {
  id?: string
  vehicle_id: string
  incident_type?: IncidentType | null
  photo_url?: string | null
  note: string
  registered_by?: string | null
  created_at?: string
}

export type IncidentRecordUpdate = Partial<IncidentRecordInsert>

// ─────────────────────────────────────────────────────────────
// legal_documents
// ─────────────────────────────────────────────────────────────
export interface LegalDocumentRow {
  id: string
  vehicle_id: string
  doc_type: DocType | null
  expire_date: string | null
  photo_url: string | null
  note: string | null
  updated_by: string | null
  updated_at: string
}

export interface LegalDocumentInsert {
  id?: string
  vehicle_id: string
  doc_type?: DocType | null
  expire_date?: string | null
  photo_url?: string | null
  note?: string | null
  updated_by?: string | null
  updated_at?: string
}

export type LegalDocumentUpdate = Partial<LegalDocumentInsert>

// ─────────────────────────────────────────────────────────────
// consumable_defaults
// ─────────────────────────────────────────────────────────────
export interface ConsumableDefaultRow {
  id: string
  part_name: string
  part_category: string
  default_km: number | null
  default_months: number | null
  min_km: number | null
  min_months: number | null
  sort_order: number
  image_url: string | null
}

export interface ConsumableDefaultInsert {
  id?: string
  part_name: string
  part_category: string
  default_km?: number | null
  default_months?: number | null
  min_km?: number | null
  min_months?: number | null
  sort_order?: number
  image_url?: string | null
}

export type ConsumableDefaultUpdate = Partial<ConsumableDefaultInsert>

// ─────────────────────────────────────────────────────────────
// consumable_thresholds
// ─────────────────────────────────────────────────────────────
export interface ConsumableThresholdRow {
  id: string
  vehicle_id: string
  part_name: string
  custom_km: number | null
  custom_months: number | null
  modified_by: string | null
  modified_at: string
}

export interface ConsumableThresholdInsert {
  id?: string
  vehicle_id: string
  part_name: string
  custom_km?: number | null
  custom_months?: number | null
  modified_by?: string | null
  modified_at?: string
}

export type ConsumableThresholdUpdate = Partial<ConsumableThresholdInsert>

// ─────────────────────────────────────────────────────────────
// threshold_change_log
// ─────────────────────────────────────────────────────────────
export interface ThresholdChangeLogRow {
  id: string
  vehicle_id: string | null
  part_name: string | null
  old_km: number | null
  old_months: number | null
  new_km: number | null
  new_months: number | null
  changed_by: string | null
  changed_at: string
}

export interface ThresholdChangeLogInsert {
  id?: string
  vehicle_id?: string | null
  part_name?: string | null
  old_km?: number | null
  old_months?: number | null
  new_km?: number | null
  new_months?: number | null
  changed_by?: string | null
  changed_at?: string
}

export type ThresholdChangeLogUpdate = Partial<ThresholdChangeLogInsert>

// ─────────────────────────────────────────────────────────────
// drivers
// ─────────────────────────────────────────────────────────────
export interface DriverRow {
  id: string
  name: string
  license_type: string | null
  license_expire_date: string | null
  assigned_vehicle_ids: string[] | null
  created_at: string
}

export interface DriverInsert {
  id?: string
  name: string
  license_type?: string | null
  license_expire_date?: string | null
  assigned_vehicle_ids?: string[] | null
  created_at?: string
}

export type DriverUpdate = Partial<DriverInsert>

// ─────────────────────────────────────────────────────────────
// notifications
// ─────────────────────────────────────────────────────────────
export interface NotificationRow {
  id: string
  user_id: string | null
  vehicle_id: string | null
  notif_type: string | null
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface NotificationInsert {
  id?: string
  user_id?: string | null
  vehicle_id?: string | null
  notif_type?: string | null
  title: string
  body: string
  is_read?: boolean
  created_at?: string
}

export type NotificationUpdate = Partial<NotificationInsert>

// ─────────────────────────────────────────────────────────────
// Database 인터페이스 — supabase-js GenericSchema 호환
// ─────────────────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      vehicles: {
        Row: VehicleRow
        Insert: VehicleInsert
        Update: VehicleUpdate
        Relationships: []
      }
      weekly_inspections: {
        Row: WeeklyInspectionRow
        Insert: WeeklyInspectionInsert
        Update: WeeklyInspectionUpdate
        Relationships: []
      }
      maintenance_records: {
        Row: MaintenanceRecordRow
        Insert: MaintenanceRecordInsert
        Update: MaintenanceRecordUpdate
        Relationships: []
      }
      incident_records: {
        Row: IncidentRecordRow
        Insert: IncidentRecordInsert
        Update: IncidentRecordUpdate
        Relationships: []
      }
      legal_documents: {
        Row: LegalDocumentRow
        Insert: LegalDocumentInsert
        Update: LegalDocumentUpdate
        Relationships: []
      }
      consumable_defaults: {
        Row: ConsumableDefaultRow
        Insert: ConsumableDefaultInsert
        Update: ConsumableDefaultUpdate
        Relationships: []
      }
      consumable_thresholds: {
        Row: ConsumableThresholdRow
        Insert: ConsumableThresholdInsert
        Update: ConsumableThresholdUpdate
        Relationships: []
      }
      threshold_change_log: {
        Row: ThresholdChangeLogRow
        Insert: ThresholdChangeLogInsert
        Update: ThresholdChangeLogUpdate
        Relationships: []
      }
      drivers: {
        Row: DriverRow
        Insert: DriverInsert
        Update: DriverUpdate
        Relationships: []
      }
      notifications: {
        Row: NotificationRow
        Insert: NotificationInsert
        Update: NotificationUpdate
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      fuel_type: FuelType
      interior_clean: InteriorClean
      tire_status: TireStatus
      incident_type: IncidentType
      doc_type: DocType
    }
    CompositeTypes: { [_ in never]: never }
  }
}
