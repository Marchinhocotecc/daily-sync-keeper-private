-- SQL: schema, table, RLS, policies, helper function
-- Eseguire nel Supabase SQL Editor (o tramite CLI) prima di usare il frontend.

-- 1) Prerequisiti
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Tabella wellness_data
CREATE TABLE IF NOT EXISTS public.wellness_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  "date" DATE NOT NULL DEFAULT now(),
  sleep NUMERIC,
  mood TEXT,
  activity NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vincolo per singola riga per utente/giorno (consente upsert)
ALTER TABLE public.wellness_data
  ADD CONSTRAINT wellness_data_user_date_unique UNIQUE (user_id, "date");

-- 3) Permessi base e RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.wellness_data TO authenticated;

ALTER TABLE public.wellness_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_data FORCE ROW LEVEL SECURITY;

-- 4) Policy RLS
-- Lettura: l’utente vede solo le proprie righe
CREATE POLICY wellness_data_select_own
  ON public.wellness_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserimento/Upsert: l’utente può inserire solo righe con il proprio user_id
CREATE POLICY wellness_data_insert_own
  ON public.wellness_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5) Helper: funzione per verificare l’esistenza tabella (per fallback lato client)
CREATE OR REPLACE FUNCTION public.has_wellness_data()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'wellness_data'
      AND c.relkind IN ('r','p')
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_wellness_data() TO anon, authenticated;

-- (Opzionale) Indice per query per user_id e date
CREATE INDEX IF NOT EXISTS idx_wellness_data_user_date
  ON public.wellness_data (user_id, "date");
