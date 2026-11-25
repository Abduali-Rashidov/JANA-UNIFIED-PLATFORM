import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anonKey);
export const supabase = isCloudConfigured ? createClient(url, anonKey) : null;

/*
  Cloud mode is enabled only after VITE_SUPABASE_URL and
  VITE_SUPABASE_ANON_KEY are configured in the deployment environment.
  Until then the app runs in local demo mode (browser localStorage).
*/