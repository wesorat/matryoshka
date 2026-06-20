from datetime import datetime, timezone


def get_datetime_utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)
