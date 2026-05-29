export type EmployeeStatus = "Active" | "Inactive";
export type RoleStatus = "Active" | "Inactive";

export type ModuleKey =
  | "dashboard"
  | "calendar"
  | "tasks"
  | "issues"
  | "workload"
  | "masterEmployees"
  | "masterProjects"
  | "projectPhases"
  | "projectMembers"
  | "projectTasks"
  | "projectTaskComments"
  | "projectGantt"
  | "projectTimesheets"
  | "projectIssues"
  | "projectAttachments"
  | "projectMeetings"
  | "emailPreferences"
  | "adminEmailLogs"
  | "masterRoles"
  | "masterOrganizations"
  | "masterOrganizationUnits"
  | "masterPositions";

export type PermissionSet = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  restore: boolean;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  status: RoleStatus;
  permissions: Record<ModuleKey, PermissionSet>;
};

export type Employee = {
  id: string;
  nip: string;
  name: string;
  email: string;
  organization: string;
  unitOrganization: string;
  position: string;
  roleId: string;
  status: EmployeeStatus;
};

const EMPLOYEES_STORAGE_KEY = "zoho-master-employees";
const ROLES_STORAGE_KEY = "zoho-master-roles";

export const DEFAULT_ORGANIZATION_NAME = "PM Dashboard";

export const modulePermissionLabels: Record<ModuleKey, string> = {
  dashboard: "Beranda",
  calendar: "Kalender",
  tasks: "Manajemen Tugas",
  issues: "Isu & Bug",
  workload: "SDM & Kapabilitas",
  masterEmployees: "Master - Pegawai",
  masterProjects: "Proyek - Data Proyek",
  projectPhases: "Proyek - Fase",
  projectMembers: "Proyek - Anggota",
  projectTasks: "Proyek - Tugas",
  projectTaskComments: "Proyek - Komentar Tugas",
  projectGantt: "Proyek - Gantt",
  projectTimesheets: "Proyek - Timesheet",
  projectIssues: "Proyek - Isu & Bug",
  projectAttachments: "Proyek - Lampiran",
  projectMeetings: "Proyek - Meeting",
  emailPreferences: "Pengaturan - Notifikasi Email",
  adminEmailLogs: "Admin - Email Log",
  masterRoles: "Master - Role",
  masterOrganizations: "Master - Organisasi",
  masterOrganizationUnits: "Master - Unit Organisasi",
  masterPositions: "Master - Jabatan"
};

function createPermissionSet(overrides?: Partial<PermissionSet>): PermissionSet {
  return {
    view: false,
    create: false,
    edit: false,
    delete: false,
    restore: false,
    ...overrides
  };
}

function createRolePermissions(
  overrides?: Partial<Record<ModuleKey, Partial<PermissionSet>>>
): Record<ModuleKey, PermissionSet> {
  return {
    dashboard: createPermissionSet(overrides?.dashboard),
    calendar: createPermissionSet(overrides?.calendar),
    tasks: createPermissionSet(overrides?.tasks),
    issues: createPermissionSet(overrides?.issues),
    workload: createPermissionSet(overrides?.workload),
    masterEmployees: createPermissionSet(overrides?.masterEmployees),
    masterProjects: createPermissionSet(overrides?.masterProjects),
    projectPhases: createPermissionSet(overrides?.projectPhases),
    projectMembers: createPermissionSet(overrides?.projectMembers),
    projectTasks: createPermissionSet(overrides?.projectTasks),
    projectTaskComments: createPermissionSet(overrides?.projectTaskComments),
    projectGantt: createPermissionSet(overrides?.projectGantt),
    projectTimesheets: createPermissionSet(overrides?.projectTimesheets),
    projectIssues: createPermissionSet(overrides?.projectIssues),
    projectAttachments: createPermissionSet(overrides?.projectAttachments),
    projectMeetings: createPermissionSet(overrides?.projectMeetings),
    emailPreferences: createPermissionSet(overrides?.emailPreferences),
    adminEmailLogs: createPermissionSet(overrides?.adminEmailLogs),
    masterRoles: createPermissionSet(overrides?.masterRoles),
    masterOrganizations: createPermissionSet(overrides?.masterOrganizations),
    masterOrganizationUnits: createPermissionSet(overrides?.masterOrganizationUnits),
    masterPositions: createPermissionSet(overrides?.masterPositions)
  };
}

