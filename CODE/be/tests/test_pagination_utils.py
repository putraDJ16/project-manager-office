from datetime import datetime

from app.utils.pagination import decode_cursor, encode_cursor


def test_cursor_round_trip_supports_datetime_values():
    created_at = datetime(2026, 6, 2, 10, 30, 45)

    token = encode_cursor([created_at, 42], "next")
    payload = decode_cursor(token)

    assert payload["d"] == "next"
    assert payload["k"] == [created_at, 42]
