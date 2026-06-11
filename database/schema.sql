-- ============================================================
-- RapiDash CRM — Schema completo
-- Empresa: RapiDash S.R.L. (distribución farmacéutica, Santa Cruz, Bolivia)
-- ============================================================

-- ============================================================
-- CHUNK 1: TABLAS (orden por dependencias FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.zonas (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      text        NOT NULL,
  descripcion text,
  color       text        DEFAULT '#3B82F6',
  activa      boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text        NOT NULL,
  apellido   text,
  email      text,
  rol        text        NOT NULL DEFAULT 'cliente'
               CHECK (rol IN ('admin','supervisor_zona','repartidor','cliente')),
  zona_id    uuid        REFERENCES public.zonas(id),
  telefono   text,
  activo     boolean     DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vehiculos (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  placa        text        NOT NULL UNIQUE,
  tipo         text        NOT NULL CHECK (tipo IN ('moto','camioneta','furgon')),
  marca        text,
  modelo       text,
  anio         integer,
  capacidad_kg numeric(8,2),
  activo       boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.clientes (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          text        NOT NULL,
  tipo            text        NOT NULL CHECK (tipo IN ('farmacia','clinica','consultorio','centro_salud')),
  zona_id         uuid        NOT NULL REFERENCES public.zonas(id),
  direccion       text        NOT NULL,
  latitud         numeric(10,7),
  longitud        numeric(10,7),
  telefono        text,
  email           text,
  contacto_nombre text,
  nit             text,
  credito_limite  numeric(10,2) DEFAULT 0,
  activo          boolean     DEFAULT true,
  user_id         uuid        REFERENCES auth.users(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repartidores (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id),
  nombre      text        NOT NULL,
  apellido    text        NOT NULL,
  ci          text        NOT NULL UNIQUE,
  telefono    text,
  zona_id     uuid        REFERENCES public.zonas(id),
  vehiculo_id uuid        REFERENCES public.vehiculos(id),
  activo      boolean     DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.productos (
  id              uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre          text         NOT NULL,
  descripcion     text,
  categoria       text         NOT NULL CHECK (categoria IN ('analgesico','antibiotico','vitamina','insumo','vacuna')),
  unidad          text         NOT NULL DEFAULT 'unidad',
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario >= 0),
  stock_actual    integer      NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo    integer      NOT NULL DEFAULT 10,
  activo          boolean      DEFAULT true,
  created_at      timestamptz  DEFAULT now(),
  updated_at      timestamptz  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rutas (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo        text        NOT NULL UNIQUE,
  fecha         date        NOT NULL,
  zona_id       uuid        NOT NULL REFERENCES public.zonas(id),
  repartidor_id uuid        REFERENCES public.repartidores(id),
  estado        text        NOT NULL DEFAULT 'planificada'
                  CHECK (estado IN ('planificada','en_curso','completada','cancelada')),
  hora_inicio   time,
  hora_fin      time,
  notas         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedidos (
  id                     uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo                 text         NOT NULL UNIQUE,
  cliente_id             uuid         NOT NULL REFERENCES public.clientes(id),
  ruta_id                uuid         REFERENCES public.rutas(id),
  repartidor_id          uuid         REFERENCES public.repartidores(id),
  zona_id                uuid         NOT NULL REFERENCES public.zonas(id),
  estado                 text         NOT NULL DEFAULT 'pendiente'
                           CHECK (estado IN ('pendiente','confirmado','en_ruta','entregado','fallido','cancelado')),
  total                  numeric(10,2) NOT NULL DEFAULT 0,
  notas                  text,
  fecha_pedido           timestamptz  DEFAULT now(),
  fecha_entrega_estimada date,
  fecha_entrega_real     timestamptz,
  created_by             uuid         REFERENCES auth.users(id),
  created_at             timestamptz  DEFAULT now(),
  updated_at             timestamptz  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pedido_items (
  id              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id       uuid          NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  producto_id     uuid          NOT NULL REFERENCES public.productos(id),
  cantidad        integer       NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL,
  subtotal        numeric(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at      timestamptz   DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incidencias (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id     uuid        NOT NULL REFERENCES public.pedidos(id),
  repartidor_id uuid        REFERENCES public.repartidores(id),
  tipo          text        NOT NULL CHECK (tipo IN (
                  'cliente_ausente','direccion_incorrecta','producto_danado',
                  'rechazo_cliente','accidente','otro')),
  descripcion   text        NOT NULL,
  estado        text        NOT NULL DEFAULT 'abierta'
                  CHECK (estado IN ('abierta','en_revision','resuelta','cerrada')),
  resolucion    text,
  reportado_por uuid        REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);


-- ============================================================
-- CHUNK 2: FUNCIONES Y TRIGGERS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at     BEFORE UPDATE ON public.profiles     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clientes_updated_at     BEFORE UPDATE ON public.clientes     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_repartidores_updated_at BEFORE UPDATE ON public.repartidores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_productos_updated_at    BEFORE UPDATE ON public.productos    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_rutas_updated_at        BEFORE UPDATE ON public.rutas        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pedidos_updated_at      BEFORE UPDATE ON public.pedidos      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_incidencias_updated_at  BEFORE UPDATE ON public.incidencias  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Perfil automático al crear usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helpers RLS (SECURITY DEFINER para evitar recursión en profiles)
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
-- CHUNK 3: RLS — ENABLE + POLÍTICAS
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

-- ZONAS: todos leen, solo admin escribe
CREATE POLICY "zonas_read_all"    ON public.zonas FOR SELECT TO authenticated USING (true);
CREATE POLICY "zonas_admin_write" ON public.zonas FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- PROFILES
CREATE POLICY "profiles_own_select"      ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_admin_all"       ON public.profiles FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "profiles_supervisor_read" ON public.profiles FOR SELECT TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "profiles_own_update"      ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- VEHICULOS: todos leen, solo admin escribe
CREATE POLICY "vehiculos_read_all"    ON public.vehiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehiculos_admin_write" ON public.vehiculos FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- PRODUCTOS: todos leen, solo admin escribe
CREATE POLICY "productos_read_all"    ON public.productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "productos_admin_write" ON public.productos FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- CLIENTES
CREATE POLICY "clientes_admin_all"       ON public.clientes FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "clientes_supervisor_zona" ON public.clientes FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id())
  WITH CHECK (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "clientes_repartidor_read" ON public.clientes FOR SELECT TO authenticated
  USING (get_user_role() = 'repartidor' AND zona_id = get_user_zona_id());
CREATE POLICY "clientes_own_read"        ON public.clientes FOR SELECT TO authenticated
  USING (get_user_role() = 'cliente' AND user_id = auth.uid());

-- REPARTIDORES
CREATE POLICY "repartidores_admin_all"      ON public.repartidores FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "repartidores_supervisor_read" ON public.repartidores FOR SELECT TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "repartidores_own_read"       ON public.repartidores FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RUTAS
CREATE POLICY "rutas_admin_all"       ON public.rutas FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "rutas_supervisor_zona" ON public.rutas FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id())
  WITH CHECK (get_user_role() = 'supervisor_zona' AND zona_id = get_user_zona_id());
CREATE POLICY "rutas_repartidor_read" ON public.rutas FOR SELECT TO authenticated
  USING (get_user_role() = 'repartidor' AND repartidor_id = get_repartidor_id());

-- PEDIDOS
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

-- PEDIDO_ITEMS
CREATE POLICY "pedido_items_admin_all"  ON public.pedido_items FOR ALL    TO authenticated
  USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "pedido_items_supervisor" ON public.pedido_items FOR ALL    TO authenticated
  USING (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ))
  WITH CHECK (get_user_role() = 'supervisor_zona' AND pedido_id IN (
    SELECT id FROM public.pedidos WHERE zona_id = get_user_zona_id()
  ));
CREATE POLICY "pedido_items_read_via_pedido" ON public.pedido_items FOR SELECT TO authenticated
  USING (pedido_id IN (SELECT id FROM public.pedidos));

-- INCIDENCIAS
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
-- CHUNK 4: GRANTs + ÍNDICES
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE INDEX IF NOT EXISTS idx_profiles_rol          ON public.profiles(rol);
CREATE INDEX IF NOT EXISTS idx_profiles_zona         ON public.profiles(zona_id);
CREATE INDEX IF NOT EXISTS idx_clientes_zona         ON public.clientes(zona_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user         ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_repartidores_zona     ON public.repartidores(zona_id);
CREATE INDEX IF NOT EXISTS idx_repartidores_user     ON public.repartidores(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria   ON public.productos(categoria);
CREATE INDEX IF NOT EXISTS idx_rutas_fecha           ON public.rutas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_rutas_zona            ON public.rutas(zona_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente       ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_zona          ON public.pedidos(zona_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado        ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor    ON public.pedidos(repartidor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha         ON public.pedidos(fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_ruta          ON public.pedidos(ruta_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido   ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_pedido    ON public.incidencias(pedido_id);
CREATE INDEX IF NOT EXISTS idx_incidencias_repartidor ON public.incidencias(repartidor_id);
