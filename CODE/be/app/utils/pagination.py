import base64
import json
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode

from flask import Request
from sqlalchemy import and_, or_, asc, desc
from sqlalchemy.orm import Query
from sqlalchemy.sql import func


def parse_pagination_args(request: Request) -> Tuple[int, Optional[Dict[str, Any]]]:
    """
    Parse and validate pagination parameters from request.
    
    Args:
        request: Flask request object
        
    Returns:
        Tuple of (per_page, cursor_payload)
        - per_page: Number of items per page (clamped to 1-100)
        - cursor_payload: Decoded cursor dict or None
        
    Raises:
        ValueError: If parameters are invalid
    """
    per_page = request.args.get("per_page", "15")
    try:
        per_page = int(per_page)
        per_page = max(1, min(100, per_page))
    except (ValueError, TypeError):
        raise ValueError("Parameter per_page tidak valid.")

    cursor_token = request.args.get("cursor")
    cursor_payload = None
    if cursor_token:
        try:
            cursor_payload = decode_cursor(cursor_token)
        except ValueError:
            raise ValueError("Cursor tidak valid.")

    return per_page, cursor_payload


def encode_cursor(values: List[Any], direction: str) -> str:
    if direction not in ("next", "prev"):
        raise ValueError("Direction cursor tidak valid.")

    payload = {"k": [_serialize_cursor_value(value) for value in values], "d": direction}
    json_str = json.dumps(payload, separators=(",", ":"))
    encoded = base64.urlsafe_b64encode(json_str.encode("utf-8")).decode("utf-8")
    return encoded.rstrip("=")


def decode_cursor(token: str) -> Dict[str, Any]:
    padding = (4 - len(token) % 4) % 4
    token_padded = token + ("=" * padding)

    try:
        json_str = base64.urlsafe_b64decode(token_padded).decode("utf-8")
        payload = json.loads(json_str)

        if not isinstance(payload, dict) or "k" not in payload or "d" not in payload:
            raise ValueError("Struktur cursor tidak valid.")

        if payload["d"] not in ("next", "prev"):
            raise ValueError("Arah cursor tidak valid.")

        if not isinstance(payload["k"], list):
            raise ValueError("Nilai cursor tidak valid.")

        return {
            "k": [_deserialize_cursor_value(value) for value in payload["k"]],
            "d": payload["d"],
        }
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(str(exc))


def paginate(
    query: Query,
    sort_spec: List[Tuple[Any, str]],
    per_page: int,
    cursor_payload: Optional[Dict[str, Any]],
    request: Request
) -> Dict[str, Any]:
    """
    Apply cursor-based pagination to a SQLAlchemy query.
    
    Args:
        query: Base SQLAlchemy query (already filtered)
        sort_spec: List of (column, direction) tuples. Last column must be unique (e.g., id).
                   Direction is "asc" or "desc".
        per_page: Number of items per page
        cursor_payload: Decoded cursor dict or None for first page
        request: Flask request object for building links
        
    Returns:
        Dict with:
        - items: List of query results for this page
        - meta: Dict with total, per_page, count, has_next, has_prev
        - links: Dict with self, next, prev URLs
    """
    total = query.with_entities(func.count()).scalar() or 0

    direction = cursor_payload["d"] if cursor_payload else "next"
    cursor_values = cursor_payload["k"] if cursor_payload else None

    order_clauses = []
    for col, sort_dir in sort_spec:
        if sort_dir.lower() == "desc":
            order_clauses.append(desc(col))
        else:
            order_clauses.append(asc(col))

    if cursor_values:
        keyset_filter = build_keyset_filter(sort_spec, cursor_values, direction)
        query = query.filter(keyset_filter)

    if direction == "prev":
        reversed_order = []
        for col, sort_dir in sort_spec:
            if sort_dir.lower() == "desc":
                reversed_order.append(asc(col))
            else:
                reversed_order.append(desc(col))
        order_clauses = reversed_order

    query = query.order_by(*order_clauses)

    results = query.limit(per_page + 1).all()

    has_more = len(results) > per_page
    if has_more:
        results = results[:per_page]

    if direction == "prev":
        results = list(reversed(results))

    if direction == "next":
        has_next = has_more
        has_prev = cursor_payload is not None
    else:
        has_next = cursor_payload is not None
        has_prev = has_more

    next_cursor = None
    prev_cursor = None

    if results:
        if has_next:
            last_item = results[-1]
            next_values = [getattr(last_item, col.key) for col, _ in sort_spec]
            next_cursor = encode_cursor(next_values, "next")

        if has_prev:
            first_item = results[0]
            prev_values = [getattr(first_item, col.key) for col, _ in sort_spec]
            prev_cursor = encode_cursor(prev_values, "prev")

    base_path = request.path
    query_params = request.args.to_dict(flat=True)
    query_params["per_page"] = str(per_page)

    query_params_self = {k: v for k, v in query_params.items() if k != "cursor"}
    self_link = build_url(base_path, query_params_self)

    next_link = None
    if next_cursor:
        query_params_next = query_params.copy()
        query_params_next["cursor"] = next_cursor
        next_link = build_url(base_path, query_params_next)

    prev_link = None
    if prev_cursor:
        query_params_prev = query_params.copy()
        query_params_prev["cursor"] = prev_cursor
        prev_link = build_url(base_path, query_params_prev)

    return {
        "items": results,
        "meta": {
            "total": total,
            "per_page": per_page,
            "count": len(results),
            "has_next": has_next,
            "has_prev": has_prev,
        },
        "links": {
            "self": self_link,
            "next": next_link,
            "prev": prev_link,
        },
    }


def build_keyset_filter(
    sort_spec: List[Tuple[Any, str]],
    cursor_values: List[Any],
    direction: str
) -> Any:
    """
    Build SQLAlchemy filter for keyset pagination.
    
    Implements lexicographic comparison for multi-column sort keys.
    For mixed ASC/DESC columns, expands to proper comparison logic.
    
    Args:
        sort_spec: List of (column, direction) tuples
        cursor_values: Values from cursor
        direction: "next" or "prev"
        
    Returns:
        SQLAlchemy filter expression
    """
    if len(sort_spec) != len(cursor_values):
        raise ValueError("Sort spec and cursor values length mismatch")
    
    conditions = []

    for i in range(len(sort_spec)):
        col, sort_dir = sort_spec[i]
        val = cursor_values[i]

        prefix_equal = []
        for j in range(i):
            prefix_equal.append(sort_spec[j][0] == cursor_values[j])

        if direction == "next":
            if sort_dir.lower() == "asc":
                comparison = col > val
            else:
                comparison = col < val
        else:
            if sort_dir.lower() == "asc":
                comparison = col < val
            else:
                comparison = col > val

        if prefix_equal:
            conditions.append(and_(*prefix_equal, comparison))
        else:
            conditions.append(comparison)

    return or_(*conditions)


def build_url(path: str, params: Dict[str, str]) -> str:
    """
    Build URL from path and query parameters.
    
    Args:
        path: URL path
        params: Query parameters dict
        
    Returns:
        Complete URL with query string
    """
    if not params:
        return path
    return f"{path}?{urlencode(params)}"


def _serialize_cursor_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return {"t": "datetime", "v": value.isoformat()}
    if isinstance(value, date):
        return {"t": "date", "v": value.isoformat()}
    return value


def _deserialize_cursor_value(value: Any) -> Any:
    if not isinstance(value, dict):
        return value

    value_type = value.get("t")
    raw_value = value.get("v")

    if value_type == "datetime":
        return datetime.fromisoformat(raw_value)
    if value_type == "date":
        return date.fromisoformat(raw_value)
    return value
