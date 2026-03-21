import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsxcvdarbhbfxrmmezvt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeGN2ZGFyYmhiZnhybW1lenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTMyMjUsImV4cCI6MjA4OTYyOTIyNX0.n0jBRfMqO5gMTVaFYmHZZR2JCU7Wi25YQhy5TEVoJ2M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
