-- ============================================================
-- fix-missing-identities.sql
-- Inserta una fila en auth.identities para todo usuario de
-- auth.users que no tenga ninguna identity registrada.
--
-- Causa: usuarios creados via INSERT directo en auth.users
-- (seed SQL) bypasean el trigger de GoTrue que normalmente
-- crea la identity correspondiente. Sin esa fila, el endpoint
-- auth.admin.listUsers() falla con:
--   code: "unexpected_failure", status: 500
--
-- El filtro es puramente dinámico (NOT EXISTS) — no depende
-- de UUIDs hardcodeados, cubre cualquier caso futuro similar.
-- ============================================================

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid()                                         AS id,
  u.id                                                      AS user_id,
  jsonb_build_object('sub', u.id::text, 'email', u.email)   AS identity_data,
  'email'                                                   AS provider,
  u.email                                                   AS provider_id,
  u.created_at                                              AS last_sign_in_at,
  u.created_at                                              AS created_at,
  u.created_at                                              AS updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
