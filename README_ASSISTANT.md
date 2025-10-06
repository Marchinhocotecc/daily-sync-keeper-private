# Assistant Integration

## Environment
Set (server side only):
- MISTRAL_API_KEY
- SUPABASE_SERVICE_ROLE_KEY (only in serverless context, never expose to client)
- SUPABASE_URL (or reuse existing)

Optional:
- MISTRAL_API_URL
- MISTRAL_MODEL

Client bundle never includes these secrets.

## Migration
Apply SQL in `supabase/migrations/*_create_assistant_messages.sql`.

## Endpoint
POST /api/assistant
Request: { "input": "testo", "userId": "uuid-utente" }
Response: { "messages":[{ role:"assistant", message:"..." }], "actions":[ { type, status } ] }

## Supported Actions (rule-based fallback)
- create_task: “Crea una task chiamata X (domani) alle 10”
- create_event: “Crea evento Titolo il 2025-01-01 alle 10:00”
- create_expense: “Aggiungi spesa di 25€ per descrizione”

## Security
- Validation & sanitization per action
- RLS enforced on `assistant_messages`
- Service role only on serverless environment
