"""Application version, read from installed package metadata (pyproject.toml is the source)."""

from importlib.metadata import PackageNotFoundError, version

PACKAGE_NAME = "compliance-os-api"


def get_app_version() -> str:
    """Return the installed package version, or "unknown" if the package is not installed."""
    try:
        return version(PACKAGE_NAME)
    except PackageNotFoundError:  # pragma: no cover - only when running outside `uv sync`
        return "unknown"


APP_VERSION = get_app_version()
