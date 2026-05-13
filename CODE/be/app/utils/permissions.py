from functools import wraps

from flask_jwt_extended import get_jwt_identity

from app.models import Project, ProjectMember, User
from app.utils.exceptions import ApiError

PERMISSION_ACTIONS = ("view", "create", "edit", "delete", "restore")
PERMISSION_FALLBACKS = {
    "projectPhases": ("masterProjects",),
    "projectMembers": ("masterProjects",),
    "projectIssues": ("issues", "masterProjects"),
    "projectTasks": ("tasks", "masterProjects"),
    "projectAttachments": ("masterProjects",),
    "projectMeetings": ("masterProjects",),
}

MODULE_KEYS = (
    "dashboard",
    "tasks",
    "issues",
    "workload",
    "masterEmployees",
    "masterProjects",
    "projectPhases",
    "projectMembers",
    "projectTasks",
    "projectTaskComments",
    "projectIssues",
    "projectAttachments",
    "projectMeetings",
    "masterRoles",
    "masterOrganizations",
    "masterOrganizationUnits",
    "masterPositions",
)


def empty_permission_set(overrides: dict | None = None):
    return {
        "view": False,
        "create": False,
        "edit": False,
        "delete": False,
        "restore": False,
        **(overrides or {}),
    }


def create_role_permissions(overrides: dict | None = None):
    overrides = overrides or {}
    return {module: empty_permission_set(overrides.get(module)) for module in MODULE_KEYS}


DEFAULT_ROLE_PERMISSIONS_BY_NAME = {
    "Administrator": create_role_permissions(
        {
            "dashboard": {"view": True},
            "tasks": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "issues": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "workload": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterEmployees": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterProjects": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectPhases": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectMembers": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectTasks": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectTaskComments": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectIssues": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectAttachments": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "projectMeetings": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterRoles": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterOrganizations": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterOrganizationUnits": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterPositions": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
        }
    ),
    "Project Manager": create_role_permissions(
        {
            "dashboard": {"view": True},
            "tasks": {"view": True, "create": True, "edit": True},
            "issues": {"view": True, "create": True, "edit": True},
            "workload": {"view": True},
            "masterProjects": {"view": True, "create": True, "edit": True},
            "projectPhases": {"view": True, "create": True, "edit": True},
            "projectMembers": {"view": True, "create": True, "delete": True},
            "projectTasks": {"view": True, "create": True, "edit": True},
            "projectTaskComments": {"view": True, "create": True},
            "projectIssues": {"view": True, "create": True, "edit": True},
            "projectAttachments": {"view": True, "create": True, "edit": True, "delete": True},
            "projectMeetings": {"view": True, "create": True, "edit": True, "delete": True},
            "masterOrganizations": {"view": True},
            "masterOrganizationUnits": {"view": True},
            "masterPositions": {"view": True},
        }
    ),
    "HR Admin": create_role_permissions(
        {
            "dashboard": {"view": True},
            "workload": {"view": True},
            "masterEmployees": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterRoles": {"view": True},
            "masterOrganizations": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterOrganizationUnits": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
            "masterPositions": {"view": True, "create": True, "edit": True, "delete": True, "restore": True},
        }
    ),
    "Viewer": create_role_permissions(
        {
            "dashboard": {"view": True},
            "tasks": {"view": True},
            "issues": {"view": True},
            "workload": {"view": True},
            "masterEmployees": {"view": True},
            "masterProjects": {"view": True},
            "projectPhases": {"view": True},
            "projectMembers": {"view": True},
            "projectTasks": {"view": True},
            "projectTaskComments": {"view": True},
            "projectIssues": {"view": True},
            "projectAttachments": {"view": True},
            "projectMeetings": {"view": True},
            "masterRoles": {"view": True},
            "masterOrganizations": {"view": True},
            "masterOrganizationUnits": {"view": True},
            "masterPositions": {"view": True},
        }
    ),
}


def normalize_permissions(permissions: dict | None):
    permissions = permissions or {}
    normalized = create_role_permissions()
    for module in MODULE_KEYS:
        current = permissions.get(module) or {}
        normalized[module] = {
            action: bool(current.get(action, False))
            for action in PERMISSION_ACTIONS
        }
    return normalized


def get_current_user():
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        raise ApiError("Token user tidak valid.", status_code=401)

    user = User.query.get(user_id)
    if not user or not user.is_active:
        raise ApiError("User tidak ditemukan atau tidak aktif.", status_code=401)
    return user


def get_user_permissions(user: User):
    return normalize_permissions(user.role.permissions if user.role else None)


def user_has_permission(user: User, module: str, action: str):
    if module not in MODULE_KEYS or action not in PERMISSION_ACTIONS:
        return False
    permissions = get_user_permissions(user)
    if permissions.get(module, {}).get(action, False):
        return True

    fallback_modules = PERMISSION_FALLBACKS.get(module, ())
    return any(permissions.get(fallback_module, {}).get(action, False) for fallback_module in fallback_modules)


def user_is_project_member(user: User, project_id: str | None):
    if not user.employee_id or not project_id:
        return False
    if ProjectMember.query.filter_by(project_id=project_id, employee_id=user.employee_id).first() is not None:
        return True
    return Project.query.filter_by(id=project_id, manager_id=user.employee_id).first() is not None


def require_permission(module: str, action: str):
    def decorator(handler):
        @wraps(handler)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user_has_permission(user, module, action):
                raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)
            return handler(*args, **kwargs)

        return wrapper

    return decorator


def require_project_permission(module: str, action: str, project_id_arg: str = "project_id"):
    def decorator(handler):
        @wraps(handler)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            project_id = kwargs.get(project_id_arg)
            if user_has_permission(user, module, action) or user_is_project_member(user, project_id):
                return handler(*args, **kwargs)
            raise ApiError("Anda tidak memiliki izin untuk melakukan aksi ini.", status_code=403)

        return wrapper

    return decorator
