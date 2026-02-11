$base = 'http://localhost:3001'

Write-Output "Checking $base"

# Test 1
try {
  $r1 = Invoke-RestMethod -Uri ($base + '/api/buscar?q=jabon') -UseBasicParsing -TimeoutSec 5
  Write-Output "TEST1_OK total=$($r1.total)"
  if ($r1.results.Count -gt 0) { Write-Output "  first product: $($r1.results[0].producto.nombre)" }
} catch { Write-Output "TEST1_ERR: $($_.Exception.Message)" }

# Test 2
try {
  $r2 = Invoke-RestMethod -Uri ($base + '/api/buscar?q=detergente&sort=precio_asc') -UseBasicParsing -TimeoutSec 5
  Write-Output "TEST2_OK total=$($r2.total)"
  if ($r2.results.Count -gt 0) { Write-Output "  first price: $($r2.results[0].producto.precio_cop)" }
} catch { Write-Output "TEST2_ERR: $($_.Exception.Message)" }

# Test 3: category filter
try {
  $cat = 'ASEO'
  $r3 = Invoke-RestMethod -Uri ($base + ('/api/buscar?q=detergente&category=' + $cat)) -UseBasicParsing -TimeoutSec 5
  Write-Output "TEST3_OK total=$($r3.total)"
} catch { Write-Output "TEST3_ERR: $($_.Exception.Message)" }

# Test 4: navigation to bodega page
try {
  $r4 = Invoke-WebRequest -Uri ($base + '/bodegas/BOD_001') -UseBasicParsing -TimeoutSec 5
  Write-Output "TEST4_STATUS: $($r4.StatusCode)"
} catch { Write-Output "TEST4_NAV_FAIL: $($_.Exception.Message)" }
