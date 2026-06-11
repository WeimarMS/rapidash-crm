# RapiDash CRM — Contexto del Proyecto

## Negocio
RapiDash S.R.L. es una empresa ficticia de distribución farmacéutica 
de última milla en Santa Cruz de la Sierra, Bolivia.
Creada como proyecto de portafolio profesional por Weimar Miranda.

## Stack técnico
- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- Netlify (deploy con CI/CD desde GitHub)
- Claude Code (desarrollo)

## Supabase
- Project name: RapiDash-CRM
- Project ref: vshgbwacnordnqzffcif
- Region: South America (São Paulo)

## Estructura de carpetas
src/
  pages/        → una página por módulo
  components/   → componentes reutilizables
  lib/          → cliente supabase, helpers
  types/        → tipos TypeScript globales

## Módulos del CRM
1. Dashboard     → KPIs, métricas, gráficos
2. Pedidos       → CRUD + flujo de estados
3. Clientes      → farmacias, clínicas, consultorios
4. Productos     → catálogo + stock
5. Repartidores  → gestión + rendimiento
6. Rutas         → planificación diaria
7. Zonas         → 5 zonas de Santa Cruz
8. Incidencias   → pedidos fallidos y problemas
9. Analytics     → reportes y estadísticas

## Roles y RLS
- admin          → acceso total
- supervisor_zona → solo su zona
- repartidor     → solo sus pedidos del día
- cliente        → solo sus propios pedidos

## Convenciones
- Todo el texto de UI en español
- Moneda en Bs. (bolivianos)
- Códigos de pedido: RD-2025-0001
- Códigos de ruta: RUTA-2025-001
- Después de cada tabla nueva: correr GRANT en SQL Editor
- supabase login siempre con: supabase login --token TOKEN

## Datos seed
- 5 zonas
- 30 clientes (farmacias, clínicas, consultorios, centros de salud)
- 25 productos (analgésicos, antibióticos, vitaminas, insumos, vacunas)
- 6 repartidores + 6 vehículos
- 5 supervisores de zona
- ~200 pedidos distribuidos en 6 meses

## Repositorio y deploy
- GitHub: github.com/WeimarMS/rapidash-crm
- Netlify: rapidash-crm.netlify.app (pendiente)
- Variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Notas importantes Windows 11
- Siempre especificar si el comando va en PowerShell normal o Claude Code
- supabase login falla en Claude Code terminal → usar siempre --token
- GRANT manual después de cada tabla nueva en SQL Editor
