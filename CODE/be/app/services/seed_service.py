from werkzeug.security import generate_password_hash

from app.extensions import db
from app.models import (
    Employee,
    Issue,
    Organization,
    OrganizationUnit,
    Phase,
    Position,
    Project,
    Role,
    SlaRule,
    Task,
    User,
)
from app.services.issue_service import DEFAULT_SLA_RULES, SEVERITY_ORDER
from app.utils.permissions import DEFAULT_ROLE_PERMISSIONS_BY_NAME


DEFAULT_ROLES = [
    {
        "id": "role-001",
        "name": "Administrator",
        "description": "Akses penuh untuk seluruh menu aktif dan aksi pengelolaan data.",
    },
    {
        "id": "role-002",
        "name": "Project Manager",
        "description": "Fokus pada manajemen tugas, proyek, dan pemantauan isu.",
    },
    {
        "id": "role-003",
        "name": "HR Admin",
        "description": "Mengelola data pegawai dan struktur organisasi.",
    },
    {
        "id": "role-004",
        "name": "Viewer",
        "description": "Akses baca untuk pemantauan dashboard dan master data.",
    },
]


def sync_default_role_permissions():
    for default_role in DEFAULT_ROLES:
        role_name = default_role["name"]
        permissions = DEFAULT_ROLE_PERMISSIONS_BY_NAME[role_name]
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            role = Role(
                id=default_role["id"],
                name=role_name,
                description=default_role["description"],
                status="Active",
                permissions=permissions,
            )
            db.session.add(role)
            continue

        role.permissions = permissions
        if not role.description:
            role.description = default_role["description"]
        if role_name == "Viewer":
            role.status = "Active"
    db.session.commit()


