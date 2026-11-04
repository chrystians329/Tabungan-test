import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Wallet, Goal, ScanHistoryItem, IncomeTemplate } from '../types';

let supabaseClient: SupabaseClient | null = null;

export const initSupabase = (url: string, anonKey: string): SupabaseClient | null => {
  if (!url || !anonKey) return null;
  if (supabaseClient) return supabaseClient;
  try {
    supabaseClient = createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const getSupabaseClient = (): SupabaseClient | null => supabaseClient;

export interface SyncPayload {
  transactions: Transaction[];
  wallets: Wallet[];
  goals: Goal[];
  scanHistory?: ScanHistoryItem[];
  incomeTemplates?: IncomeTemplate[];
  updatedAt: string;
}

/**
 * Upload state to Supabase
 */
export const syncUpToSupabase = async (
  userId: string,
  payload: SyncPayload
): Promise<boolean> => {
  if (!supabaseClient) return false;
  try {
    const { error } = await supabaseClient
      .from('user_finances')
      .upsert({
        user_id: userId,
        data: payload,
        updated_at: payload.updatedAt || new Date().toISOString(),
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error syncing up to Supabase:', err);
    return false;
  }
};

/**
 * Fetch state from Supabase
 */
export const syncDownFromSupabase = async (
  userId: string
): Promise<SyncPayload | null> => {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('user_finances')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data?.data as SyncPayload) || null;
  } catch (err) {
    console.error('Error syncing down from Supabase:', err);
    return null;
  }
};

/**
 * Subscribe to remote changes (Supabase Realtime).
 * Callback menerima payload data terbaru dari perangkat lain (HP / Desktop).
 * Return fungsi untuk berhenti subscribe.
 */
export const subscribeToUserFinances = (
  userId: string,
  onData: (payload: SyncPayload | null) => void
): (() => void) => {
  if (!supabaseClient || !userId) return () => {};

  try {
    const channel = supabaseClient.channel(`kayaku_${userId}`);
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_finances',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const record: any = payload.new ?? payload.old;
          onData((record?.data as SyncPayload) || null);
        }
      )
      .subscribe();

    return () => {
      try {
        supabaseClient?.removeChannel(channel);
      } catch {
        /* ignore */
      }
    };
  } catch (err) {
    console.warn('Realtime subscription unavailable, memakai polling:', err);
    return () => {};
  }
};

/**
 * Generate standard SQL schema for user to run in Supabase SQL editor
 */
export const getSupabaseSqlSchema = () => {
  return `-- Jalankan SQL ini di menu SQL Editor pada Supabase Dashboard Anda:
create table if not exists public.user_finances (
  user_id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mengaktifkan Realtime (agar mobile & desktop langsung sinkron tanpa refresh)
alter publication supabase_realtime add table public.user_finances;

-- Kebijakan akses (Bebas untuk anon / demo)
alter table public.user_finances enable row level security;
create policy "Allow all actions for anon" on public.user_finances for all using (true) with check (true);
`;
};
