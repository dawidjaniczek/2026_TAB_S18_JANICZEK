# SwimSchool Manager (AQUA MANAGER)

Wewnętrzna aplikacja webowa wspomagająca zarządzanie szkołą pływania.

## Stos technologiczny
- **Frontend:** React + TypeScript + Vite
- **Backend:** Python + FastAPI + `psycopg` (REST API + SQL)
- **Baza danych:** PostgreSQL 16 (uruchamiana w Dockerze)

## Wymagania wstępne
Zanim uruchomisz projekt lokalnie, zainstaluj:
1. **Docker Desktop** (musi być uruchomiony przed startem bazy)
2. **Python 3.11+**
3. **Node.js (LTS) + npm**

## Uruchomienie projektu krok po kroku (2 terminale)

Wszystkie komendy wykonuj z poziomu folderu `swimschool-manager/`.

### 1. Aktywacja środowisk: front/back/bd
1. Skopiuj plik `.env.example` i nazwij jego kopię `.env`.
2. Uruchom kontenery:
	- TERMINAL 1:
```
   docker compose up -d
   cd backend
   python -m venv .venv
```
Aktywacja środowiska wirtualnego:
	Windows (PowerShell): .\.venv\Scripts\Activate.ps1
	Windows (CMD): .\.venv\Scripts\activate.bat
	Linux / macOS: source .venv/bin/activate
```	
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
```
	- TERMINAL 2:
```
   cd frontend
   npm install
   npm run dev
```

### Poszczególne adresy: 
1. http://localhost:5173 - Frontend
2. http://localhost:8000/docs - Backend
3. http://localhost:8080 - Adminer

### KONTA TESTOWE:
- Administrator	admin@1.test	demo_hash_admin
- Recepcja		recepcja@1.test	demo_hash_rec
- Instruktor 1	inst1@1.test	demo_hash_inst1
- Instruktor 2	inst2@1.test	demo_hash_inst2

### Przydatne komendy :) 
```
   docker compose down -v //usuwa stare wolumeny bazy
   docker compose up -d
   docker compose logs db //logi bazy
   docker compose down //bez usuwania danych
```