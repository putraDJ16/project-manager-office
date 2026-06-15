import { apiRequest, type Paginated, unwrapListData } from "./apiClient";
import type { Employee, ModuleKey, PermissionSet, Role } from "../data/masterData";

type ApiEmployee = {
  id: string;
  nip: string;
  name: string;
  email: string;
  organization: string;
  unit_organization: string;
  position: string;
  role_id: string;
  status: Employee["status"];
};

type ApiRole = Omit<Role, "isDefault"> & {
  is_default?: boolean;
};

type ApiRoleReference = {
  id: string;
  name: string;
  status: Role["status"];
  is_default?: boolean;
};

const roleModuleKeys: ModuleKey[] = [
  "dashboard",
  "calendar",
  "tasks",
  "issues",
  "workload",
  "masterEmployees",
  "masterProjects",
  "projectPhases",
  "projectMembers",
  "projectTasks",
  "projectTaskComments",
  "projectGantt",
  "projectTimesheets",
  "projectIssues",
  "projectAttachments",
  "projectMeetings",
  "emailPreferences",
  "adminEmailLogs",
  "masterRoles",
  "masterOrganizations",
  "masterOrganizationUnits",
  "masterPositions"
];

const MASTER_API_CACHE_TTL_MS = 2 * 60 * 1000;
const AUTH_SESSION_REFRESH_EVENT = "auth-session-refresh";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

function normalizeRole(role: ApiRole | Role): Role {
  const permissions = roleModuleKeys.reduce<Record<ModuleKey, PermissionSet>>((acc, key) => {
    const current = role.permissions?.[key];
    acc[key] = {
      view: current?.view ?? false,
      create: current?.create ?? false,
      edit: current?.edit ?? false,
      delete: current?.delete ?? false,
      restore: current?.restore ?? false
    };
    return acc;
  }, {} as Record<ModuleKey, PermissionSet>);

  return {
    ...role,
    isDefault: "is_default" in role ? Boolean(role.is_default) : Boolean((role as Role).isDefault),
    permissions
  };
}

function mapRoleToApi(payload: Omit<Role, "id"> | Partial<Omit<Role, "id">>) {
  const { isDefault, ...rest } = payload;
  return {
    ...rest,
    ...(isDefault !== undefined ? { is_default: isDefault } : {})
  };
}

function mapEmployeeFromApi(data: ApiEmployee): Employee {
  return {
    id: data.id,
    nip: data.nip,
    name: data.name,
    email: data.email,
    organization: data.organization,
    unitOrganization: data.unit_organization,
    position: data.position,
    roleId: data.role_id,
    status: data.status
  };
}

function mapEmployeeToApi(data: Omit<Employee, "id"> | Partial<Omit<Employee, "id">>) {
  return {
    ...(data.nip !== undefined ? { nip: data.nip } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.organization !== undefined ? { organization: data.organization } : {}),
    ...(data.unitOrganization !== undefined ? { unit_organization: data.unitOrganization } : {}),
    ...(data.position !== undefined ? { position: data.position } : {}),
    ...(data.roleId !== undefined ? { role_id: data.roleId } : {}),
    ...(data.status !== undefined ? { status: data.status } : {})
  };
}

let rolesInFlight: Promise<Role[]> | null = null;
let employeesInFlight: Promise<Employee[]> | null = null;
let rolesCache: CacheEntry<Role[]> | null = null;
let employeesCache: CacheEntry<Employee[]> | null = null;

function isCacheFresh<T>(cache: CacheEntry<T> | null) {
  return Boolean(cache && cache.expiresAt > Date.now());
}

function setRolesCache(data: Role[]) {
  rolesCache = {
    data,
    expiresAt: Date.now() + MASTER_API_CACHE_TTL_MS
  };
}

function setEmployeesCache(data: Employee[]) {
  employeesCache = {
    data,
    expiresAt: Date.now() + MASTER_API_CACHE_TTL_MS
  };
}

function requestAuthSessionRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_REFRESH_EVENT));
}

export async function fetchRoles() {
  if (isCacheFresh(rolesCache) && rolesCache) return rolesCache.data;
  if (rolesInFlight) return rolesInFlight;

  rolesInFlight = apiRequest<ApiRole[] | Paginated<ApiRole>>("/roles", { method: "GET" })
    .then((result) => {
      const normalized = unwrapListData(result.data).map(normalizeRole);
      setRolesCache(normalized);
      return normalized;
    })
    .finally(() => {
      rolesInFlight = null;
    });

  return rolesInFlight;
}

