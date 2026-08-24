-- ============================================================
-- fix-null-tokens-auth-users.sql
-- Reemplaza NULL → '' en columnas de texto de auth.users que
-- GoTrue (Go) escanea como string no-nullable.
--
-- ────────────────────────────────────────────────────────────
-- CAUSA RAÍZ
-- ────────────────────────────────────────────────────────────
-- Los usuarios creados con INSERT directo en auth.users (seed SQL)
-- no tienen ciertos campos de texto inicializados.
-- GoTrue en Go los escanea como `string` (no `*string`), por lo que
-- un NULL de PostgreSQL provoca:
--   "sql: Scan error on column X: converting NULL to string is unsupported"
-- Esto hace que auth.admin.listUsers() retorne:
--   code: "unexpected_failure", status: 500
-- y la página Users del CRM muestre "Database error finding users".
--
-- ────────────────────────────────────────────────────────────
-- COLUMNAS PROBLEMÁTICAS (comparativo supervisor sintético vs demo real)
-- ────────────────────────────────────────────────────────────
-- Las siguientes columnas deben ser '' (no NULL) para evitar el error.
-- El diagnóstico se realizó comparando auth.users de los 5 supervisores
-- sintéticos contra demo@rapidash.bo (usuario real, no afectado):
--
--   COLUMNA                    | SUPERVISORES | DEMO
--   ---------------------------|--------------|------
--   confirmation_token         | NULL → fix   | ''
--   email_change_token_new     | NULL → fix   | ''
--   recovery_token             | NULL → fix   | ''
--   email_change               | NULL → fix   | ''  ← 4ta columna, fix separado
--
-- Columnas que SÍ pueden ser NULL (GoTrue las trata como *string):
--   phone                      | NULL         | NULL  ← igual en ambos, no falla
--
-- ────────────────────────────────────────────────────────────
-- SÍNTOMA OBSERVADO EN LOGS DE NETLIFY
-- ────────────────────────────────────────────────────────────
--   authRes.error.message = "Database error finding users"
--   authRes.error.code    = "unexpected_failure"
--   authRes.error.status  = 500
--   authRes.data.users.length = 0
--   profilesRes.error = null   (profiles sí funcionaba — no es RLS)
--
-- ────────────────────────────────────────────────────────────
-- NOTA: El filtro es puramente dinámico (sin UUIDs hardcodeados).
-- Re-ejecutar este script en el futuro es seguro: COALESCE no toca
-- columnas que ya tengan valor.
-- ============================================================

-- Fix 1 (aplicado 2026-08-24): confirmation_token, email_change_token_new, recovery_token
UPDATE auth.users
SET
  confirmation_token     = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token         = COALESCE(recovery_token, '')
WHERE confirmation_token     IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token         IS NULL;

-- Fix 2 (aplicado 2026-08-24): email_change
-- Descubierto tras diagnóstico comparativo completo: única columna
-- que seguía siendo NULL en supervisores mientras demo tenía ''.
UPDATE auth.users
SET email_change = COALESCE(email_change, '')
WHERE email_change IS NULL;
