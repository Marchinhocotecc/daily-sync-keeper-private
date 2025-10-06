# Note per prevenire errori futuri (404 wellness_data)

- Eseguire la migrazione SQL inclusa per:
  - creare la tabella `public.wellness_data`
  - abilitare RLS e policy
  - creare la funzione `has_wellness_data()`.

- All’avvio app (es. nel bootstrap globale), chiamare `ensureWellnessAvailable(supabase)`.
  - Se `false`, loggare un warning e usare un fallback (stato locale) finché la migrazione non è applicata.

- Gestione errori client:
  - Per le letture usare `.maybeSingle()` e controllare `status === 404` o messaggi di tabella mancante.
  - Non bloccare la UI: mostrare un messaggio non intrusivo/toast e continuare con dati locali.

- Upsert robusto:
  - Usare il vincolo `UNIQUE (user_id, date)` e `onConflict: 'user_id,date'`.
  - La policy `INSERT` con `WITH CHECK (auth.uid() = user_id)` è sufficiente per upsert; non è necessaria una policy `UPDATE` se si usa upsert su conflitto con INSERT.

- Verifica rapida:
  - Dopo la migrazione, testare con il SQL Editor:
    ```sql
    select has_wellness_data();             -- deve restituire true
    select * from public.wellness_data limit 1;
    ```
  - Dal client autenticato, provare una `insert` e poi `select` filtrata per `user_id` e `date`.
