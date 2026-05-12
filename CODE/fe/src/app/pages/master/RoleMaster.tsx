import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, Pencil, Plus, Search, Shield, UserCheck, UserX, X } from "lucide-react";
import {
  modulePermissionLabels,
  type ModuleKey,
  type PermissionSet,
  type Role,
  type RoleStatus
} from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import { createRole, fetchRoles, updateRole, updateRoleStatus } from "../../services/masterApi";
import { hasPermission } from "../../utils/permissions";

type ModalMode = "create" | "edit";
type RoleFormState = Omit<Role, "id">;
const permissionKeys: Array<keyof PermissionSet> = ["view", "create", "edit", "delete", "restore"];

function createEmptyPermissionSet(): PermissionSet {
  return { view: false, create: false, edit: false, delete: false, restore: false };
}

function createEmptyPermissions(): Record<ModuleKey, PermissionSet> {
  return {
    dashboard: createEmptyPermissionSet(),
    tasks: createEmptyPermissionSet(),
    issues: createEmptyPermissionSet(),
    workload: createEmptyPermissionSet(),
    masterEmployees: createEmptyPermissionSet(),
    masterProjects: createEmptyPermissionSet(),
    projectPhases: createEmptyPermissionSet(),
    projectMembers: createEmptyPermissionSet(),
    projectTasks: createEmptyPermissionSet(),
    projectTaskComments: createEmptyPermissionSet(),
    projectIssues: createEmptyPermissionSet(),
    projectAttachments: createEmptyPermissionSet(),
    masterRoles: createEmptyPermissionSet(),
    masterOrganizations: createEmptyPermissionSet(),
    masterOrganizationUnits: createEmptyPermissionSet(),
    masterPositions: createEmptyPermissionSet()
  };
}

function normalizePermissions(
  permissions: Partial<Record<ModuleKey, PermissionSet>> | undefined
): Record<ModuleKey, PermissionSet> {
  const defaults = createEmptyPermissions();
  if (!permissions) return defaults;

  return (Object.keys(defaults) as ModuleKey[]).reduce<Record<ModuleKey, PermissionSet>>((acc, key) => {
    const current = permissions[key];
    acc[key] = {
      view: current?.view ?? false,
      create: current?.create ?? false,
      edit: current?.edit ?? false,
      delete: current?.delete ?? false,
      restore: current?.restore ?? false
    };
    return acc;
  }, defaults);
}

const emptyRoleFormState: RoleFormState = {
  name: "",
  description: "",
  status: "Active",
  permissions: createEmptyPermissions()
};

