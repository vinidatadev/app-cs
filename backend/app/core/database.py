from contextlib import contextmanager

import psycopg2
import psycopg2.extras

from app.core.config import settings


def connect():
    return psycopg2.connect(
        settings.DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor,
        connect_timeout=10,
    )


@contextmanager
def get_cursor(commit=False):
    conn = connect()
    try:
        with conn.cursor() as cur:
            yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
