import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Filter, Loader2, Pencil, Plus, Search, Shield, Star, UserCheck, UserX, X } from "lucide-react";
import {
  type ModuleKey,
  type PermissionSet,
  type Role,
  type RoleStatus
} from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import { createRole, fetchRoles, updateDefaultRole, updateRole, updateRoleStatus } from "../../services/masterApi";
import { hasPermission } from "../../utils/permissions";
import { PaginationControls } from "../../components/ui";

type ModalMode = "create" | "edit";
type RoleFormState = Omit<Role, "id">;
const permissionKeys: Array<keyof PermissionSet> = ["view", "create", "edit", "delete"];
const PAGE_SIZE = 10;

function createEmptyPermissionSet(): PermissionSet {
  return { view: false, create: false, edit: false, delete: false, restore: false };
}

function createEmptyPermissions(): Record<ModuleKey, PermissionSet> {
  return {
    dashboard: createEmptyPermissionSet(),
    calendar: createEmptyPermissionSet(),
    tasks: createEmptyPermissionSet(),
    issues: createEmptyPermissionSet(),
    workload: createEmptyPermissionSet(),
    masterEmployees: createEmptyPermissionSet(),
    masterProjects: createEmptyPermissionSet(),
    projectPhases: createEmptyPermissionSet(),
    projectMembers: createEmptyPermissionSet(),
    projectTasks: createEmptyPermissionSet(),
    projectTaskComments: createEmptyPermissionSet(),
    projectGantt: createEmptyPermissionSet(),
    projectTimesheets: createEmptyPermissionSet(),
    projectIssues: createEmptyPermissionSet(),
    projectAttachments: createEmptyPermissionSet(),
    projectMeetings: createEmptyPermissionSet(),
    emailPreferences: createEmptyPermissionSet(),
    adminEmailLogs: createEmptyPermissionSet(),
    masterRoles: createEmptyPermissionSet(),
    masterOrganizations: createEmptyPermissionSet(),
    masterOrganizationUnits: createEmptyPermissionSet(),
    masterPositions: createEmptyPermissionSet()
  };
}

const actionLabels: Record<keyof PermissionSet, string> = {
  view: "Lihat",
  create: "Tambah",
  edit: "Ubah",
  delete: "Hapus",
  restore: "Restore"
};

type MenuPermissionGroup = {
  id: string;
  label: string;
  description: string;
  modules: ModuleKey[];
  actions?: Array<keyof PermissionSet>;
  children?: MenuPermissionGroup[];
};

type MenuPermissionRow = {
  group: MenuPermissionGroup;
  depth: number;
};

const menuPermissionGroups: MenuPermissionGroup[] = [
  {
    id: "dashboard",
    label: "Beranda",
    description: "Dashboard utama aplikasi.",
    modules: ["dashboard"],
    actions: ["view"]
  },
  {
    id: "calendar",
    label: "Kalender",
    description: "Kalender monitoring proyek.",
    modules: ["calendar"],
    actions: ["view"]
  },
  {
    id: "my-tasks",
    label: "Tugas Saya",
    description: "Halaman tugas pribadi, isu aktif, kalender personal, dan timesheet.",
    modules: ["tasks"]
  },
  {
    id: "projects",
    label: "Proyek",
    description: "Daftar proyek, ringkasan detail, dan fase otomatis.",
    modules: ["masterProjects"],
    children: [
      {
        id: "project-members",
        label: "Anggota",
        description: "Tab anggota, RASCI, dan pengelolaan member proyek.",
        modules: ["projectMembers"]
      },
      {
        id: "project-tasks",
        label: "Tugas",
        description: "Tab tugas proyek dan komentar/checklist tugas.",
        modules: ["projectTasks", "projectTaskComments"]
      },
      {
        id: "project-gantt",
        label: "Gantt",
        description: "Tab timeline Gantt proyek.",
        modules: ["projectGantt"],
        actions: ["view"]
      },
      {
        id: "project-timesheets",
        label: "Timesheet",
        description: "Tab matrix/rekap timesheet member proyek.",
        modules: ["projectTimesheets"],
        actions: ["view"]
      },
      {
        id: "project-issues",
        label: "Isu & Bug",
        description: "Tab isu dan bug pada detail proyek.",
        modules: ["projectIssues"]
      },
      {
        id: "project-attachments",
        label: "Lampiran",
        description: "Tab folder dan file lampiran proyek.",
        modules: ["projectAttachments"]
      },
      {
        id: "project-meetings",
        label: "Meeting",
        description: "Tab meeting, meeting notes, dan file MoM.",
        modules: ["projectMeetings"]
      }
    ]
  },
  {
    id: "issues",
    label: "Isu & Bug",
    description: "Menu global daftar isu, bug board, dan SLA.",
    modules: ["issues"]
  },
  {
    id: "workload",
    label: "SDM & Kapabilitas",
    description: "Heatmap workload dan kapasitas SDM.",
    modules: ["workload"],
    actions: ["view"]
  },
  {
    id: "master",
    label: "Data Master",
    description: "Pegawai, role, organisasi, unit organisasi, dan jabatan.",
    modules: ["masterEmployees", "masterRoles", "masterOrganizations", "masterOrganizationUnits", "masterPositions"]
  },
  {
    id: "email-preferences",
    label: "Notifikasi Email",
    description: "Preferensi email pengguna.",
    modules: ["emailPreferences"],
    actions: ["view", "edit"]
  },
  {
    id: "email-log",
    label: "Email Log",
    description: "Monitoring dan resend outbox email.",
    modules: ["adminEmailLogs"],
    actions: ["view", "edit"]
  }
];

