-- ============================================================
-- seed-additional-pedidos.sql
-- Agrega 73 pedidos NUEVOS sin modificar los 211 existentes
-- Norte +40, Este +20, Centro +10, Oeste +3, Sur +0
-- Resultado esperado: Norte 82, Este 63, Centro 52, Oeste 45, Sur 42 (284 total)
-- Generado: 2026-08-24
-- ============================================================
-- NOTA: pedido_items.subtotal es GENERATED ALWAYS — NO incluir en INSERT

DO $$
DECLARE
  -- Zonas
  z_norte  UUID := '00000000-0000-0000-0000-000000000002';
  z_este   UUID := '00000000-0000-0000-0000-000000000004';
  z_centro UUID := '00000000-0000-0000-0000-000000000001';
  z_oeste  UUID := '00000000-0000-0000-0000-000000000005';

  -- Repartidores por zona
  r_javier   UUID := '00000000-0000-0000-0000-000000000032'; -- Norte
  r_rodrigo  UUID := '00000000-0000-0000-0000-000000000036'; -- Norte
  r_miguel   UUID := '00000000-0000-0000-0000-000000000031'; -- Centro
  r_fernando UUID := '00000000-0000-0000-0000-000000000034'; -- Este
  r_luis     UUID := '00000000-0000-0000-0000-000000000035'; -- Oeste

  -- Productos (precio_unitario referencial para calcular total manual)
  p_amox UUID := 'fa579d5d-568d-4de3-8f4c-a2a7a0b49362'; -- Amoxicilina 500mg   42.00
  p_aspi UUID := '04b1fdc5-f754-4882-bec9-a0cff3fdec21'; -- Aspirina 100mg       12.00
  p_azit UUID := '4c126678-a5db-425c-a9ee-f8cf51514505'; -- Azitromicina 500mg   65.00
  p_cipr UUID := '233eca4f-3630-4ac5-b79c-a3ff3a110ec5'; -- Ciprofloxacina 500mg 55.00
  p_comp UUID := 'a948d615-d92e-45a8-b252-54cf30691af9'; -- Complejo B Forte     28.00
  p_doxi UUID := '2ea8115a-0761-46de-81d0-3deb1d0758c0'; -- Doxiciclina 100mg    48.00
  p_gasa UUID := 'b408a1bd-4fc7-4cb4-a3d1-202a3b9862a7'; -- Gasas esteriles      15.00
  p_guan UUID := 'd0e2c743-4310-4334-bc05-69932be83084'; -- Guantes Nitrilo      55.00
  p_ibup UUID := '9884b5eb-90cf-45e8-866c-d2aa797a02d1'; -- Ibuprofeno 400mg      8.50
  p_jeri UUID := '45c47f32-3778-462e-81cb-e4a20a70346e'; -- Jeringas 10ml        18.00
  p_keto UUID := '7e5472a3-7693-4391-8acc-46c1b600074b'; -- Ketoprofeno 100mg    28.50
  p_metr UUID := 'f4c70723-e5f6-40bb-88ea-b9dc36a7ec2f'; -- Metronidazol 500mg   35.00
  p_napr UUID := 'c6f9c76d-0733-41d4-97b4-017bfbbfda95'; -- Naproxeno 550mg      18.00
  p_para UUID := 'f10fcc2b-db18-40c5-bff7-2317debaf3a2'; -- Paracetamol 500mg     5.50
  p_suer UUID := '64b2b841-cb12-42e4-8870-77251b965f11'; -- Suero Fisiologico    12.50
  p_vitc UUID := '2bcbb6de-1b30-4ae8-8e7b-8560dad1a296'; -- Vitamina C 1000mg    38.00
  p_vitd UUID := '99d7d17a-f4e5-4bbf-8478-899211cbf493'; -- Vitamina D3 2000UI   45.00
  p_zinc UUID := '55313fc3-6f5c-43e5-8f7d-7af717bb8775'; -- Zinc 50mg            32.00
  p_alco UUID := '3b00f804-d482-40be-9c75-4d4bc5e6afa6'; -- Alcohol Isopropilico 22.00
  p_acid UUID := '7e0e2eee-b2e0-4559-b32d-f0746f8c60f8'; -- Acido Folico 5mg     18.50

  -- Clientes Norte (10)
  nc1  UUID := '0d37ea56-e0c9-4447-96a3-c18425f0d9c1';
  nc2  UUID := '12adf927-b940-451a-8734-cbcf5615fcb9';
  nc3  UUID := '3167eee9-2deb-427e-ba36-f6dc23270d32';
  nc4  UUID := '3b58ed09-cdb3-46ba-9f17-a8ba1ea6eef5';
  nc5  UUID := '85ec8821-5120-426e-8439-4496d73328b0';
  nc6  UUID := '9cb0bc27-1953-4339-86cf-a14182bd50a8';
  nc7  UUID := 'b28943d9-2191-4d99-8b6a-a3dc3d06b2f0';
  nc8  UUID := 'ca2740a5-e1e5-4d12-a01a-804ac00a3b59';
  nc9  UUID := 'd916dd82-bb9f-46ee-976f-48001fe58a96';
  nc10 UUID := 'f24fcbbb-206f-4cb6-9606-598270df1e56';

  -- Clientes Este (6)
  ec1 UUID := '10fd066c-d1d2-436f-9c27-841799d65ce6';
  ec2 UUID := '4537d095-fa89-4c0e-891e-927c15649c1c';
  ec3 UUID := '8271f4ad-b0d3-47fd-b653-8b5e413a758a';
  ec4 UUID := '95fc2c6e-e925-4319-95b4-8328d3079d3e';
  ec5 UUID := 'adfa3154-8645-4319-87bd-9288dba8b611';
  ec6 UUID := 'f5b057c2-a707-47fc-a32c-8523a128ddbb';

  -- Clientes Centro (3)
  cc1 UUID := '37ae406f-42a7-4e0d-a705-88e1c631c503';
  cc2 UUID := '64b97889-dbd1-4b70-930a-54865cf46a69';
  cc3 UUID := 'ed43653c-9bfc-4b52-af85-027681a014a8';

  -- Clientes Oeste (3 de 7, rotando)
  oc1 UUID := '068a1a42-edcd-4eed-8a74-41a404733de9';
  oc2 UUID := '2592febf-0ae8-4259-9cb2-03d8291252a0';
  oc3 UUID := 'fc632743-e8ec-48ba-8031-90877c90d877';

  pid UUID;
