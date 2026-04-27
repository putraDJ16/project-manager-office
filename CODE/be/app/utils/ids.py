import re


def next_string_id(values: list[str], prefix: str, default_start: int = 1, width: int | None = None):
    matcher = re.compile(rf"^{re.escape(prefix)}(\d+)$")
    max_value = default_start - 1
    for value in values:
        match = matcher.match(value)
        if not match:
            continue
        max_value = max(max_value, int(match.group(1)))
    next_value = max_value + 1
    if width:
        return f"{prefix}{str(next_value).zfill(width)}"
    return f"{prefix}{next_value}"
