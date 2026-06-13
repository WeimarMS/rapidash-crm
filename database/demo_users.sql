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

INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
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

-- ── Verificación rápida ───────────────────────────────────────
-- SELECT id, email FROM auth.users WHERE email = 'demo@rapidash.bo';
-- SELECT rol FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000099';
