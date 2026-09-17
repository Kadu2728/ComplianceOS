# syntax=docker/dockerfile:1.7
# Compliance OS API — production image (decision D17).
# uv-managed virtualenv, no dev dependencies, non-root user; migrations + content seed run in
# the entrypoint before the server starts, so a deploy is a single unit.

FROM python:3.12-slim AS runtime

COPY --from=ghcr.io/astral-sh/uv:0.8 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Dependencies first (cached until the lockfile changes), project code after.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev \
    && chmod +x docker-entrypoint.sh \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin app \
    && chown -R app:app /app

USER app
ENV PATH="/app/.venv/bin:$PATH" \
    PORT=8000 \
    WEB_CONCURRENCY=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", \"8000\")}/api/v1/health', timeout=4)"

ENTRYPOINT ["./docker-entrypoint.sh"]
