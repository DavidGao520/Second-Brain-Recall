import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kryrqcqpcxvevmbfuxiu.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeXJxY3FwY3h2ZXZtYmZ1eGl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY3MjQzNSwiZXhwIjoyMDkwMjQ4NDM1fQ.cCLieW3a-ESOfmkhO8TeEJmi_p-sRh_St_pTc-mqi44'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
