# ============================================================
# RapiDash CRM — Crear usuarios demo en Supabase Auth
# Ejecutar UNA SOLA VEZ después de configurar el proyecto.
#
# Requisitos previos:
#   1. Copiar tu service_role key de Supabase Dashboard →
#      Project Settings → API → service_role (secret)
#   2. Pegar la key en la variable $ServiceRoleKey a continuación
#      (o configurarla como variable de entorno SUPABASE_SERVICE_ROLE_KEY)
#
# Ejecutar desde PowerShell:
#   cd "ruta\al\proyecto"
#   .\scripts\crear-usuarios-demo.ps1
# ============================================================

$SupabaseUrl    = "https://vshgbwacnordnqzffcif.supabase.co"
$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $ServiceRoleKey) {
    # Lee desde .env.local si no está en variables de entorno
    $envFile = Join-Path $PSScriptRoot ".." ".env.local"
    if (Test-Path $envFile) {
        $envLines = Get-Content $envFile
        foreach ($line in $envLines) {
            if ($line -match "^VITE_SUPABASE_SERVICE_ROLE_KEY=(.+)$") {
                $ServiceRoleKey = $Matches[1].Trim()
                break
            }
        }
    }
}

if (-not $ServiceRoleKey -or $ServiceRoleKey -eq "AQUI_TU_SERVICE_ROLE_KEY") {
    Write-Host "ERROR: Configura VITE_SUPABASE_SERVICE_ROLE_KEY en .env.local" -ForegroundColor Red
    Write-Host "       Supabase Dashboard → Project Settings → API → service_role" -ForegroundColor Yellow
    exit 1
}

$Headers = @{
    "apikey"        = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type"  = "application/json"
}

# ─── Zona IDs (semilla) ──────────────────────────────────────
$ZONA_CENTRO = "00000000-0000-0000-0000-000000000001"

# ─── Usuarios demo ───────────────────────────────────────────
$Usuarios = @(
    @{
        usuario  = "admin"
        nombre   = "Weimar"
        apellido = "Miranda"
        password = "Rdash_Admin#2026"
        rol      = "admin"
        zona_id  = $null
    },
    @{
        usuario  = "supervisor.centro"
        nombre   = "Laura"
        apellido = "Vargas"
        password = "Rdash_SupCentro26"
        rol      = "supervisor_zona"
        zona_id  = $ZONA_CENTRO
    },
    @{
        usuario  = "carlos.mendoza"
        nombre   = "Carlos"
        apellido = "Mendoza"
        password = "Rdash_CRep#2026"
        rol      = "repartidor"
        zona_id  = $ZONA_CENTRO
    },
    @{
        usuario  = "farmacia.sanlucas"
        nombre   = "Farmacia"
        apellido = "San Lucas"
        password = "Rdash_SanLu#26"
        rol      = "cliente"
        zona_id  = $null
    }
)

Write-Host ""
Write-Host "RapiDash CRM — Creando usuarios demo" -ForegroundColor Cyan
Write-Host "=" * 50

foreach ($u in $Usuarios) {
    $email = "$($u.usuario)@rapidash.bo"
    Write-Host ""
    Write-Host "  Creando @$($u.usuario) ($($u.rol))..." -ForegroundColor Gray -NoNewline

    # 1. Crear en Supabase Auth
    $body = @{
        email         = $email
        password      = $u.password
        email_confirm = $true
    } | ConvertTo-Json

    try {
        $resp = Invoke-RestMethod `
            -Uri     "$SupabaseUrl/auth/v1/admin/users" `
            -Method  POST `
            -Headers $Headers `
            -Body    $body

        $userId = $resp.id
        Write-Host " Auth OK (id: $($userId.Substring(0,8))...)" -ForegroundColor Green

        # 2. Upsert en tabla profiles
        $profile = @{
            id       = $userId
            nombre   = $u.nombre
            apellido = $u.apellido
            rol      = $u.rol
            zona_id  = $u.zona_id
        } | ConvertTo-Json

        $profileHeaders = $Headers.Clone()
        $profileHeaders["Prefer"] = "resolution=merge-duplicates"

        Invoke-RestMethod `
            -Uri     "$SupabaseUrl/rest/v1/profiles?on_conflict=id" `
            -Method  POST `
            -Headers $profileHeaders `
            -Body    $profile | Out-Null

        Write-Host "             Profile OK" -ForegroundColor Green

    } catch {
        $errMsg = $_.ErrorDetails.Message
        if ($errMsg -match "already been registered") {
            Write-Host " Ya existe (saltando)" -ForegroundColor Yellow
        } else {
            Write-Host " ERROR: $errMsg" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=" * 50
Write-Host "Listo. Inicia sesion en el CRM con:" -ForegroundColor Cyan
Write-Host "  Usuario: admin" -ForegroundColor White
Write-Host "  Password: Rdash_Admin#2026" -ForegroundColor White
Write-Host ""
Write-Host "Ver todas las credenciales en CREDENCIALES.md" -ForegroundColor Gray
