"""In-memory fixed-window rate limiter (decision D23: single instance in the MVP).

Keys are opaque strings (e.g. "login:ip:1.2.3.4"). Not shared across processes; replace
with a Redis-backed limiter before running more than one API instance.
"""

import threading
import time
from collections import defaultdict


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def check(self, key: str, *, limit: int, window_seconds: int) -> bool:
        """Record a hit and return True when the call is allowed."""
        now = time.monotonic()
        with self._lock:
            hits = [t for t in self._hits[key] if now - t < window_seconds]
            allowed = len(hits) < limit
            if allowed:
                hits.append(now)
            self._hits[key] = hits
            return allowed

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


limiter = RateLimiter()
