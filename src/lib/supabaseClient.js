import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (
	import.meta.env.VITE_SUPABASE_URL ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
	import.meta.env.SUPABASE_URL ||
	''
).trim()

const supabaseAnonKey = (
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	import.meta.env.SUPABASE_ANON_KEY ||
	''
).trim()

export const hasSupabaseUrl = Boolean(supabaseUrl)
export const hasSupabaseAnonKey = Boolean(supabaseAnonKey)

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null
