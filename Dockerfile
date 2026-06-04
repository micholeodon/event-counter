FROM python:3.13-slim

WORKDIR /srv

# Install dependencies from pyproject (no build step needed for runtime).
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir fastapi "uvicorn[standard]"

# App code + static assets.
COPY app ./app

# SQLite lives on a mounted volume.
ENV DB_PATH=/data/events.db
ENV LINGER_SECONDS=3600
VOLUME ["/data"]

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
