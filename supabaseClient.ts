import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://csclxuybczhphtugifak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzY2x4dXliY3pocGh0dWdpZmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MzI3ODQsImV4cCI6MjA4MDMwODc4NH0.psPLdfGGCQ3oqK1inPvJVsCfvTy2AMih2QiMuoCTXEU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);