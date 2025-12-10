# TrueMark Mint - Caleon Bubble Host Plugin Deployment Script
# Deploys bubble host assistant plugins for Caleon Worker and UCM services

param(
    [string]$PluginDir = ".\plugins",
    [string]$SystemConfig = ".\plugins\bubble-host-system-config.json"
)

Write-Host "🚀 Deploying TrueMark Mint Bubble Host Plugins..." -ForegroundColor Green

# Create plugin directory if it doesn't exist
if (!(Test-Path $PluginDir)) {
    New-Item -ItemType Directory -Path $PluginDir -Force
    Write-Host "📁 Created plugin directory: $PluginDir" -ForegroundColor Blue
}

# Validate plugin configurations
Write-Host "🔍 Validating plugin configurations..." -ForegroundColor Yellow
$pluginFiles = Get-ChildItem "$PluginDir\caleon-*.json"
foreach ($plugin in $pluginFiles) {
    Write-Host "✅ Validating $($plugin.Name)" -ForegroundColor Blue
    try {
        $json = Get-Content $plugin.FullName -Raw | ConvertFrom-Json
        Write-Host "✅ $($plugin.Name) is valid JSON" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($plugin.Name) contains invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Check system configuration
if (Test-Path $SystemConfig) {
    Write-Host "✅ System configuration found at $SystemConfig" -ForegroundColor Green

    Write-Host "🔗 Plugin registration commands:" -ForegroundColor Cyan
    Write-Host "  - Register Caleon Worker Plugin: Invoke-RestMethod -Method POST -Uri 'http://bubble-host:8080/api/plugins/register' -Body (Get-Content '$PluginDir\caleon-worker-plugin.json' -Raw) -ContentType 'application/json'" -ForegroundColor White
    Write-Host "  - Register Caleon UCM Plugin: Invoke-RestMethod -Method POST -Uri 'http://bubble-host:8080/api/plugins/register' -Body (Get-Content '$PluginDir\caleon-ucm-plugin.json' -Raw) -ContentType 'application/json'" -ForegroundColor White
}
else {
    Write-Host "⚠️  System configuration not found at $SystemConfig" -ForegroundColor Yellow
}

# Attempt to restart services (if running locally)
Write-Host "🔄 Checking for Caleon services..." -ForegroundColor Yellow
$services = @("caleon-worker", "caleon-ucm", "host-bubble-worker", "goat-system")
foreach ($service in $services) {
    try {
        $result = docker ps -q -f name=$service
        if ($result) {
            Write-Host "🔄 Restarting $service..." -ForegroundColor Blue
            docker restart $service
            Write-Host "✅ $service restarted" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  $service not running in Docker" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "⚠️  Could not check/restart $service : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Plugin deployment completed!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify plugin registration in bubble host dashboard" -ForegroundColor White
Write-Host "2. Test plugin functionality with TrueMark Mint operations" -ForegroundColor White
Write-Host "3. Monitor plugin performance and logs" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔗 Useful commands:" -ForegroundColor Cyan
Write-Host "  - Check plugin status: Invoke-RestMethod -Uri 'http://bubble-host:8080/api/plugins/status'" -ForegroundColor White
Write-Host "  - View plugin logs: docker logs caleon-worker" -ForegroundColor White
Write-Host "  - View system logs: docker logs goat-system" -ForegroundColor White