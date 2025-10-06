// API utilities per leggere/scrivere wellness_data con gestione 404 (tabella mancante).

import type { SupabaseClient } from '@supabase/supabase-js';

export type WellnessRow = {
  id: string;
  user_id: string;
  date: string;       // YYYY-MM-DD
  sleep: number | null;
  mood: string | null;
  activity: number | null;
  created_at: string;
};

type Result<T> = { data: T | null; error: Error | null };

/**
 * Verifica se la tabella esiste (usa la funzione SQL has_wellness_data()).
 * Ritorna false se non esiste o se non si riesce a confermare (fallback lato UI).
 */
export async function ensureWellnessAvailable(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_wellness_data');
    if (error) {
      console.warn('[wellness] has_wellness_data RPC error:', error.message);
      return false;
    }
    return Boolean(data);
  } catch (e: any) {
    console.warn('[wellness] has_wellness_data call failed:', e?.message || e);
    return false;
  }
}

/**
 * Legge la riga wellness per utente e data (YYYY-MM-DD).
 * Se la tabella non esiste (404) o non ci sono righe, ritorna { data: null, error: null }.
 */
export async function fetchWellness(
  supabase: SupabaseClient,
  date: string,
  userId?: string
): Promise<Result<WellnessRow>> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return { data: null, error: new Error('Utente non autenticato') };

    const { data, error, status } = await supabase
      .from('wellness_data')
      .select('*')
      .eq('user_id', uid)
      .eq('date', date)
      .maybeSingle();

    if (error && status === 404) {
      console.warn('[wellness] Tabella wellness_data non trovata (404).', error.message);
      return { data: null, error: null };
    }
    if (error && status !== 406) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: (data as WellnessRow) || null, error: null };
  } catch (e: any) {
    console.error('[wellness] fetch error:', e?.message || e);
    return { data: null, error: e };
  }
}

/**
 * Inserisce/aggiorna i dati wellness per (user_id, date).
 * Usa onConflict: 'user_id,date' (vincolo UNIQUE).
 */
export async function upsertWellness(
  supabase: SupabaseClient,
  input: { date: string; sleep?: number | null; mood?: string | null; activity?: number | null },
  userId?: string
): Promise<Result<WellnessRow>> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return { data: null, error: new Error('Utente non autenticato') };

    const payload = {
      user_id: uid,
      date: input.date,
      sleep: input.sleep ?? null,
      mood: input.mood ?? null,
      activity: input.activity ?? null,
    };

    const { data, error, status } = await supabase
      .from('wellness_data')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error && status === 404) {
      console.warn('[wellness] Tabella wellness_data non trovata (404).', error.message);
      return { data: null, error: null };
    }
    if (error) return { data: null, error: new Error(error.message) };

    return { data: data as WellnessRow, error: null };
  } catch (e: any) {
    console.error('[wellness] upsert error:', e?.message || e);
    return { data: null, error: e };
  }
}

/**
 * Suggerimento d’uso:
 * - All’avvio app: await ensureWellnessAvailable(supabase)
 * - Lettura: const { data } = await fetchWellness(supabase, '2025-09-13')
 * - Upsert: await upsertWellness(supabase, { date: '2025-09-13', sleep: 7.5 })
 */
