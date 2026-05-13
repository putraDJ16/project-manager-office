from datetime import date, datetime, time, timezone

from sqlalchemy import or_

from app.extensions import db
from app.models import Employee, Project, ProjectMeeting, ProjectMeetingAttendee, ProjectMember, User
from app.utils.exceptions import ApiError


MEETING_TYPES = ("Online", "Offline")
MEETING_STATUSES = ("Scheduled", "In Progress", "Done", "Cancelled")
RSVP_STATUSES = ("Pending", "Accepted", "Declined")


def _ensure_project(project_id: str):
    project = Project.query.get(project_id)
    if not project:
        raise ApiError("Project tidak ditemukan.", status_code=404)
    return project


def _ensure_meeting(project_id: str, meeting_id: int):
    meeting = ProjectMeeting.query.filter_by(project_id=project_id, id=meeting_id).first()
    if not meeting:
        raise ApiError("Meeting tidak ditemukan.", status_code=404)
    return meeting


def _parse_datetime(value, field_name: str):
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            raise ApiError(f"{field_name} harus berupa datetime ISO yang valid.", errors={field_name: "invalid"})
    else:
        raise ApiError(f"{field_name} wajib diisi.", errors={field_name: "required"})

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _parse_date(value, field_name: str):
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        raise ApiError(f"{field_name} harus berupa tanggal ISO yang valid.", errors={field_name: "invalid"})


def _validate_attendees(project_id: str, attendee_ids):
    if not attendee_ids:
        return []
    normalized = list(dict.fromkeys(str(item).strip() for item in attendee_ids if str(item).strip()))
    if not normalized:
        return []

    project_member_ids = {
        member.employee_id
        for member in ProjectMember.query.with_entities(ProjectMember.employee_id).filter_by(project_id=project_id).all()
    }
    project = Project.query.get(project_id)
    if project and project.manager_id:
        project_member_ids.add(project.manager_id)

    employee_ids = {
        employee.id
        for employee in Employee.query.with_entities(Employee.id).filter(Employee.id.in_(normalized)).all()
    }
    missing_ids = sorted(set(normalized) - employee_ids)
    if missing_ids:
        raise ApiError("Peserta meeting tidak ditemukan.", errors={"attendee_ids": missing_ids})

    non_member_ids = sorted(set(normalized) - project_member_ids)
    if non_member_ids:
        raise ApiError("Peserta harus anggota project.", errors={"attendee_ids": non_member_ids})
    return normalized


def effective_meeting_status(meeting: ProjectMeeting, now: datetime | None = None):
    if meeting.status == "Cancelled":
        return "Cancelled"
    now = now or datetime.now(timezone.utc)
    start = meeting.start_datetime
    end = meeting.end_datetime
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    if now < start:
        return "Scheduled"
    if start <= now <= end:
        return "In Progress"
    return "Done"


def _apply_meeting_payload(meeting: ProjectMeeting, payload: dict, partial: bool = False):
    if not partial or "title" in payload:
        title = (payload.get("title") or "").strip()
        if not title:
            raise ApiError("Judul meeting wajib diisi.", errors={"title": "required"})
        meeting.title = title

    if not partial or "meeting_type" in payload:
        meeting_type = payload.get("meeting_type") or "Online"
        if meeting_type not in MEETING_TYPES:
            raise ApiError(f"Tipe meeting tidak valid. Pilihan: {', '.join(MEETING_TYPES)}")
        meeting.meeting_type = meeting_type

    if not partial or "start_datetime" in payload:
        meeting.start_datetime = _parse_datetime(payload.get("start_datetime"), "start_datetime")
    if not partial or "end_datetime" in payload:
        meeting.end_datetime = _parse_datetime(payload.get("end_datetime"), "end_datetime")
    if meeting.end_datetime <= meeting.start_datetime:
        raise ApiError("Waktu selesai harus lebih besar dari waktu mulai.", errors={"end_datetime": "invalid"})

    for field in ("description", "location", "meeting_url"):
        if not partial or field in payload:
            meeting_value = payload.get(field)
            setattr(meeting, field, str(meeting_value).strip() if meeting_value else None)

    if "status" in payload:
        status = payload.get("status") or "Scheduled"
        if status not in MEETING_STATUSES:
            raise ApiError(f"Status meeting tidak valid. Pilihan: {', '.join(MEETING_STATUSES)}")
        meeting.status = status


def list_meetings(project_id: str, filters: dict | None = None):
    _ensure_project(project_id)
    filters = filters or {}
    query = ProjectMeeting.query.filter_by(project_id=project_id)
    status = (filters.get("status") or "").strip()
    if status and status != "all":
        query = query.filter(ProjectMeeting.status == status)
    start_date = _parse_date(filters.get("start_date"), "start_date")
    end_date = _parse_date(filters.get("end_date"), "end_date")
    if start_date:
        query = query.filter(ProjectMeeting.start_datetime >= datetime.combine(start_date, time.min, tzinfo=timezone.utc))
    if end_date:
        query = query.filter(ProjectMeeting.start_datetime <= datetime.combine(end_date, time.max, tzinfo=timezone.utc))
    return query.order_by(ProjectMeeting.start_datetime.asc(), ProjectMeeting.id.asc()).all()


def create_meeting(project_id: str, payload: dict, user_id: int | None = None):
    _ensure_project(project_id)
    meeting = ProjectMeeting(project_id=project_id, created_by=user_id)
    _apply_meeting_payload(meeting, payload)
    db.session.add(meeting)
    db.session.flush()
    for employee_id in _validate_attendees(project_id, payload.get("attendee_ids") or []):
        db.session.add(ProjectMeetingAttendee(meeting_id=meeting.id, employee_id=employee_id))
    db.session.commit()
    return meeting


