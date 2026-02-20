import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cjtnbhnwdiprajdrkaai.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdG5iaG53ZGlwcmFqZHJrYWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMTk5MjYsImV4cCI6MjA4NTU5NTkyNn0.6Tqy1jW_CYRxg5JX4t0teB4aTg6Fyj0O0Paszsn8ThY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