const menuPermissionRows: MenuPermissionRow[] = menuPermissionGroups.flatMap((group) => [
  { group, depth: 0 },
  ...(group.children ?? []).map((child) => ({ group: child, depth: 1 }))
]);

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
  isDefault: false,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);

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
  const paginatedRoles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRoles.slice(start, start + PAGE_SIZE);
  }, [filteredRoles, page]);
  const editingRole = useMemo(
    () => roles.find((role) => role.id === editingRoleId),
    [editingRoleId, roles]
  );
  const hasSearchInput = searchInput.trim().length > 0;

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

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
      isDefault: role.isDefault,
      permissions: normalizePermissions(role.permissions)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
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

  const handleDefaultUpdate = async (role: Role) => {
    if (!canEdit || role.isDefault) return;
    try {
      const updated = await updateDefaultRole(role.id);
      setRoles((current) =>
        current.map((item) => ({
          ...item,
          isDefault: item.id === updated.id
        }))
      );
      setForm((current) => ({ ...current, isDefault: true }));
      setNotice(`Role ${role.name} dijadikan default pengguna baru.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui role default.";
      setNotice(message);
    }
  };

  const isActionSupported = (group: MenuPermissionGroup, permissionKey: keyof PermissionSet) =>
    (group.actions ?? permissionKeys).includes(permissionKey);

  const updateMenuPermission = (
    group: MenuPermissionGroup,
    permissionKey: keyof PermissionSet,
    checked: boolean
  ) => {
    if (!isActionSupported(group, permissionKey)) return;
    setForm((current) => ({
      ...current,
      permissions: group.modules.reduce<Record<ModuleKey, PermissionSet>>(
        (acc, moduleKey) => {
          acc[moduleKey] = {
            ...acc[moduleKey],
            [permissionKey]: checked
          };
          return acc;
        },
        { ...current.permissions }
      )
    }));
  };

  const updateAllPermissionsByAction = (permissionKey: keyof PermissionSet, checked: boolean) => {
    setForm((current) => ({
      ...current,
      permissions: menuPermissionRows.reduce<Record<ModuleKey, PermissionSet>>(
        (acc, { group }) =>
          isActionSupported(group, permissionKey)
            ? group.modules.reduce<Record<ModuleKey, PermissionSet>>((moduleAcc, moduleKey) => {
                moduleAcc[moduleKey] = {
                  ...moduleAcc[moduleKey],
                  [permissionKey]: checked
                };
                return moduleAcc;
              }, acc)
            : acc,
        { ...current.permissions }
      )
    }));
  };

  const isAllCheckedForAction = (permissionKey: keyof PermissionSet) =>
    menuPermissionRows
      .filter(({ group }) => isActionSupported(group, permissionKey))
      .every(({ group }) => group.modules.every((moduleKey) => Boolean(form.permissions[moduleKey]?.[permissionKey])));

  const isMenuActionChecked = (group: MenuPermissionGroup, permissionKey: keyof PermissionSet) =>
    group.modules.every((moduleKey) => Boolean(form.permissions[moduleKey]?.[permissionKey]));

  const isMenuPartiallyChecked = (group: MenuPermissionGroup, permissionKey: keyof PermissionSet) =>
    !isMenuActionChecked(group, permissionKey) &&
    group.modules.some((moduleKey) => Boolean(form.permissions[moduleKey]?.[permissionKey]));

  const enabledMenuLabels = (permissions: Record<ModuleKey, PermissionSet>) =>
    menuPermissionGroups
      .filter(
        (group) =>
          group.modules.some((moduleKey) => Boolean(permissions[moduleKey]?.view)) ||
          (group.children ?? []).some((child) =>
            child.modules.some((moduleKey) => Boolean(permissions[moduleKey]?.view))
          )
      )
      .map((group) => group.label);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: RoleFormState = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      isDefault: form.isDefault,
      permissions: form.permissions
    };

    if (!payload.name || !payload.description) {
      setFormError("Nama role dan deskripsi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
                {paginatedRoles.map((role) => {
                  const enabledMenus = enabledMenuLabels(role.permissions);

                  return (
                    <tr key={role.id} className="hover:bg-color-secondary transition-colors">
                      <td className="px-4 py-3 font-semibold text-color-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{role.name}</span>
                          {role.isDefault && (
                            <span className="inline-flex w-fit items-center rounded-full border border-color-status-warning-border bg-color-status-warning-surface px-2 py-0.5 text-[11px] font-semibold text-color-status-warning">
                              <Star className="mr-1 h-3 w-3 fill-current" />
                              Default pengguna baru
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-color-muted-foreground">{role.description}</td>
                      <td className="px-4 py-3 text-color-muted-foreground">
                        <div className="flex flex-wrap gap-1.5">
                          {enabledMenus.length > 0
                            ? enabledMenus.map((label) => (
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
                                disabled={role.isDefault}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-color-destructive/40 text-color-destructive hover:bg-color-destructive/15 disabled:cursor-not-allowed disabled:opacity-50"
                                title={role.isDefault ? "Role default tidak bisa dinonaktifkan." : undefined}
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
            <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredRoles.length} onPageChange={setPage} className="border-t border-color-border" />
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
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1 rounded hover:bg-color-accent text-color-muted-foreground disabled:opacity-50"
              >
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

              {modalMode === "edit" && editingRole && (
                <div className="rounded-xl border border-color-border bg-color-secondary/45 px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-color-foreground">Default pengguna baru</h3>
                      <p className="mt-1 text-xs text-color-muted-foreground">
                        Role default dipakai otomatis saat user register dan sebagai pilihan awal saat tambah pegawai.
                      </p>
                      {editingRole.isDefault && (
                        <span className="mt-2 inline-flex items-center rounded-full border border-color-status-warning-border bg-color-status-warning-surface px-2 py-0.5 text-xs font-semibold text-color-status-warning">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          Role ini sedang menjadi default
                        </span>
                      )}
                    </div>
                    {!editingRole.isDefault && (
                      <button
                        type="button"
                        onClick={() => void handleDefaultUpdate(editingRole)}
                        disabled={editingRole.status !== "Active"}
                        className="inline-flex items-center justify-center rounded-md border border-color-status-warning-border px-3 py-2 text-sm font-semibold text-color-status-warning hover:bg-color-status-warning-surface disabled:cursor-not-allowed disabled:opacity-50"
                        title={editingRole.status !== "Active" ? "Aktifkan role terlebih dahulu sebelum dijadikan default." : undefined}
                      >
                        <Star className="mr-1.5 h-4 w-4" />
                        Jadikan Default
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-color-border overflow-hidden">
                <div className="px-4 py-3 bg-color-secondary border-b border-color-border">
                  <h3 className="text-sm font-semibold text-color-foreground">Akses Menu Utama</h3>
                  <p className="mt-1 text-xs text-color-muted-foreground">
                    Daftar ini mengikuti menu level 1 di sidebar. Menu Proyek dibuka sebagai tree agar akses tab detail bisa diatur terpisah.
                  </p>
                </div>
                <div className="max-h-[42vh] overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10 text-xs text-color-muted-foreground uppercase bg-color-secondary border-b border-color-border shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Menu</th>
                        {permissionKeys.map((permissionKey) => (
                          <th key={`header-${permissionKey}`} className="px-4 py-3 font-medium text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span>{actionLabels[permissionKey]}</span>
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
                      {menuPermissionRows.map(({ group, depth }) => {
                        return (
                          <tr key={group.id} className={depth > 0 ? "bg-color-secondary/35" : undefined}>
                            <td className="px-4 py-3">
                              <div className={depth > 0 ? "pl-5 border-l-2 border-color-border" : undefined}>
                                <p className={`font-medium ${depth > 0 ? "text-color-foreground/90" : "text-color-foreground"}`}>
                                  {depth > 0 ? `-> ${group.label}` : group.label}
                                </p>
                                <p className="mt-0.5 text-xs text-color-muted-foreground">{group.description}</p>
                              </div>
                            </td>
                            {permissionKeys.map((permissionKey) => (
                              <td key={`${group.id}-${permissionKey}`} className="px-4 py-3 text-center">
                                {isActionSupported(group, permissionKey) ? (
                                  <label className="inline-flex flex-col items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={isMenuActionChecked(group, permissionKey)}
                                      onChange={(event) => updateMenuPermission(group, permissionKey, event.target.checked)}
                                      className="rounded border-color-border text-color-primary focus:ring-color-ring"
                                    />
                                    {isMenuPartiallyChecked(group, permissionKey) && (
                                      <span className="text-[10px] normal-case text-color-status-warning">Sebagian</span>
                                    )}
                                  </label>
                                ) : (
                                  <span className="text-color-muted-foreground">-</span>
                                )}
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
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-color-border rounded-md text-sm disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-color-primary text-color-primary-foreground rounded-md text-sm font-semibold disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Menyimpan..." : modalMode === "create" ? "Simpan Role" : "Simpan Perubahan"}
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
