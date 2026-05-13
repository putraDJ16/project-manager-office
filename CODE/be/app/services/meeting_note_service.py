from sqlalchemy import String, func, or_

from app.extensions import db
from app.models import Employee, ProjectMeeting, ProjectMeetingActionItem, ProjectMeetingFile, ProjectMeetingNote
from app.services.meeting_service import _ensure_meeting, _parse_date
from app.utils.exceptions import ApiError


def _ensure_note(project_id: str, meeting_id: int):
    meeting = _ensure_meeting(project_id, meeting_id)
    if not meeting.note:
        raise ApiError("Catatan meeting tidak ditemukan.", status_code=404)
    return meeting.note


def _normalize_decisions(value):
    if not value:
        return []
    if not isinstance(value, list):
        raise ApiError("decisions harus berupa array string.", errors={"decisions": "invalid"})
    return [str(item).strip() for item in value if str(item).strip()]


def _validate_assignee(employee_id: str | None):
    if not employee_id:
        return None
    employee_id = str(employee_id).strip()
    if not employee_id:
        return None
    if not Employee.query.get(employee_id):
        raise ApiError("Assignee action item tidak ditemukan.", errors={"assignee_employee_id": "not_found"})
    return employee_id


def _apply_action_payload(action_item: ProjectMeetingActionItem, payload: dict, order_index: int | None = None):
    if "description" in payload or action_item.id is None:
        description = (payload.get("description") or "").strip()
        if not description:
            raise ApiError("Deskripsi action item wajib diisi.", errors={"description": "required"})
        action_item.description = description
    if "assignee_employee_id" in payload or action_item.id is None:
        action_item.assignee_employee_id = _validate_assignee(payload.get("assignee_employee_id"))
    if "due_date" in payload or action_item.id is None:
        action_item.due_date = _parse_date(payload.get("due_date"), "due_date")
    if "is_done" in payload:
        action_item.is_done = bool(payload.get("is_done"))
    if "order_index" in payload:
        action_item.order_index = int(payload.get("order_index") or 0)
    elif order_index is not None:
        action_item.order_index = order_index


def get_note(project_id: str, meeting_id: int):
    meeting = _ensure_meeting(project_id, meeting_id)
    return meeting.note


def upsert_note(project_id: str, meeting_id: int, payload: dict, user_id: int | None = None):
    meeting = _ensure_meeting(project_id, meeting_id)
    note = meeting.note
    if not note:
        note = ProjectMeetingNote(meeting_id=meeting.id, created_by=user_id)
        db.session.add(note)
        db.session.flush()

    note.summary = (payload.get("summary") or "").strip() or None
    note.notes = (payload.get("notes") or "").strip() or None
    note.decisions = _normalize_decisions(payload.get("decisions"))
    note.last_edited_by = user_id

    if "action_items" in payload:
        for existing in list(note.action_items):
            db.session.delete(existing)
        db.session.flush()
        for index, item_payload in enumerate(payload.get("action_items") or []):
            action_item = ProjectMeetingActionItem(meeting_note_id=note.id)
            _apply_action_payload(action_item, item_payload, order_index=index)
            db.session.add(action_item)

    db.session.commit()
    return note


def delete_note(project_id: str, meeting_id: int):
    note = _ensure_note(project_id, meeting_id)
    db.session.delete(note)
    db.session.commit()


def create_action_item(project_id: str, meeting_id: int, payload: dict):
    note = _ensure_note(project_id, meeting_id)
    action_item = ProjectMeetingActionItem(meeting_note_id=note.id, order_index=len(note.action_items or []))
    _apply_action_payload(action_item, payload)
    db.session.add(action_item)
    db.session.commit()
    return action_item


def update_action_item(project_id: str, meeting_id: int, item_id: int, payload: dict):
    note = _ensure_note(project_id, meeting_id)
    action_item = ProjectMeetingActionItem.query.filter_by(id=item_id, meeting_note_id=note.id).first()
    if not action_item:
        raise ApiError("Action item tidak ditemukan.", status_code=404)
    _apply_action_payload(action_item, payload)
    db.session.commit()
    return action_item


def delete_action_item(project_id: str, meeting_id: int, item_id: int):
    note = _ensure_note(project_id, meeting_id)
    action_item = ProjectMeetingActionItem.query.filter_by(id=item_id, meeting_note_id=note.id).first()
    if not action_item:
        raise ApiError("Action item tidak ditemukan.", status_code=404)
    db.session.delete(action_item)
    db.session.commit()


def list_project_meeting_notes(project_id: str, filters: dict | None = None):
    filters = filters or {}
    query = ProjectMeetingNote.query.join(ProjectMeeting).filter(ProjectMeeting.project_id == project_id)

    search = (filters.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                ProjectMeeting.title.ilike(like),
                ProjectMeetingNote.summary.ilike(like),
                ProjectMeetingNote.notes.ilike(like),
                func.cast(ProjectMeetingNote.decisions, String).ilike(like),
            )
        )

    start_date = _parse_date(filters.get("start_date"), "start_date")
    end_date = _parse_date(filters.get("end_date"), "end_date")
    if start_date:
        query = query.filter(func.date(ProjectMeeting.start_datetime) >= start_date)
    if end_date:
        query = query.filter(func.date(ProjectMeeting.start_datetime) <= end_date)

    notes = query.order_by(ProjectMeeting.start_datetime.desc(), ProjectMeeting.id.desc()).all()
    if str(filters.get("has_open_action") or "").lower() in {"true", "1", "yes"}:
        notes = [note for note in notes if any(not item.is_done for item in note.action_items)]

    summaries = []
    for note in notes:
        total = len(note.action_items or [])
        open_count = len([item for item in note.action_items if not item.is_done])
        summaries.append(
            {
                "meeting_id": note.meeting_id,
                "title": note.meeting.title if note.meeting else "",
                "start_datetime": note.meeting.start_datetime if note.meeting else None,
                "summary": note.summary,
                "decisions_count": len(note.decisions or []),
                "action_items_open": open_count,
                "action_items_total": total,
                "files_count": ProjectMeetingFile.query.filter_by(meeting_id=note.meeting_id).count(),
                "last_edited_by": note.last_editor.display_name if note.last_editor else None,
                "updated_at": note.updated_at,
            }
        )
    return summaries
