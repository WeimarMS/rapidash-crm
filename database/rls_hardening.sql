-- ============================================================
-- RapiDash CRM — RLS Hardening (FASE 1, sistema de roles)
-- ============================================================
-- Correr COMPLETO en Supabase Dashboard → SQL Editor.
-- Es idempotente: se puede correr varias veces sin romper nada.
--
-- Qué hace:
--   1. (Re)crea los helpers SECURITY DEFINER de rol/zona.
--   2. Habilita RLS en las 10 tablas  ← arregla el hueco crítico:
--      hoy anon (sin login) lee TODO y puede escribir en clientes.
--   3. (Re)crea todas las policies por rol de forma idempotente.
--   4. Agrega trigger anti-escalada de privilegios en profiles
--      (un no-admin no puede cambiarse su propio rol ni su zona).
--   5. Revoca el acceso del rol anon a las tablas (defensa en
--      profundidad) y garantiza los GRANT a authenticated.
--   6. Al final imprime un reporte de verificación.
-- ============================================================


-- ============================================================
-- 1. HELPERS RLS (SECURITY DEFINER para evitar recursión)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_zona_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT zona_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_repartidor_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public AS $$
  SELECT id FROM public.repartidores WHERE user_id = auth.uid()
$$;


-- ============================================================
-- 2. HABILITAR RLS EN TODAS LAS TABLAS  (el fix central)
-- ============================================================

ALTER TABLE public.zonas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repartidores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rutas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. POLICIES POR ROL (idempotentes: DROP IF EXISTS + CREATE)
-- ============================================================

-- ── ZONAS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "zonas_read_all"    ON public.zonas;
DROP POLICY IF EXISTS "zonas_admin_write" ON public.zonas;
CREATE POLICY "zonas_read_all"    ON public.zonas FOR SELECT TO authenticated USING (true);
CREATE POLICY "zonas_admin_write" ON public.zonas FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- ── PROFILES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_own_select"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_supervisor_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update"      ON public.profiles;
CREATE POLICY "profiles_own_select"      ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all"       ON public.profiles FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_supervisor_read" ON public.profiles FOR SELECT TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
-- El usuario puede actualizar su propia fila (nombre/apellido/telefono),
-- pero el trigger de la sección 4 le impide tocar rol y zona_id.
CREATE POLICY "profiles_own_update"      ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ── VEHICULOS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "vehiculos_read_all"    ON public.vehiculos;
DROP POLICY IF EXISTS "vehiculos_admin_write" ON public.vehiculos;
CREATE POLICY "vehiculos_read_all"    ON public.vehiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehiculos_admin_write" ON public.vehiculos FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- ── PRODUCTOS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "productos_read_all"    ON public.productos;
DROP POLICY IF EXISTS "productos_admin_write" ON public.productos;
CREATE POLICY "productos_read_all"    ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_admin_write" ON public.productos FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- ── CLIENTES ───────────────────────────────────────────────
DROP POLICY IF EXISTS "clientes_admin_all"       ON public.clientes;
DROP POLICY IF EXISTS "clientes_supervisor_zona" ON public.clientes;
DROP POLICY IF EXISTS "clientes_repartidor_read" ON public.clientes;
DROP POLICY IF EXISTS "clientes_own_read"        ON public.clientes;
CREATE POLICY "clientes_admin_all"       ON public.clientes FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "clientes_supervisor_zona" ON public.clientes FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id())
  WITH CHECK (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "clientes_repartidor_read" ON public.clientes FOR SELECT TO authenticated
  USING (get_user_role() = 'repartidor' AND zona_id = get_user_zona_id());
CREATE POLICY "clientes_own_read"        ON public.clientes FOR SELECT TO authenticated
  USING (get_user_role() = 'cliente' AND user_id = auth.uid());

-- ── REPARTIDORES ───────────────────────────────────────────
DROP POLICY IF EXISTS "repartidores_admin_all"       ON public.repartidores;
DROP POLICY IF EXISTS "repartidores_supervisor_read" ON public.repartidores;
DROP POLICY IF EXISTS "repartidores_own_read"        ON public.repartidores;
CREATE POLICY "repartidores_admin_all"       ON public.repartidores FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "repartidores_supervisor_read" ON public.repartidores FOR SELECT TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "repartidores_own_read"        ON public.repartidores FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ── RUTAS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "rutas_admin_all"       ON public.rutas;
DROP POLICY IF EXISTS "rutas_supervisor_zona" ON public.rutas;
DROP POLICY IF EXISTS "rutas_repartidor_read" ON public.rutas;
CREATE POLICY "rutas_admin_all"       ON public.rutas FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "rutas_supervisor_zona" ON public.rutas FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id())
  WITH CHECK (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "rutas_repartidor_read" ON public.rutas FOR SELECT TO authenticated
  USING (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id());

-- ── PEDIDOS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "pedidos_admin_all"         ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_supervisor_zona"   ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_repartidor_read"   ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_repartidor_update" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_cliente_own"       ON public.pedidos;
CREATE POLICY "pedidos_admin_all"       ON public.pedidos FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "pedidos_supervisor_zona" ON public.pedidos FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id())
  WITH CHECK (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "pedidos_repartidor_read"   ON public.pedidos FOR SELECT TO authenticated
  USING (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id());
CREATE POLICY "pedidos_repartidor_update" ON public.pedidos FOR UPDATE TO authenticated
  USING (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id())
  WITH CHECK (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id());
CREATE POLICY "pedidos_cliente_own" ON public.pedidos FOR SELECT TO authenticated
  USING (get_user_role() = 'cliente' AND cliente_id IN (
    SELECT id FROM public.clientes WHERE user_id = auth.uid()
  ));

-- ── PEDIDO_ITEMS ───────────────────────────────────────────
DROP POLICY IF EXISTS "pedido_items_admin_all"        ON public.pedido_items;
DROP POLICY IF EXISTS "pedido_items_supervisor"       ON public.pedido_items;
DROP POLICY IF EXISTS "pedido_items_read_via_pedido"  ON public.pedido_items;
CREATE POLICY "pedido_items_admin_all"  ON public.pedido_items FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "pedido_items_supervisor" ON public.pedido_items FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ))
  WITH CHECK (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ));