def seed_database(force_reset: bool = False):
    if force_reset:
        db.drop_all()
        db.create_all()

    if Role.query.first():
        sync_default_role_permissions()
        return

    roles = [
        Role(
            id=default_role["id"],
            name=default_role["name"],
            description=default_role["description"],
            status="Active",
            permissions=DEFAULT_ROLE_PERMISSIONS_BY_NAME[default_role["name"]],
        )
        for default_role in DEFAULT_ROLES
    ]
    db.session.add_all(roles)

    organizations = [
        Organization(id="org-001", name="ZOHO PM SaaS", status="Active"),
    ]
    db.session.add_all(organizations)

    organization_units = [
        OrganizationUnit(id="unit-001", name="Engineering", status="Active"),
        OrganizationUnit(id="unit-002", name="Quality Assurance", status="Active"),
        OrganizationUnit(id="unit-003", name="Product Design", status="Active"),
    ]
    db.session.add_all(organization_units)

    positions = [
        Position(id="pos-001", name="Lead Developer", status="Active"),
        Position(id="pos-002", name="QA Engineer", status="Active"),
        Position(id="pos-003", name="UI/UX Designer", status="Active"),
        Position(id="pos-004", name="Backend Developer", status="Active"),
    ]
    db.session.add_all(positions)

    employees = [
        Employee(
            id="emp-001",
            nip="19870815-001",
            name="Andi Jatmiko",
            email="andi.jatmiko@company.co.id",
            organization="ZOHO PM SaaS",
            unit_organization="Engineering",
            position="Lead Developer",
            role_id="role-001",
            status="Active",
        ),
        Employee(
            id="emp-002",
            nip="19900210-002",
            name="Budi Santoso",
            email="budi.santoso@company.co.id",
            organization="ZOHO PM SaaS",
            unit_organization="Quality Assurance",
            position="QA Engineer",
            role_id="role-002",
            status="Active",
        ),
        Employee(
            id="emp-003",
            nip="19931120-003",
            name="Citra Wulandari",
            email="citra.wulandari@company.co.id",
            organization="ZOHO PM SaaS",
            unit_organization="Product Design",
            position="UI/UX Designer",
            role_id="role-003",
            status="Active",
        ),
        Employee(
            id="emp-004",
            nip="19891205-004",
            name="Dina Maharani",
            email="dina.maharani@company.co.id",
            organization="ZOHO PM SaaS",
            unit_organization="Engineering",
            position="Backend Developer",
            role_id="role-004",
            status="Inactive",
        ),
    ]
    db.session.add_all(employees)

    users = [
        User(
            email="admin@zoho.local",
            password_hash=generate_password_hash("Admin123!"),
            display_name="Administrator",
            role_id="role-001",
            employee_id="emp-001",
            is_active=True,
        ),
        User(
            email="pm@zoho.local",
            password_hash=generate_password_hash("Pm123456!"),
            display_name="Project Manager",
            role_id="role-002",
            employee_id="emp-002",
            is_active=True,
        ),
    ]
    db.session.add_all(users)

    projects = [
        Project(id="p1", name="Transformasi Digital Kamsiber", status="Active", manager_id="emp-001"),
        Project(id="p2", name="Security Audit Tahunan", status="Active", manager_id="emp-002"),
        Project(id="p3", name="Migrasi Cloud", status="Planning", manager_id="emp-001"),
    ]
    db.session.add_all(projects)

    phases = [
        Phase(id="ph-101", project_id="p1", name="Fase 1: Persiapan & Desain", order_index=1),
        Phase(id="ph-102", project_id="p1", name="Fase 2: Implementasi Sistem", order_index=2),
        Phase(id="ph-201", project_id="p2", name="Fase 1: Audit Planning", order_index=1),
        Phase(id="ph-301", project_id="p3", name="Fase 1: Discovery", order_index=1),
    ]
    db.session.add_all(phases)

    tasks = [
        Task(
            id="T-101",
            title="Setup UI Repo",
            priority="Medium",
            assignee="u1",
            project_id="p1",
            phase_id="ph-101",
            created_by="Administrator",
        ),
        Task(
            id="T-102",
            title="Review Desain Login",
            priority="High",
            assignee="u3",
            project_id="p1",
            phase_id="ph-101",
            created_by="Project Manager",
        ),
        Task(
            id="T-103",
            title="Integrasi API Otentikasi",
            priority="Critical",
            assignee="u4",
            project_id="p1",
            phase_id="ph-102",
            created_by="Project Manager",
        ),
        Task(
            id="T-104",
            title="Testing E2E Modul User",
            priority="Medium",
            assignee="u2",
            project_id="p1",
            phase_id="ph-102",
            created_by="Administrator",
        ),
    ]
    db.session.add_all(tasks)

    issues = [
        Issue(
            id="BUG-201",
            project_id="p1",
            title="API Otentikasi Timeout",
            severity="Blocker",
            status="Investigating",
            reporter="Client A",
            assignee="Dina M.",
            description="Timeout 504 muncul saat trafik login meningkat drastis.",
            module="Auth Gateway v2",
            environment="Production / Win11",
            reproduction_steps=["Buka halaman login sistem", "Jalankan load test 1000 req/sec", "Kirim request login serentak"],
            actual_result="Service timeout dan restart otomatis.",
            expected_result="Sistem menolak request berlebih secara graceful (429).",
            attachments=["error-log.png", "network-tab.mp4"],
        ),
        Issue(
            id="BUG-202",
            project_id="p1",
            title="Tombol Simpan Freeze",
            severity="Major",
            status="Open",
            reporter="Andi J.",
            assignee=None,
            description="UI freeze ketika user menekan tombol simpan pada form profil.",
            module="Profile Form",
            environment="Staging / Chrome",
            reproduction_steps=["Buka halaman profil", "Ubah field bio", "Klik tombol simpan"],
            actual_result="Tombol loading tidak selesai dan UI tidak merespons.",
            expected_result="Form tersimpan dan menampilkan notifikasi sukses.",
            attachments=["freeze-recording.mp4"],
        ),
    ]
    db.session.add_all(issues)

    for severity in SEVERITY_ORDER:
        defaults = DEFAULT_SLA_RULES[severity]
        db.session.add(
            SlaRule(
                severity=severity,
                target_hours=defaults["target_hours"],
                auto_escalate=defaults["auto_escalate"],
                escalation_delay_minutes=defaults["escalation_delay_minutes"],
            )
        )

    db.session.commit()