export function RoleMaster() {
  const session = loadAuthSession();
  const canCreate = hasPermission(session, "masterRoles", "create");
  const canEdit = hasPermission(session, "masterRoles", "edit");
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RoleStatus>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<RoleFormState>(emptyRoleFormState);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchRoles();
      setRoles(result.map((role) => ({ ...role, permissions: normalizePermissions(role.permissions) })));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat role.";
      setNotice(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return roles.filter((role) => {
      if (statusFilter !== "All" && role.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return `${role.name} ${role.description}`.toLowerCase().includes(normalizedQuery);
    });
  }, [query, roles, statusFilter]);
  const hasSearchInput = searchInput.trim().length > 0;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQuery("");
  };

  const openCreateModal = () => {
    if (!canCreate) return;
    setModalMode("create");
    setEditingRoleId(null);
    setFormError("");
    setForm(emptyRoleFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    if (!canEdit) return;
    setModalMode("edit");
    setEditingRoleId(role.id);
    setFormError("");
    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
      permissions: normalizePermissions(role.permissions)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleStatusUpdate = async (role: Role, status: RoleStatus) => {
    if (!canEdit) return;
    try {
      const updated = await updateRoleStatus(role.id, status);
      setRoles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`Status role ${role.name} diperbarui.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui status role.";
      setNotice(message);
    }
  };

  const updatePermission = (moduleKey: ModuleKey, permissionKey: keyof PermissionSet, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [moduleKey]: {
          ...current.permissions[moduleKey],
          [permissionKey]: checked
        }
      }
    }));
  };

  const updateAllPermissionsByAction = (permissionKey: keyof PermissionSet, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: (Object.keys(current.permissions) as ModuleKey[]).reduce<Record<ModuleKey, PermissionSet>>(
        (acc, moduleKey) => {
          acc[moduleKey] = {
            ...current.permissions[moduleKey],
            [permissionKey]: checked
          };
          return acc;
        },
        {} as Record<ModuleKey, PermissionSet>
      )
    }));
  };

  const isAllCheckedForAction = (permissionKey: keyof PermissionSet) =>
    (Object.keys(form.permissions) as ModuleKey[]).every(
      (moduleKey) => Boolean(form.permissions[moduleKey]?.[permissionKey])
    );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: RoleFormState = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      permissions: form.permissions
    };

    if (!payload.name || !payload.description) {
      setFormError("Nama role dan deskripsi wajib diisi.");
      return;
    }

    try {
      if (modalMode === "create") {
        const created = await createRole(payload);
        setRoles((current) => [created, ...current]);
        setNotice(`Role ${payload.name} berhasil ditambahkan.`);
      } else if (editingRoleId) {
        const updated = await updateRole(editingRoleId, payload);
        setRoles((current) => current.map((item) => (item.id === editingRoleId ? updated : item)));
        setNotice(`Perubahan role ${payload.name} berhasil disimpan.`);
      }
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan role.";
      setFormError(message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-color-card">
      <div className="px-6 py-4 border-b border-color-border flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-color-muted-foreground mb-1">
            <span>Master Data</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-color-foreground">Role</span>
          </div>
          <h1 className="text-2xl font-bold text-color-foreground">Master - Role</h1>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-color-primary text-color-primary-foreground rounded-md text-sm font-medium hover:bg-color-primary"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Role
          </button>
        )}
      </div>

      <div className="px-6 py-3 border-b border-color-border bg-color-secondary flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-color-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama role atau deskripsi..."
              className="pl-9 pr-10 py-1.5 w-80 border border-color-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-color-ring"
            />
            {hasSearchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-color-muted-foreground hover:bg-color-accent hover:text-color-foreground"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-color-primary-foreground bg-color-primary border border-color-primary rounded-md hover:bg-color-primary">
            Cari
          </button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-color-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | RoleStatus)}
            className="border border-color-border rounded-md py-1.5 px-3 text-sm bg-color-card shadow-sm"
          >
            <option value="All">Status: Semua</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="ml-auto text-xs font-medium text-color-muted-foreground">
          {filteredRoles.length} dari {roles.length} role
        </div>
      </div>

      {notice && (
        <div className="px-6 pt-3">
          <div className="rounded-md border border-color-status-success-border bg-color-status-success-surface px-3 py-2 text-sm text-color-status-success">{notice}</div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-color-secondary/50 p-6">
        {isLoading && (
          <div className="rounded-xl border border-dashed border-color-border bg-color-card p-10 text-center text-sm text-color-muted-foreground">
            Memuat data role...
          </div>
        )}

        {!isLoading && (
          <div className="rounded-xl border border-color-border overflow-hidden shadow-sm bg-color-card">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-color-muted-foreground uppercase bg-color-secondary border-b border-color-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Deskripsi</th>
                  <th className="px-4 py-3 font-medium">Akses Menu</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canEdit && <th className="px-4 py-3 font-medium text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-color-border">
                {filteredRoles.map((role) => {
                  const enabledModules = Object.entries(role.permissions)
                    .filter(([, permission]) => permission.view)
                    .map(([moduleKey]) => modulePermissionLabels[moduleKey as ModuleKey]);

                  return (
                    <tr key={role.id} className="hover:bg-color-secondary transition-colors">
                      <td className="px-4 py-3 font-semibold text-color-foreground">{role.name}</td>
                      <td className="px-4 py-3 text-color-muted-foreground">{role.description}</td>
                      <td className="px-4 py-3 text-color-muted-foreground">
                        <div className="flex flex-wrap gap-1.5">
                          {enabledModules.length > 0
                            ? enabledModules.map((label) => (
                                <span key={label} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-color-accent text-color-foreground">
                                  {label}
                                </span>
                              ))
                            : <span className="text-xs text-color-muted-foreground">Belum ada akses view</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={role.status} /></td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(role)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-color-border text-color-foreground hover:bg-color-accent"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                            </button>
                            {role.status === "Active" ? (
                              <button
                                type="button"
                                onClick={() => void handleStatusUpdate(role, "Inactive")}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-color-destructive/40 text-color-destructive hover:bg-color-destructive/15"
                              >
                                <UserX className="w-3.5 h-3.5 mr-1.5" /> Nonaktifkan
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleStatusUpdate(role, "Active")}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-color-status-success-border text-color-status-success hover:bg-color-status-success-surface"
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Aktifkan
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-color-foreground/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div
            className="w-full max-w-5xl max-h-[90vh] bg-color-card rounded-xl border border-color-border shadow-2xl flex flex-col overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-color-border flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-color-foreground">{modalMode === "create" ? "Tambah Role" : "Edit Role"}</h2>
              <button type="button" onClick={closeModal} className="p-1 rounded hover:bg-color-accent text-color-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="rounded-md border border-color-destructive/40 bg-color-destructive/15 px-3 py-2 text-sm text-color-destructive">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-color-foreground mb-1">Nama Role</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full border border-color-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-color-foreground mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RoleStatus }))}
                    className="w-full border border-color-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-color-foreground mb-1">Deskripsi</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-color-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-color-ring resize-none"
                  required
                />
              </div>

              <div className="rounded-xl border border-color-border overflow-hidden">
                <div className="px-4 py-3 bg-color-secondary border-b border-color-border">
                  <h3 className="text-sm font-semibold text-color-foreground">Permission Matrix</h3>
                </div>
                <div className="max-h-[42vh] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 text-xs text-color-muted-foreground uppercase bg-color-secondary border-b border-color-border shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Modul</th>
                        {permissionKeys.map((permissionKey) => (
                          <th key={`header-${permissionKey}`} className="px-4 py-3 font-medium text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span>{permissionKey}</span>
                              <label className="inline-flex items-center gap-1 normal-case text-xs text-color-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={isAllCheckedForAction(permissionKey)}
                                  onChange={(event) => updateAllPermissionsByAction(permissionKey, event.target.checked)}
                                  className="rounded border-color-border text-color-primary focus:ring-color-ring"
                                />
                                Select all
                              </label>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-color-border">
                      {Object.entries(modulePermissionLabels).map(([moduleKey, label]) => {
                        const permission = form.permissions[moduleKey as ModuleKey];
                        return (
                          <tr key={moduleKey}>
                            <td className="px-4 py-3 font-medium text-color-foreground">{label}</td>
                            {permissionKeys.map((permissionKey) => (
                              <td key={`${moduleKey}-${permissionKey}`} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={permission[permissionKey]}
                                  onChange={(event) =>
                                    updatePermission(moduleKey as ModuleKey, permissionKey, event.target.checked)
                                  }
                                  className="rounded border-color-border text-color-primary focus:ring-color-ring"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-color-border bg-color-card px-5 py-4 shrink-0">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-color-border rounded-md text-sm">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-color-primary text-color-primary-foreground rounded-md text-sm font-semibold">
                  {modalMode === "create" ? "Simpan Role" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RoleStatus }) {
  const styles: Record<RoleStatus, string> = {
    Active: "bg-color-status-success-surface text-color-status-success border-color-status-success-border",
    Inactive: "bg-color-accent text-color-foreground border-color-border"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${styles[status]}`}>
      <Shield className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
}
