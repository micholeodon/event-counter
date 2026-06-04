"""FastAPI app: event CRUD API + single-page countdown frontend."""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator

from . import db
from .config import LINGER_SECONDS

STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="Event Countdown")


@app.on_event("startup")
def _startup() -> None:
    db.init_db()


class EventIn(BaseModel):
    title: str
    start_utc: datetime

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be empty")
        return v


class EventOut(BaseModel):
    id: int
    title: str
    start_utc: str


def _to_utc_iso(dt: datetime) -> str:
    """Normalize a datetime to a UTC ISO-8601 string ending in Z."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.isoformat().replace("+00:00", "Z")


@app.post("/api/events", response_model=EventOut, status_code=201)
def create_event(payload: EventIn) -> dict:
    return db.create_event(payload.title, _to_utc_iso(payload.start_utc))


@app.get("/api/events", response_model=list[EventOut])
def list_events() -> list[dict]:
    return db.list_events()


@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: int) -> None:
    if not db.delete_event(event_id):
        raise HTTPException(status_code=404, detail="event not found")


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    """Serve the single page, inlining linger_seconds for the frontend."""
    html = (STATIC_DIR / "index.html").read_text()
    return html.replace("__LINGER_SECONDS__", str(LINGER_SECONDS))


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
