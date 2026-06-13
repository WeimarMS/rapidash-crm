-- ============================================================
-- RapiDash CRM — Usuario Demo (solo lectura)
-- Correr en el SQL Editor de Supabase. Idempotente.
--
-- Crea:
--   1. El rol 'demo' en el CHECK de profiles.rol
--   2. Policies SELECT-only para el rol demo en las tablas de negocio
--   3. El usuario demo@rapidash.bo (contraseña abajo)
--
-- El rol demo VE todo (excepto la gestión de usuarios) pero ningún
-- INSERT/UPDATE/DELETE pasa el RLS, aunque se manipule el frontend.
-- ============================================================

-- ── 1. Ampliar el CHECK de rol ────────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('admin','supervisor_zona','repartidor','cliente','demo'));

-- ── 2. Policies de solo lectura para el rol demo ──────────────
-- zonas, vehiculos y productos ya tienen SELECT para todos los
-- autenticados (read_all). Las demás necesitan policy explícita.

DROP POLICY IF EXISTS "demo_read_clientes"     ON public.clientes;
CREATE POLICY "demo_read_clientes"     ON public.clientes     FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

DROP POLICY IF EXISTS "demo_read_repartidores" ON public.repartidores;
CREATE POLICY "demo_read_repartidores" ON public.repartidores FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

DROP POLICY IF EXISTS "demo_read_rutas"        ON public.rutas;
CREATE POLICY "demo_read_rutas"        ON public.rutas        FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

DROP POLICY IF EXISTS "demo_read_pedidos"      ON public.pedidos;
CREATE POLICY "demo_read_pedidos"      ON public.pedidos      FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

DROP POLICY IF EXISTS "demo_read_pedido_items" ON public.pedido_items;
CREATE POLICY "demo_read_pedido_items" ON public.pedido_items FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

DROP POLICY IF EXISTS "demo_read_incidencias"  ON public.incidencias;
CREATE POLICY "demo_read_incidencias"  ON public.incidencias  FOR SELECT TO authenticated
  USING (get_user_role() = 'demo');

-- ── 3. Usuario demo ───────────────────────────────────────────
-- Email:      demo@rapidash.bo
-- Contraseña: Demo_RapiDash#2026
-- (el trigger handle_new_user crea el profile con rol desde metadata)

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- instance_id: sin esto GoTrue no encuentra al usuario
  '00000000-0000-0000-0000-000000000099',
  'authenticated', 'authenticated',
  'demo@rapidash.bo',
  crypt('Demo_RapiDash#2026', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Demo","rol":"demo"}'::jsonb,
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Asegurar el profile aunque el trigger no corra (re-ejecución, etc.)
INSERT INTO public.profiles (id, nombre, apellido, email, rol)
VALUES ('00000000-0000-0000-0000-000000000099', 'Demo', 'RapiDash', 'demo@rapidash.bo', 'demo')
ON CONFLICT (id) DO UPDATE SET rol = 'demo', apellido = 'RapiDash';

-- ── 4. Reparación de identidad y hash (GoTrue) ────────────────
-- GoTrue rechaza con invalid_credentials a usuarios insertados por SQL si:
--   a) falta la fila de auth.identities, o su provider_id no es el UUID
--      del usuario, o identity_data no trae "sub"/"email"
--   b) el hash no es bcrypt ($2a$...)
-- Esta sección lo deja consistente. Idempotente.

-- Identidad email bien formada
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data,
                             last_sign_in_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000099',   -- provider_id = UUID del usuario (texto)
  'email',
  jsonb_build_object(
    'sub',            '00000000-0000-0000-0000-000000000099',
    'email',          'demo@rapidash.bo',
    'email_verified', true,
    'phone_verified', false
  ),
  now(), now(), now()
)
ON CONFLICT (provider_id, provider)
DO UPDATE SET identity_data = EXCLUDED.identity_data, updated_at = now();

-- Re-hashear la contraseña con bcrypt (por si el salt original no era 'bf')
UPDATE auth.users
SET encrypted_password = extensions.crypt('Demo_RapiDash#2026', extensions.gen_salt('bf'))
WHERE email = 'demo@rapidash.bo';

-- instance_id: GoTrue filtra por instance_id = uuid cero; un INSERT manual
-- que lo deja NULL hace al usuario INVISIBLE para el login (invalid_credentials
-- con todo lo demás correcto). Repara también los usuarios del seed.
UPDATE auth.users
SET instance_id = '00000000-0000-0000-0000-000000000000'
WHERE instance_id IS NULL
  AND email LIKE '%@rapidash.bo';

-- Tokens NULL → '' (evita el error 500 "Database error querying schema")
UPDATE auth.users SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE email = 'demo@rapidash.bo';

-- ── Diagnóstico ───────────────────────────────────────────────
-- Correr esto para verificar el estado completo del usuario demo:
--
-- SELECT
--   u.email,
--   u.encrypted_password LIKE '$2%'                                          AS hash_es_bcrypt,
--   u.encrypted_password = extensions.crypt('Demo_RapiDash#2026',
--                                           u.encrypted_password)            AS password_coincide,
--   u.email_confirmed_at IS NOT NULL                                         AS confirmado,
--   u.instance_id = '00000000-0000-0000-0000-000000000000'                   AS instance_id_ok,
--   u.banned_until, u.deleted_at, u.is_sso_user,
--   i.provider, i.provider_id,
--   i.identity_data ? 'sub'                                                  AS identity_tiene_sub
-- FROM auth.users u
-- LEFT JOIN auth.identities i ON i.user_id = u.id
-- WHERE u.email = 'demo@rapidash.bo';
