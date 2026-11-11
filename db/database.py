"""
Модуль подключения к базе данных SQLite и инициализации схемы.
Отвечает за: путь к файлу БД, открытие/закрытие соединения, применение DDL-схемы.
"""

from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

logger = logging.getLogger(__name__)

# Путь: <корень_проекта>/data/projects.db
DB_PATH: Path = Path(__file__).resolve().parent.parent / "data" / "projects.db"

SCHEMA_SQL: str = """
CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    address     TEXT,
    city        TEXT,
    customer    TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL,
    name            TEXT    NOT NULL,
    room_type       TEXT    NOT NULL DEFAULT 'other',
    area            REAL    NOT NULL,
    height          REAL    NOT NULL,
    parameters_json TEXT    NOT NULL DEFAULT '{}', -- сюда сохраняем JSON из калькулятора
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rooms_project ON rooms(project_id);

CREATE TABLE IF NOT EXISTS equipment_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id      INTEGER NOT NULL,
    module       TEXT    NOT NULL CHECK (module IN ('vent', 'heat', 'gas')),
    category     TEXT    NOT NULL,
    name         TEXT    NOT NULL,
    model        TEXT,
    manufacturer TEXT,
    quantity     REAL    NOT NULL DEFAULT 1.0 CHECK (quantity > 0),
    unit         TEXT    NOT NULL DEFAULT 'шт',
    price        REAL    CHECK (price IS NULL OR price >= 0),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_equipment_room ON equipment_items(room_id);

CREATE TRIGGER IF NOT EXISTS trg_projects_updated_at
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;
"""

def init_db() -> None:
    """Создаёт файл БД и применяет схему."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_connection() as conn:
        conn.executescript(SCHEMA_SQL)
    logger.info("SQLite database initialized at %s", DB_PATH)

@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Открывает соединение с включёнными внешними ключами."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()