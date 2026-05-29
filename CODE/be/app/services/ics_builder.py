from __future__ import annotations

from datetime import datetime, timezone


def _fmt_dt(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _escape(value: str | None) -> str:
    return (value or "").replace("\\", "\\\\").replace(";", r"\;").replace(",", r"\,").replace("\n", r"\n")


def build_meeting_ics(meeting, attendees=None, method: str = "REQUEST", organizer_email: str | None = None) -> str:
    uid = f"meeting-{meeting.id}@pmo.indocyber.id"
    now = _fmt_dt(datetime.now(timezone.utc))
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Indocyber//PMO//ID",
        "CALSCALE:GREGORIAN",
        f"METHOD:{method}",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{now}",
        f"DTSTART:{_fmt_dt(meeting.start_datetime)}",
        f"DTEND:{_fmt_dt(meeting.end_datetime)}",
        f"SUMMARY:{_escape(meeting.title)}",
        f"DESCRIPTION:{_escape(getattr(meeting, 'description', '') or getattr(meeting, 'meeting_url', '') or '')}",
        f"LOCATION:{_escape(getattr(meeting, 'location', '') or '')}",
        f"STATUS:{'CANCELLED' if method == 'CANCEL' else 'CONFIRMED'}",
    ]
    if getattr(meeting, "meeting_url", None):
        lines.append(f"URL:{_escape(meeting.meeting_url)}")
    if organizer_email:
        lines.append(f"ORGANIZER:MAILTO:{organizer_email}")
    for attendee in attendees or []:
        email = getattr(attendee, "email", None) or getattr(getattr(attendee, "employee", None), "email", None)
        name = getattr(attendee, "display_name", None) or getattr(getattr(attendee, "employee", None), "name", None) or email
        if email:
            lines.append(f"ATTENDEE;CN={_escape(name)};ROLE=REQ-PARTICIPANT:MAILTO:{email}")
    lines.extend(["END:VEVENT", "END:VCALENDAR", ""])
    return "\r\n".join(lines)