def get_meeting(project_id: str, meeting_id: int):
    return _ensure_meeting(project_id, meeting_id)


def update_meeting(project_id: str, meeting_id: int, payload: dict):
    meeting = _ensure_meeting(project_id, meeting_id)
    _apply_meeting_payload(meeting, payload, partial=True)
    if "attendee_ids" in payload:
        replace_attendees(project_id, meeting_id, payload.get("attendee_ids") or [])
    db.session.commit()
    return meeting


def delete_meeting(project_id: str, meeting_id: int):
    meeting = _ensure_meeting(project_id, meeting_id)
    db.session.delete(meeting)
    db.session.commit()


def add_attendees(project_id: str, meeting_id: int, attendee_ids):
    meeting = _ensure_meeting(project_id, meeting_id)
    existing_ids = {attendee.employee_id for attendee in meeting.attendees}
    added = []
    for employee_id in _validate_attendees(project_id, attendee_ids):
        if employee_id in existing_ids:
            continue
        attendee = ProjectMeetingAttendee(meeting_id=meeting.id, employee_id=employee_id)
        db.session.add(attendee)
        added.append(attendee)
    db.session.commit()
    return added


def replace_attendees(project_id: str, meeting_id: int, attendee_ids):
    meeting = _ensure_meeting(project_id, meeting_id)
    normalized_ids = set(_validate_attendees(project_id, attendee_ids))
    for attendee in list(meeting.attendees):
        if attendee.employee_id not in normalized_ids:
            db.session.delete(attendee)
    existing_ids = {attendee.employee_id for attendee in meeting.attendees}
    for employee_id in normalized_ids - existing_ids:
        db.session.add(ProjectMeetingAttendee(meeting_id=meeting.id, employee_id=employee_id))


def remove_attendee(project_id: str, meeting_id: int, employee_id: str):
    _ensure_meeting(project_id, meeting_id)
    attendee = ProjectMeetingAttendee.query.filter_by(meeting_id=meeting_id, employee_id=employee_id).first()
    if not attendee:
        raise ApiError("Peserta meeting tidak ditemukan.", status_code=404)
    db.session.delete(attendee)
    db.session.commit()


def rsvp_meeting(project_id: str, meeting_id: int, user: User, payload: dict):
    _ensure_meeting(project_id, meeting_id)
    if not user.employee_id:
        raise ApiError("User tidak terhubung dengan pegawai.", status_code=403)
    status = payload.get("rsvp_status")
    if status not in RSVP_STATUSES:
        raise ApiError(f"Status RSVP tidak valid. Pilihan: {', '.join(RSVP_STATUSES)}")
    attendee = ProjectMeetingAttendee.query.filter_by(meeting_id=meeting_id, employee_id=user.employee_id).first()
    if not attendee:
        raise ApiError("Anda bukan peserta meeting ini.", status_code=403)
    attendee.rsvp_status = status
    db.session.commit()
    return attendee


def list_my_calendar(user: User, start_date_value: str, end_date_value: str, project_ids_value: str | None = None):
    if not user.employee_id:
        return []
    start_date = _parse_date(start_date_value, "start_date")
    end_date = _parse_date(end_date_value, "end_date")
    if not start_date or not end_date:
        raise ApiError("start_date dan end_date wajib diisi.", errors={"date_range": "required"})
    if end_date < start_date:
        raise ApiError("end_date harus sama atau setelah start_date.", errors={"end_date": "invalid"})

    member_project_ids = {
        member.project_id
        for member in ProjectMember.query.with_entities(ProjectMember.project_id).filter_by(employee_id=user.employee_id).all()
    }
    managed_project_ids = {
        project.id
        for project in Project.query.with_entities(Project.id).filter_by(manager_id=user.employee_id).all()
    }
    allowed_project_ids = member_project_ids | managed_project_ids
    if project_ids_value:
        requested_ids = {item.strip() for item in project_ids_value.split(",") if item.strip()}
        allowed_project_ids &= requested_ids
    if not allowed_project_ids:
        return []

    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, time.max, tzinfo=timezone.utc)
    meetings = (
        ProjectMeeting.query.join(Project)
        .outerjoin(ProjectMeetingAttendee)
        .filter(ProjectMeeting.project_id.in_(allowed_project_ids))
        .filter(ProjectMeeting.start_datetime <= end_dt, ProjectMeeting.end_datetime >= start_dt)
        .filter(or_(ProjectMeetingAttendee.employee_id == user.employee_id, Project.manager_id == user.employee_id))
        .order_by(ProjectMeeting.start_datetime.asc(), ProjectMeeting.id.asc())
        .all()
    )
    result = []
    for meeting in meetings:
        my_attendee = next((item for item in meeting.attendees if item.employee_id == user.employee_id), None)
        result.append(
            {
                "meeting_id": meeting.id,
                "project_id": meeting.project_id,
                "project_name": meeting.project.name if meeting.project else "",
                "title": meeting.title,
                "start_datetime": meeting.start_datetime,
                "end_datetime": meeting.end_datetime,
                "meeting_type": meeting.meeting_type,
                "meeting_url": meeting.meeting_url,
                "status": effective_meeting_status(meeting),
                "my_rsvp": my_attendee.rsvp_status if my_attendee else None,
            }
        )
    return result
