import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vsxcvdarbhbfxrmmezvt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeGN2ZGFyYmhiZnhybW1lenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1MzIyNSwiZXhwIjoyMDg5NjI5MjI1fQ.eamFq9VVMXalbsFcE7MD9Gr77sFqJuFaP-pGY_497Yg'

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