export const initialRoles: Role[] = [
  {
    id: "role-001",
    name: "Administrator",
    description: "Akses penuh untuk seluruh menu aktif dan aksi pengelolaan data.",
    status: "Active",
    permissions: createRolePermissions({
      dashboard: { view: true },
      calendar: { view: true },
      tasks: { view: true, create: true, edit: true, delete: true, restore: true },
      issues: { view: true, create: true, edit: true, delete: true, restore: true },
      workload: { view: true, create: true, edit: true, delete: true, restore: true },
      masterEmployees: { view: true, create: true, edit: true, delete: true, restore: true },
      masterProjects: { view: true, create: true, edit: true, delete: true, restore: true },
      projectPhases: { view: true, create: true, edit: true, delete: true, restore: true },
      projectMembers: { view: true, create: true, edit: true, delete: true, restore: true },
      projectTasks: { view: true, create: true, edit: true, delete: true, restore: true },
      projectTaskComments: { view: true, create: true, edit: true, delete: true, restore: true },
      projectGantt: { view: true, create: true, edit: true, delete: true, restore: true },
      projectTimesheets: { view: true },
      projectIssues: { view: true, create: true, edit: true, delete: true, restore: true },
      projectAttachments: { view: true, create: true, edit: true, delete: true, restore: true },
      projectMeetings: { view: true, create: true, edit: true, delete: true, restore: true },
      emailPreferences: { view: true, edit: true },
      adminEmailLogs: { view: true, create: true, edit: true, delete: true, restore: true },
      masterRoles: { view: true, create: true, edit: true, delete: true, restore: true },
      masterOrganizations: { view: true, create: true, edit: true, delete: true, restore: true },
      masterOrganizationUnits: { view: true, create: true, edit: true, delete: true, restore: true },
      masterPositions: { view: true, create: true, edit: true, delete: true, restore: true }
    })
  },
  {
    id: "role-002",
    name: "Project Manager",
    description: "Fokus pada manajemen tugas, proyek, dan pemantauan isu.",
    status: "Active",
    permissions: createRolePermissions({
      dashboard: { view: true },
      calendar: { view: true },
      tasks: { view: true, create: true, edit: true },
      issues: { view: true, create: true, edit: true },
      workload: { view: true },
      masterProjects: { view: true, create: true, edit: true },
      projectPhases: { view: true, create: true, edit: true },
      projectMembers: { view: true, create: true, delete: true },
      projectTasks: { view: true, create: true, edit: true },
      projectTaskComments: { view: true, create: true },
      projectGantt: { view: true },
      projectTimesheets: { view: true },
      projectIssues: { view: true, create: true, edit: true },
      projectAttachments: { view: true, create: true, edit: true, delete: true },
      projectMeetings: { view: true, create: true, edit: true, delete: true },
      masterOrganizations: { view: true },
      masterOrganizationUnits: { view: true },
      masterPositions: { view: true }
    })
  },
  {
    id: "role-003",
    name: "HR Admin",
    description: "Mengelola data pegawai dan struktur organisasi.",
    status: "Active",
    permissions: createRolePermissions({
      dashboard: { view: true },
      calendar: { view: true },
      workload: { view: true },
      masterEmployees: { view: true, create: true, edit: true, delete: true, restore: true },
      masterRoles: { view: true },
      masterOrganizations: { view: true, create: true, edit: true, delete: true, restore: true },
      masterOrganizationUnits: { view: true, create: true, edit: true, delete: true, restore: true },
      masterPositions: { view: true, create: true, edit: true, delete: true, restore: true }
    })
  },
  {
    id: "role-004",
    name: "Viewer",
    description: "Akses baca untuk pemantauan dashboard dan master data.",
    status: "Active",
    permissions: createRolePermissions({
      dashboard: { view: true },
      calendar: { view: true },
      tasks: { view: true },
      issues: { view: true },
      workload: { view: true },
      masterEmployees: { view: true },
      masterProjects: { view: true },
      projectPhases: { view: true },
      projectMembers: { view: true },
      projectTasks: { view: true },
      projectTaskComments: { view: true },
      projectGantt: { view: true },
      projectTimesheets: { view: true },
      projectIssues: { view: true },
      projectAttachments: { view: true },
      projectMeetings: { view: true },
      adminEmailLogs: { view: true },
      masterRoles: { view: true },
      masterOrganizations: { view: true },
      masterOrganizationUnits: { view: true },
      masterPositions: { view: true }
    })
  }
];

export const initialEmployees: Employee[] = [
  {
    id: "emp-001",
    nip: "19870815-001",
    name: "Andi Jatmiko",
    email: "andi.jatmiko@company.co.id",
    organization: DEFAULT_ORGANIZATION_NAME,
    unitOrganization: "Engineering",
    position: "Lead Developer",
    roleId: "role-001",
    status: "Active"
  },
  {
    id: "emp-002",
    nip: "19900210-002",
    name: "Budi Santoso",
    email: "budi.santoso@company.co.id",
    organization: DEFAULT_ORGANIZATION_NAME,
    unitOrganization: "Quality Assurance",
    position: "QA Engineer",
    roleId: "role-002",
    status: "Active"
  },
  {
    id: "emp-003",
    nip: "19931120-003",
    name: "Citra Wulandari",
    email: "citra.wulandari@company.co.id",
    organization: DEFAULT_ORGANIZATION_NAME,
    unitOrganization: "Product Design",
    position: "UI/UX Designer",
    roleId: "role-003",
    status: "Active"
  },
  {
    id: "emp-004",
    nip: "19891205-004",
    name: "Dina Maharani",
    email: "dina.maharani@company.co.id",
    organization: DEFAULT_ORGANIZATION_NAME,
    unitOrganization: "Engineering",
    position: "Backend Developer",
    roleId: "role-004",
    status: "Inactive"
  }
];

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function loadEmployees(): Employee[] {
  return readStorage<Employee[]>(EMPLOYEES_STORAGE_KEY, initialEmployees);
}

export function saveEmployees(employees: Employee[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
}

export function loadRoles(): Role[] {
  return readStorage<Role[]>(ROLES_STORAGE_KEY, initialRoles);
}

export function saveRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
}
