import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent

db_url = os.getenv("DATABASE_URL")
if db_url:
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        if not Path(db_path).is_absolute():
            # Resolve absolutely relative to BASE_DIR so that shifts in cwd do not drop the database
            db_url = f"sqlite:///{(BASE_DIR / db_path).resolve().as_posix()}"
else:
    db_url = f"sqlite:///{(BASE_DIR / 'voting.db').as_posix()}"

SQLALCHEMY_DATABASE_URL = db_url


engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
