FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV PYTHONPATH=/app
ENV NEXUS_DB_PATH=/home/hitesh/nexus/data/nexus.db

EXPOSE 8500

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8500", "--workers", "1"]
