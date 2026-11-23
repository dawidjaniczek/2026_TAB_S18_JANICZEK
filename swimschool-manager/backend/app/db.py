import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row

# Ładuje .env z głównego katalogu swimschool-manager/
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "swimschool")
DB_USER = os.getenv("POSTGRES_USER", "delfin_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "delfin_secret_pass")

DSN = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def get_connection():
    return psycopg.connect(DSN, row_factory=dict_row)