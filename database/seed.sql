-- ============================================================
-- RapiDash CRM — Seed Data
-- Fuente clientes: BD_Clientes.md
-- ============================================================

-- ZONAS (5)
INSERT INTO public.zonas (id, nombre, descripcion, color) VALUES
  ('00000000-0000-0000-0000-000000000001','Centro','Primer y segundo anillo, casco histórico, DM-11','#3B82F6'),
  ('00000000-0000-0000-0000-000000000002','Norte','Equipetrol, Radial 26, Hamacas, Satélite Norte, DM-2/5','#10B981'),
  ('00000000-0000-0000-0000-000000000003','Sur','Urbarí, Doble Vía La Guardia, DM-4','#F59E0B'),
  ('00000000-0000-0000-0000-000000000004','Este','Villa 1ro de Mayo, Pampa de la Isla, DM-6/7','#EF4444'),
  ('00000000-0000-0000-0000-000000000005','Oeste','Plan 3000, Villa Nueva Campo, DM-8','#8B5CF6');

-- VEHÍCULOS (6)
INSERT INTO public.vehiculos (id, placa, tipo, marca, modelo, anio, capacidad_kg) VALUES
  ('00000000-0000-0000-0000-000000000011','3256-BJK','moto',     'Honda',  'XR 150',   2022, 30.00),
  ('00000000-0000-0000-0000-000000000012','4812-CGM','moto',     'Yamaha', 'YBR 125',  2021, 25.00),
  ('00000000-0000-0000-0000-000000000013','5639-DLN','camioneta','Toyota', 'Hilux',    2020,800.00),
  ('00000000-0000-0000-0000-000000000014','7214-FRP','camioneta','Nissan', 'Frontier', 2021,750.00),
  ('00000000-0000-0000-0000-000000000015','8847-GKS','furgon',   'Hyundai','H-1',      2023,1200.00),
  ('00000000-0000-0000-0000-000000000016','9103-HVT','moto',     'Honda',  'CB 190R',  2023, 35.00);

-- SUPERVISORES (5 auth users + profiles)
-- Contraseña: RapiDash2025!
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000021','authenticated','authenticated','supervisor.centro@rapidash.bo',crypt('RapiDash2025!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"nombre":"Carlos","rol":"supervisor_zona"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000022','authenticated','authenticated','supervisor.norte@rapidash.bo', crypt('RapiDash2025!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"nombre":"Maria","rol":"supervisor_zona"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000023','authenticated','authenticated','supervisor.sur@rapidash.bo',   crypt('RapiDash2025!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"nombre":"Roberto","rol":"supervisor_zona"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000024','authenticated','authenticated','supervisor.este@rapidash.bo',  crypt('RapiDash2025!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"nombre":"Ana","rol":"supervisor_zona"}'::jsonb,now(),now()),
  ('00000000-0000-0000-0000-000000000025','authenticated','authenticated','supervisor.oeste@rapidash.bo', crypt('RapiDash2025!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"nombre":"Diego","rol":"supervisor_zona"}'::jsonb,now(),now())
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles SET apellido='Vasquez Pena',   zona_id='00000000-0000-0000-0000-000000000001', telefono='+591 71100001', rol='supervisor_zona' WHERE id='00000000-0000-0000-0000-000000000021';
UPDATE public.profiles SET apellido='Condori Flores', zona_id='00000000-0000-0000-0000-000000000002', telefono='+591 71100002', rol='supervisor_zona' WHERE id='00000000-0000-0000-0000-000000000022';
UPDATE public.profiles SET apellido='Salinas Ortiz',  zona_id='00000000-0000-0000-0000-000000000003', telefono='+591 71100003', rol='supervisor_zona' WHERE id='00000000-0000-0000-0000-000000000023';
UPDATE public.profiles SET apellido='Mamani Torrico', zona_id='00000000-0000-0000-0000-000000000004', telefono='+591 71100004', rol='supervisor_zona' WHERE id='00000000-0000-0000-0000-000000000024';
UPDATE public.profiles SET apellido='Herrera Guzman', zona_id='00000000-0000-0000-0000-000000000005', telefono='+591 71100005', rol='supervisor_zona' WHERE id='00000000-0000-0000-0000-000000000025';

-- REPARTIDORES (6, sin auth user — operativos)
INSERT INTO public.repartidores (id, nombre, apellido, ci, telefono, zona_id, vehiculo_id) VALUES
  ('00000000-0000-0000-0000-000000000031','Miguel',   'Quispe Mamani',  '7891245','+591 72234001','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000032','Javier',   'Rojas Vaca',     '6543219','+591 72234002','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000033','Ernesto',  'Padilla Cruz',   '5678903','+591 72234003','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000013'),
  ('00000000-0000-0000-0000-000000000034','Fernando', 'Montero Suarez', '3456781','+591 72234004','00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000014'),
  ('00000000-0000-0000-0000-000000000035','Luis',     'Chambi Torrico', '8901234','+591 72234005','00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000015'),
  ('00000000-0000-0000-0000-000000000036','Rodrigo',  'Vargas Flores',  '2345678','+591 72234006','00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000016');

-- CLIENTES (31 de BD_Clientes.md)
-- [ver arriba en el historial de ejecución]

-- PRODUCTOS (25 farmacéuticos)
-- [ver arriba en el historial de ejecución]

-- RUTAS + PEDIDOS + ITEMS — generados via DO block
-- 60 rutas (12 por zona), 210 pedidos, 420 items
-- Fechas: Jan–Jun 2025, códigos RD-2025-XXXX / RUTA-2025-XXX
-- Distribución estados: entregado 63%, fallido 25%, cancelado 12%