export async function fetchRoleReferences() {
  const result = await apiRequest<ApiRoleReference[]>("/roles/reference", { method: "GET" });
  return result.data.map(
    (role): Role => ({
      id: role.id,
      name: role.name,
      description: "",
      status: role.status,
      isDefault: Boolean(role.is_default),
      permissions: roleModuleKeys.reduce<Record<ModuleKey, PermissionSet>>((acc, key) => {
        acc[key] = {
          view: false,
          create: false,
          edit: false,
          delete: false,
          restore: false
        };
        return acc;
      }, {} as Record<ModuleKey, PermissionSet>)
    })
  );
}

export async function createRole(payload: Omit<Role, "id">) {
  const result = await apiRequest<ApiRole>("/roles", { method: "POST", body: mapRoleToApi(payload) });
  const created = normalizeRole(result.data);
  if (rolesCache) {
    setRolesCache([created, ...rolesCache.data.filter((role) => role.id !== created.id)]);
  }
  return created;
}

export async function updateRole(id: string, payload: Partial<Omit<Role, "id">>) {
  const result = await apiRequest<ApiRole>(`/roles/${id}`, { method: "PATCH", body: mapRoleToApi(payload) });
  const updated = normalizeRole(result.data);
  if (rolesCache) {
    setRolesCache(rolesCache.data.map((role) => (role.id === id ? updated : role)));
  }
  requestAuthSessionRefresh();
  return updated;
}

export async function updateRoleStatus(id: string, status: Role["status"]) {
  const result = await apiRequest<ApiRole>(`/roles/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
  const updated = normalizeRole(result.data);
  if (rolesCache) {
    setRolesCache(rolesCache.data.map((role) => (role.id === id ? updated : role)));
  }
  requestAuthSessionRefresh();
  return updated;
}

export async function updateDefaultRole(id: string) {
  const result = await apiRequest<ApiRole>(`/roles/${id}/default`, { method: "PATCH" });
  const updated = normalizeRole(result.data);
  if (rolesCache) {
    setRolesCache(rolesCache.data.map((role) => ({ ...role, isDefault: role.id === id })));
  }
  requestAuthSessionRefresh();
  return updated;
}

export async function fetchEmployees() {
  if (isCacheFresh(employeesCache) && employeesCache) return employeesCache.data;
  if (employeesInFlight) return employeesInFlight;

  employeesInFlight = apiRequest<ApiEmployee[] | Paginated<ApiEmployee>>("/employees", { method: "GET" })
    .then((result) => {
      const mapped = unwrapListData(result.data).map(mapEmployeeFromApi);
      setEmployeesCache(mapped);
      return mapped;
    })
    .finally(() => {
      employeesInFlight = null;
    });

  return employeesInFlight;
}

export async function createEmployee(payload: Omit<Employee, "id">) {
  const result = await apiRequest<ApiEmployee>("/employees", {
    method: "POST",
    body: mapEmployeeToApi(payload)
  });
  const created = mapEmployeeFromApi(result.data);
  if (employeesCache) {
    setEmployeesCache([created, ...employeesCache.data.filter((employee) => employee.id !== created.id)]);
  }
  return { data: created, message: result.message };
}

export async function updateEmployee(id: string, payload: Partial<Omit<Employee, "id">>) {
  const result = await apiRequest<ApiEmployee>(`/employees/${id}`, {
    method: "PATCH",
    body: mapEmployeeToApi(payload)
  });
  const updated = mapEmployeeFromApi(result.data);
  if (employeesCache) {
    setEmployeesCache(employeesCache.data.map((employee) => (employee.id === id ? updated : employee)));
  }
  return updated;
}

export async function updateEmployeeStatus(id: string, status: Employee["status"]) {
  const result = await apiRequest<ApiEmployee>(`/employees/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
  const updated = mapEmployeeFromApi(result.data);
  if (employeesCache) {
    setEmployeesCache(employeesCache.data.map((employee) => (employee.id === id ? updated : employee)));
  }
  return updated;
}

export async function resetEmployeePassword(id: string) {
  const result = await apiRequest<null>(`/employees/${id}/reset-password`, {
    method: "POST"
  });
  return result.message ?? "Password pegawai berhasil direset.";
}
