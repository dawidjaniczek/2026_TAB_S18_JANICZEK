# SwimSchool Manager

## Szybki start bazy danych (Docker)
1. Zainstaluj i uruchom Docker Desktop.
2. Skopiuj plik `.env.example` i nazwij kopię `.env`.
3. W głównym katalogu uruchom:
   `docker compose up -d`
4. Dostępne narzędzia:
   - PostgreSQL (lokalnie dla aplikacji): `localhost:5432`
   - Adminer: http://localhost:8080 (serwer: `db`)
   - pgAdmin 4: http://localhost:5050 (serwer: `db`)

## Reset bazy (po zmianach w `db/init/*.sql`)
`docker compose down -v && docker compose up -d`