BEGIN

  -- ═══════════════════════════════════════════════════════════════════════
  -- ZONA NORTE +40  (RD-2026-0002 → RD-2026-0041)
  -- 26 entregado · 10 fallido · 4 cancelado
  -- Combos de ítems:
  --   A: amox×2(42) + ibup×2(8.5)               = 101.00
  --   B: vitc×3(38) + vitd×2(45) + zinc×2(32)   = 268.00
  --   C: gasa×3(15) + guan×2(55) + jeri×2(18)   = 191.00
  --   D: para×3(5.5)+ aspi×2(12) + napr×2(18)   =  76.50
  --   E: cipr×3(55)                              = 165.00
  --   F: metr×2(35) + comp×2(28)                = 126.00
  --   G: azit×2(65)                              = 130.00
  --   H: doxi×2(48) + keto×2(28.5)              = 153.00
  --   I: suer×4(12.5)+ gasa×3(15)               =  95.00
  --   J: vitc×2(38) + zinc×2(32)                = 140.00
  --   K: alco×3(22) + guan×1(55)                = 121.00
  --   L: para×5(5.5)+ ibup×3(8.5)               =  53.00
  --   M: amox×3(42) + napr×2(18)                = 162.00
  --   N: cipr×2(55) + gasa×2(15)                = 140.00
  --   O: vitd×3(45) + acid×2(18.5)              = 172.00
  -- ═══════════════════════════════════════════════════════════════════════

  -- 1 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0002',nc1,z_norte,r_javier,'entregado','2026-07-07','2026-07-08','2026-07-08',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 2 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0003',nc2,z_norte,r_rodrigo,'entregado','2026-07-08','2026-07-09','2026-07-09',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 3 entregado B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0004',nc3,z_norte,r_javier,'entregado','2026-07-09','2026-07-10','2026-07-10',268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 4 fallido D
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0005',nc4,z_norte,r_rodrigo,'fallido','2026-07-10','2026-07-11','2026-07-11',76.50) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,3,5.50),(pid,p_aspi,2,12.00),(pid,p_napr,2,18.00);

  -- 5 entregado G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0006',nc5,z_norte,r_javier,'entregado','2026-07-11','2026-07-12','2026-07-12',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 6 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0007',nc6,z_norte,r_rodrigo,'entregado','2026-07-12','2026-07-13','2026-07-13',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

  -- 7 fallido H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0008',nc7,z_norte,r_javier,'fallido','2026-07-13','2026-07-14','2026-07-14',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- 8 entregado M
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0009',nc8,z_norte,r_rodrigo,'entregado','2026-07-14','2026-07-15','2026-07-15',162.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,3,42.00),(pid,p_napr,2,18.00);

  -- 9 entregado K
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0010',nc9,z_norte,r_javier,'entregado','2026-07-15','2026-07-16','2026-07-16',121.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_alco,3,22.00),(pid,p_guan,1,55.00);

  -- 10 fallido C
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0011',nc10,z_norte,r_rodrigo,'fallido','2026-07-16','2026-07-17','2026-07-17',191.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_gasa,3,15.00),(pid,p_guan,2,55.00),(pid,p_jeri,2,18.00);

  -- 11 entregado N
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0012',nc1,z_norte,r_javier,'entregado','2026-07-17','2026-07-18','2026-07-18',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,2,55.00),(pid,p_gasa,2,15.00);

  -- 12 entregado O
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0013',nc2,z_norte,r_rodrigo,'entregado','2026-07-18','2026-07-19','2026-07-19',172.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitd,3,45.00),(pid,p_acid,2,18.50);

  -- 13 fallido A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0014',nc3,z_norte,r_javier,'fallido','2026-07-19','2026-07-20','2026-07-20',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 14 entregado J
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0015',nc4,z_norte,r_rodrigo,'entregado','2026-07-20','2026-07-21','2026-07-21',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,2,38.00),(pid,p_zinc,2,32.00);

  -- 15 entregado L
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0016',nc5,z_norte,r_javier,'entregado','2026-07-21','2026-07-22','2026-07-22',53.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,5,5.50),(pid,p_ibup,3,8.50);

  -- 16 cancelado E
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0017',nc6,z_norte,r_rodrigo,'cancelado','2026-07-22','2026-07-23',NULL,165.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,3,55.00);

  -- 17 entregado B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0018',nc7,z_norte,r_javier,'entregado','2026-07-23','2026-07-24','2026-07-24',268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 18 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0019',nc8,z_norte,r_rodrigo,'entregado','2026-07-24','2026-07-25','2026-07-25',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 19 fallido G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0020',nc9,z_norte,r_javier,'fallido','2026-07-25','2026-07-26','2026-07-26',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 20 entregado H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0021',nc10,z_norte,r_rodrigo,'entregado','2026-07-26','2026-07-27','2026-07-27',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- 21 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0022',nc1,z_norte,r_javier,'entregado','2026-07-27','2026-07-28','2026-07-28',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

  -- 22 fallido D
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0023',nc2,z_norte,r_rodrigo,'fallido','2026-07-28','2026-07-29','2026-07-29',76.50) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,3,5.50),(pid,p_aspi,2,12.00),(pid,p_napr,2,18.00);

  -- 23 entregado M
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0024',nc3,z_norte,r_javier,'entregado','2026-07-29','2026-07-30','2026-07-30',162.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,3,42.00),(pid,p_napr,2,18.00);

  -- 24 entregado K
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0025',nc4,z_norte,r_rodrigo,'entregado','2026-07-30','2026-07-31','2026-07-31',121.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_alco,3,22.00),(pid,p_guan,1,55.00);

  -- 25 fallido C
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0026',nc5,z_norte,r_javier,'fallido','2026-07-31','2026-08-01','2026-08-01',191.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_gasa,3,15.00),(pid,p_guan,2,55.00),(pid,p_jeri,2,18.00);

  -- 26 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0027',nc6,z_norte,r_rodrigo,'entregado','2026-08-01','2026-08-02','2026-08-02',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 27 entregado N
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0028',nc7,z_norte,r_javier,'entregado','2026-08-02','2026-08-03','2026-08-03',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,2,55.00),(pid,p_gasa,2,15.00);

  -- 28 cancelado J
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0029',nc8,z_norte,r_rodrigo,'cancelado','2026-08-03','2026-08-04',NULL,140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,2,38.00),(pid,p_zinc,2,32.00);

  -- 29 entregado O
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0030',nc9,z_norte,r_javier,'entregado','2026-08-04','2026-08-05','2026-08-05',172.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitd,3,45.00),(pid,p_acid,2,18.50);

  -- 30 fallido B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0031',nc10,z_norte,r_rodrigo,'fallido','2026-08-05','2026-08-06','2026-08-06',268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 31 entregado G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0032',nc1,z_norte,r_javier,'entregado','2026-08-06','2026-08-07','2026-08-07',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 32 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0033',nc2,z_norte,r_rodrigo,'entregado','2026-08-07','2026-08-08','2026-08-08',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 33 fallido H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0034',nc3,z_norte,r_javier,'fallido','2026-08-08','2026-08-09','2026-08-09',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- 34 entregado M
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0035',nc4,z_norte,r_rodrigo,'entregado','2026-08-09','2026-08-10','2026-08-10',162.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,3,42.00),(pid,p_napr,2,18.00);

  -- 35 entregado L
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0036',nc5,z_norte,r_javier,'entregado','2026-08-10','2026-08-11','2026-08-11',53.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,5,5.50),(pid,p_ibup,3,8.50);

  -- 36 cancelado E
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0037',nc6,z_norte,r_rodrigo,'cancelado','2026-08-11','2026-08-12',NULL,165.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,3,55.00);

  -- 37 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0038',nc7,z_norte,r_javier,'entregado','2026-08-12','2026-08-13','2026-08-13',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 38 fallido D
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0039',nc8,z_norte,r_rodrigo,'fallido','2026-08-13','2026-08-14','2026-08-14',76.50) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,3,5.50),(pid,p_aspi,2,12.00),(pid,p_napr,2,18.00);

  -- 39 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0040',nc9,z_norte,r_javier,'entregado','2026-08-14','2026-08-15','2026-08-15',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

  -- 40 cancelado K
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0041',nc10,z_norte,r_rodrigo,'cancelado','2026-08-15','2026-08-16',NULL,121.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_alco,3,22.00),(pid,p_guan,1,55.00);

  -- ═══════════════════════════════════════════════════════════════════════
  -- ZONA ESTE +20  (RD-2026-0042 → RD-2026-0061)
  -- 13 entregado · 5 fallido · 2 cancelado
  -- ═══════════════════════════════════════════════════════════════════════

  -- 1 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0042',ec1,z_este,r_fernando,'entregado','2026-07-07','2026-07-08','2026-07-08',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 2 entregado B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0043',ec2,z_este,r_fernando,'entregado','2026-07-10','2026-07-11','2026-07-11',268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 3 fallido C
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0044',ec3,z_este,r_fernando,'fallido','2026-07-13','2026-07-14','2026-07-14',191.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_gasa,3,15.00),(pid,p_guan,2,55.00),(pid,p_jeri,2,18.00);

  -- 4 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0045',ec4,z_este,r_fernando,'entregado','2026-07-16','2026-07-17','2026-07-17',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 5 entregado G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0046',ec5,z_este,r_fernando,'entregado','2026-07-19','2026-07-20','2026-07-20',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 6 fallido H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0047',ec6,z_este,r_fernando,'fallido','2026-07-22','2026-07-23','2026-07-23',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- 7 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0048',ec1,z_este,r_fernando,'entregado','2026-07-25','2026-07-26','2026-07-26',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

  -- 8 entregado J
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0049',ec2,z_este,r_fernando,'entregado','2026-07-28','2026-07-29','2026-07-29',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,2,38.00),(pid,p_zinc,2,32.00);

  -- 9 fallido D
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0050',ec3,z_este,r_fernando,'fallido','2026-07-31','2026-08-01','2026-08-01',76.50) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,3,5.50),(pid,p_aspi,2,12.00),(pid,p_napr,2,18.00);

  -- 10 entregado M
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0051',ec4,z_este,r_fernando,'entregado','2026-08-03','2026-08-04','2026-08-04',162.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,3,42.00),(pid,p_napr,2,18.00);

  -- 11 entregado N
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0052',ec5,z_este,r_fernando,'entregado','2026-08-06','2026-08-07','2026-08-07',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,2,55.00),(pid,p_gasa,2,15.00);

  -- 12 cancelado E
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0053',ec6,z_este,r_fernando,'cancelado','2026-08-09','2026-08-10',NULL,165.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,3,55.00);

  -- 13 entregado K
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0054',ec1,z_este,r_fernando,'entregado','2026-08-12','2026-08-13','2026-08-13',121.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_alco,3,22.00),(pid,p_guan,1,55.00);

  -- 14 fallido O
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0055',ec2,z_este,r_fernando,'fallido','2026-08-15','2026-08-16','2026-08-16',172.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitd,3,45.00),(pid,p_acid,2,18.50);

  -- 15 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0056',ec3,z_este,r_fernando,'entregado','2026-08-17','2026-08-18','2026-08-18',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 16 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0057',ec4,z_este,r_fernando,'entregado','2026-08-18','2026-08-19','2026-08-19',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 17 cancelado B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0058',ec5,z_este,r_fernando,'cancelado','2026-08-19','2026-08-20',NULL,268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 18 entregado G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0059',ec6,z_este,r_fernando,'entregado','2026-08-20','2026-08-21','2026-08-21',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 19 entregado L
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0060',ec1,z_este,r_fernando,'entregado','2026-08-21','2026-08-22','2026-08-22',53.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,5,5.50),(pid,p_ibup,3,8.50);

  -- 20 fallido H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0061',ec2,z_este,r_fernando,'fallido','2026-08-22','2026-08-23','2026-08-23',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- ═══════════════════════════════════════════════════════════════════════
  -- ZONA CENTRO +10  (RD-2026-0062 → RD-2026-0071)
  -- 7 entregado · 2 fallido · 1 cancelado
  -- ═══════════════════════════════════════════════════════════════════════

  -- 1 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0062',cc1,z_centro,r_miguel,'entregado','2026-07-07','2026-07-08','2026-07-08',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 2 entregado F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0063',cc2,z_centro,r_miguel,'entregado','2026-07-12','2026-07-13','2026-07-13',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 3 fallido G
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0064',cc3,z_centro,r_miguel,'fallido','2026-07-17','2026-07-18','2026-07-18',130.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_azit,2,65.00);

  -- 4 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0065',cc1,z_centro,r_miguel,'entregado','2026-07-22','2026-07-23','2026-07-23',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

  -- 5 entregado H
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0066',cc2,z_centro,r_miguel,'entregado','2026-07-27','2026-07-28','2026-07-28',153.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_doxi,2,48.00),(pid,p_keto,2,28.50);

  -- 6 cancelado B
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0067',cc3,z_centro,r_miguel,'cancelado','2026-08-01','2026-08-02',NULL,268.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,3,38.00),(pid,p_vitd,2,45.00),(pid,p_zinc,2,32.00);

  -- 7 entregado D
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0068',cc1,z_centro,r_miguel,'entregado','2026-08-06','2026-08-07','2026-08-07',76.50) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_para,3,5.50),(pid,p_aspi,2,12.00),(pid,p_napr,2,18.00);

  -- 8 fallido C
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0069',cc2,z_centro,r_miguel,'fallido','2026-08-11','2026-08-12','2026-08-12',191.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_gasa,3,15.00),(pid,p_guan,2,55.00),(pid,p_jeri,2,18.00);

  -- 9 entregado N
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0070',cc3,z_centro,r_miguel,'entregado','2026-08-16','2026-08-17','2026-08-17',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_cipr,2,55.00),(pid,p_gasa,2,15.00);

  -- 10 entregado J
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0071',cc1,z_centro,r_miguel,'entregado','2026-08-21','2026-08-22','2026-08-22',140.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_vitc,2,38.00),(pid,p_zinc,2,32.00);

  -- ═══════════════════════════════════════════════════════════════════════
  -- ZONA OESTE +3  (RD-2026-0072 → RD-2026-0074)
  -- 2 entregado · 1 fallido
  -- ═══════════════════════════════════════════════════════════════════════

  -- 1 entregado A
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0072',oc1,z_oeste,r_luis,'entregado','2026-07-15','2026-07-16','2026-07-16',101.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_amox,2,42.00),(pid,p_ibup,2,8.50);

  -- 2 fallido F
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0073',oc2,z_oeste,r_luis,'fallido','2026-08-01','2026-08-02','2026-08-02',126.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_metr,2,35.00),(pid,p_comp,2,28.00);

  -- 3 entregado I
  INSERT INTO pedidos(codigo,cliente_id,zona_id,repartidor_id,estado,fecha_pedido,fecha_entrega_estimada,fecha_entrega_real,total)
    VALUES('RD-2026-0074',oc3,z_oeste,r_luis,'entregado','2026-08-15','2026-08-16','2026-08-16',95.00) RETURNING id INTO pid;
  INSERT INTO pedido_items(pedido_id,producto_id,cantidad,precio_unitario) VALUES(pid,p_suer,4,12.50),(pid,p_gasa,3,15.00);

END $$;
