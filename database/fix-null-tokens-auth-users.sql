-- ============================================================
-- fix-null-tokens-auth-users.sql
-- Reemplaza NULL → '' en confirmation_token, email_change_token_new
-- y recovery_token para cualquier usuario en auth.users que tenga
-- esos campos como NULL.
--
-- Causa raíz:
--   Los usuarios creados con INSERT directo en auth.users (seed SQL)
--   no tienen estos campos inicializados. GoTrue en Go los escanea
--   como string (no *string), por lo que un NULL de PostgreSQL provoca:
--     "sql: Scan error on column confirmation_token:
--      converting NULL to string is unsupported"
--   Esto hace que auth.admin.listUsers() retorne:
--     code: "unexpected_failure", status: 500
--   y la página Users del CRM muestre "Database error finding users".
--
-- Síntoma observado:
--   authRes.error.message = "Database error finding users"
--   authRes.data.users.length = 0
--   profilesRes.error = null  (profiles sí funcionaba porque no usa GoTrue)
--
-- El filtro es puramente dinámico (sin UUIDs hardcodeados).
-- ============================================================

UPDATE auth.users
SET
  confirmation_token     = COALESCE(confirmation_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token         = COALESCE(recovery_token, '')
WHERE confirmation_token     IS NULL
   OR email_change_token_new IS NULL
   OR recovery_token         IS NULL;
