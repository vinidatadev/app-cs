param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$AdminEmail = "admin@empresa.com",
  [string]$AdminPassword = "admin123"
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

function Check($name, $condition, $detail = "") {
  if ($condition) {
    Write-Output "OK   $name"
  } else {
    Write-Output "FAIL $name $detail"
    $failures.Add($name) | Out-Null
  }
}

$health = Invoke-RestMethod -Uri "http://localhost:8000/health"
Check "backend health" ($health.status -eq "ok" -and $health.database -eq $true)
Check "minio storage" ($health.storage -eq $true)

$frontend = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/"
Check "frontend" ($frontend.StatusCode -eq 200)

$login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
  login = $AdminEmail
  password = $AdminPassword
} | ConvertTo-Json)
Check "admin login" ([bool]$login.access_token)
$token = $login.access_token
$headers = @{ Authorization = "Bearer $token" }

try {
  Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/rest/v1/user?select=id&limit=1" | Out-Null
  Check "postgrest sem token retorna 401" $false
} catch {
  Check "postgrest sem token retorna 401" ($_.Exception.Response.StatusCode.value__ -eq 401)
}

$users = Invoke-RestMethod -Uri "$BaseUrl/rest/v1/user?select=id,nome_usuario,nivel&order=nome_usuario.asc" -Headers $headers
Check "postgrest com token" ($users.Count -ge 20) "(users=$($users.Count))"

$nested = Invoke-RestMethod -Uri "$BaseUrl/rest/v1/ind_grupo?select=*,ind_subgrupo(*,ind_indicador(*))" -Headers $headers
Check "embed de indicadores" ($null -ne $nested)

$org = Invoke-RestMethod -Uri "$BaseUrl/rest/v1/organograma?select=*&limit=1" -Headers $headers
Check "organograma" ($org.Count -ge 1)

$me = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Headers $headers
Check "sessao /me" ([bool]$me.user.id)

$photo = Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/api/storage/public/imagens/Image.jpg"
Check "arquivo no MinIO" ($photo.StatusCode -eq 200)

if ($failures.Count -gt 0) {
  Write-Output ""
  Write-Output "FALHAS: $($failures -join ', ')"
  exit 1
}

Write-Output ""
Write-Output "Smoke test concluido com sucesso."
