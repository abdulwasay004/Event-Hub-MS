# PowerShell script to set up Event Hub database
Write-Host "Setting up Event Hub Database..." -ForegroundColor Green
Write-Host ""

# Try to find PostgreSQL installation
$pgPath = ""
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
)

foreach ($path in $possiblePaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $pgPath = $found.FullName
        break
    }
}

if ($pgPath -eq "") {
    Write-Host "PostgreSQL psql not found in standard locations." -ForegroundColor Red
    Write-Host "Please use pgAdmin or SQL Shell (psql) manually:" -ForegroundColor Yellow
    Write-Host "1. Create database: CREATE DATABASE eventhub;" -ForegroundColor Yellow
    Write-Host "2. Run schema.sql file contents" -ForegroundColor Yellow
    Write-Host "3. Run seed_data.sql file contents" -ForegroundColor Yellow
    return
}

Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Green

# Set environment variable for password
$env:PGPASSWORD = "fast"

try {
    Write-Host "Creating database..." -ForegroundColor Blue
    & $pgPath -U postgres -h localhost -c "CREATE DATABASE eventhub;"
    
    Write-Host "Running schema..." -ForegroundColor Blue
    & $pgPath -U postgres -h localhost -d eventhub -f "..\database\schema.sql"
    
    Write-Host "Inserting sample data..." -ForegroundColor Blue
    & $pgPath -U postgres -h localhost -d eventhub -f "..\database\seed_data.sql"
    
    Write-Host ""
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host "You can now restart your backend server." -ForegroundColor Green
} catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    Write-Host "Please set up the database manually using pgAdmin." -ForegroundColor Yellow
}

# Clean up environment variable
Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Press any key to continue..."
$host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null