// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hplwstovhwsvnncxhshg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwbHdzdG92aHdzdm5uY3hoc2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjgyNDksImV4cCI6MjA5NTY0NDI0OX0.nEq3tk8AMpSX-vZE__VNbpoVv6X558X0Tcesus-eqCw';

export const supabase = createClient(supabaseUrl, supabaseKey);

