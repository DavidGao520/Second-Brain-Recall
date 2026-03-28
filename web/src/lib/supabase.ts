import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kryrqcqpcxvevmbfuxiu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXJxY3FwY3h2ZXZtYmZ1eGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzI0MzUsImV4cCI6MjA5MDI0ODQzNX0.Jv57cpcvyumyVGqy4W6xLEE9DZk8qhiiOFOGXspNzmA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
