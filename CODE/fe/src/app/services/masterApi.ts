import { apiRequest } from "./apiClient";
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

const roleModuleKeys: ModuleKey[] = [
  "dashboard",
  "tasks",
  "issues",
  "workload",
  "masterEmployees",
  "masterProjects",
  "masterRoles",
  "masterOrganizations",
  "masterOrganizationUnits",
  "masterPositions"
];

function normalizeRole(role: Role): Role {
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

  return { ...role, permissions };
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

export async function fetchRoles() {
  if (rolesInFlight) return rolesInFlight;

  rolesInFlight = apiRequest<Role[]>("/roles", { method: "GET" })
    .then((result) => result.data.map(normalizeRole))
    .finally(() => {
      rolesInFlight = null;
    });

  return rolesInFlight;
}

export async function createRole(payload: Omit<Role, "id">) {
  const result = await apiRequest<Role>("/roles", { method: "POST", body: payload });
  return normalizeRole(result.data);
}

export async function updateRole(id: string, payload: Partial<Omit<Role, "id">>) {
  const result = await apiRequest<Role>(`/roles/${id}`, { method: "PATCH", body: payload });
  return normalizeRole(result.data);
}

export async function updateRoleStatus(id: string, status: Role["status"]) {
  const result = await apiRequest<Role>(`/roles/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
  return normalizeRole(result.data);
}

export async function fetchEmployees() {
  if (employeesInFlight) return employeesInFlight;

  employeesInFlight = apiRequest<ApiEmployee[]>("/employees", { method: "GET" })
    .then((result) => result.data.map(mapEmployeeFromApi))
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
  return mapEmployeeFromApi(result.data);
}

export async function updateEmployee(id: string, payload: Partial<Omit<Employee, "id">>) {
  const result = await apiRequest<ApiEmployee>(`/employees/${id}`, {
    method: "PATCH",
    body: mapEmployeeToApi(payload)
  });
  return mapEmployeeFromApi(result.data);
}

export async function updateEmployeeStatus(id: string, status: Employee["status"]) {
  const result = await apiRequest<Employee>(`/employees/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
  return result.data;
}
