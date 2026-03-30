import { createClient } from '@insforge/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://fdv7e3sf.us-east.insforge.app';
const supabaseAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'ik_9efccf17eed7a22c40c8a53b0d605b39';

export const insforge = createClient({
  baseUrl: supabaseUrl,
  anonKey: supabaseAnonKey
});
