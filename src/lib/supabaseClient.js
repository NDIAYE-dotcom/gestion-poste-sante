import { createClient } from '@supabase/supabase-js'

// Public project URL fallback to keep auth available if host env injection fails.
const DEFAULT_SUPABASE_URL = 'https://xnjeifzdbcdklthlfiee.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_9InnLKFZ-xymZtZ88zb5AQ_yBdop1ke'

const supabaseUrl = (
	import.meta.env.VITE_SUPABASE_URL ||
	import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
	import.meta.env.SUPABASE_URL ||
	DEFAULT_SUPABASE_URL
).trim()

const supabaseAnonKey = (
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.SUPABASE_ANON_KEY ||
	DEFAULT_SUPABASE_ANON_KEY
).trim()

export const hasSupabaseUrl = Boolean(supabaseUrl)
export const hasSupabaseAnonKey = Boolean(supabaseAnonKey)

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null
