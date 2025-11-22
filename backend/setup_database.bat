@echo off
echo Setting up Event Hub Database...
echo.
echo Make sure PostgreSQL is running and you have the correct password in .env file
echo.
psql -U postgres -d eventhub -f "../database/schema.sql"
echo.
psql -U postgres -d eventhub -f "../database/seed_data.sql"
echo.
echo Database setup complete!
pause