-- Lectura vía pedido visible: el subquery a pedidos ya está filtrado por
-- las policies de pedidos, así que cada rol solo ve los items de sus pedidos.
CREATE POLICY "pedido_items_read_via_pedido" ON public.pedido_items FOR SELECT TO authenticated
  USING (pedido_id IN (SELECT id FROM public.pedidos));

-- ── INCIDENCIAS ────────────────────────────────────────────
DROP POLICY IF EXISTS "incidencias_admin_all"       ON public.incidencias;
DROP POLICY IF EXISTS "incidencias_supervisor_zona" ON public.incidencias;
DROP POLICY IF EXISTS "incidencias_repartidor"      ON public.incidencias;
CREATE POLICY "incidencias_admin_all"       ON public.incidencias FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "incidencias_supervisor_zona" ON public.incidencias FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ))
  WITH CHECK (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ));
CREATE POLICY "incidencias_repartidor" ON public.incidencias FOR ALL    TO authenticated
  USING (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id())
  WITH CHECK (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id());


-- ============================================================
-- 4. ANTI-ESCALADA DE PRIVILEGIOS EN PROFILES
-- ============================================================
-- La policy profiles_own_update deja que el usuario edite su fila.
-- Sin esto, un cliente podría hacer UPDATE profiles SET rol='admin'
-- sobre sí mismo vía la REST API y auto-promoverse.
--
-- NOTA: esta función NO es SECURITY DEFINER a propósito, para que
-- current_user refleje el rol real de la conexión (authenticated /
-- service_role). El service_role (Netlify Function del admin) la
-- saltea; los admin autenticados también, por get_user_role().

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- La Netlify Function (service_role) gestiona roles legítimamente.
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Un admin autenticado puede cambiar rol/zona de cualquiera.
  IF public.get_user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Cualquier otro rol: rol y zona_id son inmutables al editar su perfil.
  IF NEW.rol IS DISTINCT FROM OLD.rol
     OR NEW.zona_id IS DISTINCT FROM OLD.zona_id THEN
    RAISE EXCEPTION 'No autorizado: no puedes modificar tu rol ni tu zona';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_no_self_escalation ON public.profiles;
CREATE TRIGGER trg_profiles_no_self_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();


-- ============================================================
-- 5. GRANTS — anon sin acceso a tablas, authenticated con acceso
-- ============================================================
-- El flujo de login usa el endpoint /auth (no las tablas), así que
-- anon no necesita ningún privilegio sobre el schema de negocio.
-- Con RLS encendida ya quedaría a 0 filas; esto es defensa extra.

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ============================================================
-- 6. VERIFICACIÓN — revisar la salida de estos SELECT
-- ============================================================

-- (a) RLS debe estar 'true' en las 10 tablas:
SELECT relname AS tabla, relrowsecurity AS rls_on
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relname IN ('zonas','profiles','vehiculos','clientes','repartidores',
                  'productos','rutas','pedidos','pedido_items','incidencias')
ORDER BY relname;

-- (b) Conteo de policies por tabla (todas deben tener >= 1):
SELECT tablename AS tabla, count(*) AS policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- (c) anon NO debe tener privilegios sobre tablas del negocio
--     (esta consulta debe devolver 0 filas):
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public';
