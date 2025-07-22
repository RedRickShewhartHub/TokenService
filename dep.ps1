$dirs = "api-gateway","transfer-service","balance-service","gas-service"
foreach ($d in $dirs) {
  Write-Host "▶ $d"
  Set-Location $d
  Remove-Item -Recurse -Force node_modules, package-lock.json
  npm install
  Set-Location ..
}