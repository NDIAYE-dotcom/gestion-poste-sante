import { isSupabaseEnabled, supabase } from '../lib/supabaseClient'

const TABLES = {
  patients: 'health_patients',
  prescriptions: 'health_prescriptions',
  stock: 'health_stock_items',
  tickets: 'health_tickets',
  transactions: 'health_transactions',
  staff: 'health_staff_members',
}

const ADAPTERS = {
  patients: {
    toDb: (item) => ({
      first_name: item.firstName,
      last_name: item.lastName,
      age: item.age,
      sex: item.sex,
      phone: item.phone,
      address: item.address,
      consultation_date: item.consultationDate,
      diagnosis: item.diagnosis,
    }),
    fromDb: (row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      age: row.age,
      sex: row.sex,
      phone: row.phone,
      address: row.address,
      consultationDate: row.consultation_date,
      diagnosis: row.diagnosis,
    }),
  },
  prescriptions: {
    toDb: (item) => ({
      patient_name: item.patientName,
      doctor: item.doctor,
      medicines: item.medicines,
      dosage: item.dosage,
      date: item.date,
    }),
    fromDb: (row) => ({
      id: row.id,
      patientName: row.patient_name,
      doctor: row.doctor,
      medicines: row.medicines,
      dosage: row.dosage,
      date: row.date,
    }),
  },
  stock: {
    toDb: (item) => ({
      name: item.name,
      purchase_price: item.purchasePrice,
      sale_price: item.salePrice,
      quantity: item.quantity,
      expiration_date: item.expirationDate,
      alert_threshold: item.alertThreshold,
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      purchasePrice: row.purchase_price,
      salePrice: row.sale_price,
      quantity: row.quantity,
      expirationDate: row.expiration_date,
      alertThreshold: row.alert_threshold,
    }),
  },
  tickets: {
    toDb: (item) => ({
      ticket_number: item.ticketNumber,
      patient_name: item.patientName,
      medicines: item.medicines,
      consultation: item.consultation,
      total_amount: item.totalAmount,
      date: item.date,
    }),
    fromDb: (row) => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      patientName: row.patient_name,
      medicines: row.medicines,
      consultation: row.consultation,
      totalAmount: row.total_amount,
      date: row.date,
    }),
  },
  transactions: {
    toDb: (item) => ({
      type: item.type,
      label: item.label,
      amount: item.amount,
      date: item.date,
    }),
    fromDb: (row) => ({
      id: row.id,
      type: row.type,
      label: row.label,
      amount: row.amount,
      date: row.date,
    }),
  },
  staff: {
    toDb: (item) => ({
      name: item.name,
      role: item.role,
      phone: item.phone,
      schedule: item.schedule,
      guard_start: item.guardStart,
      guard_end: item.guardEnd,
      on_duty: item.onDuty,
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      phone: row.phone,
      schedule: row.schedule,
      guardStart: row.guard_start,
      guardEnd: row.guard_end,
      onDuty: row.on_duty,
    }),
  },
}

async function fetchTable(tableKey) {
  const tableName = TABLES[tableKey]
  const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: false })
  if (error) {
    throw error
  }
  return (data ?? []).map(ADAPTERS[tableKey].fromDb)
}

export async function loadInitialData() {
  if (!isSupabaseEnabled) {
    return null
  }

  const [patients, prescriptions, stock, tickets, transactions, staff] = await Promise.all([
    fetchTable('patients'),
    fetchTable('prescriptions'),
    fetchTable('stock'),
    fetchTable('tickets'),
    fetchTable('transactions'),
    fetchTable('staff'),
  ])

  return { patients, prescriptions, stock, tickets, transactions, staff }
}

export async function insertRecord(tableKey, payload) {
  if (!isSupabaseEnabled) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLES[tableKey])
    .insert(ADAPTERS[tableKey].toDb(payload))
    .select()
    .single()
  if (error) {
    throw error
  }
  return ADAPTERS[tableKey].fromDb(data)
}

export async function updateRecord(tableKey, id, payload) {
  if (!isSupabaseEnabled) {
    return null
  }

  const { data, error } = await supabase
    .from(TABLES[tableKey])
    .update(ADAPTERS[tableKey].toDb(payload))
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return ADAPTERS[tableKey].fromDb(data)
}

export async function deleteRecord(tableKey, id) {
  if (!isSupabaseEnabled) {
    return false
  }

  const { error } = await supabase.from(TABLES[tableKey]).delete().eq('id', id)
  if (error) {
    throw error
  }

  return true
}

export async function loadAppSetting(settingKey, fallbackValue = '') {
  if (!isSupabaseEnabled) {
    return fallbackValue
  }

  const { data, error } = await supabase
    .from('health_app_settings')
    .select('setting_value')
    .eq('setting_key', settingKey)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data?.setting_value) {
    return fallbackValue
  }

  return data.setting_value
}
