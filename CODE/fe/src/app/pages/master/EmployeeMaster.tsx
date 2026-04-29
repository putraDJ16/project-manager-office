import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Filter,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
  X
} from "lucide-react";
import { DEFAULT_ORGANIZATION_NAME, type Employee, type EmployeeStatus, type Role } from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import type { MasterReferenceItem, MasterReferenceType } from "../../data/masterReferenceData";
import {
  createEmployee,
  fetchEmployees,
  fetchRoles,
  resetEmployeePassword,
  updateEmployee,
  updateEmployeeStatus
} from "../../services/masterApi";
import { fetchMasterReferences } from "../../services/masterReferenceApi";
import { hasPermission } from "../../utils/permissions";

type EmployeeTab = "data" | "structure";
type ModalMode = "create" | "edit";
type EmployeeFormState = Omit<Employee, "id">;

const emptyFormState: EmployeeFormState = {
  nip: "",
  name: "",
  email: "",
  organization: DEFAULT_ORGANIZATION_NAME,
  unitOrganization: "",
  position: "",
  roleId: "",
  status: "Active"
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function buildReferenceOptions(
  references: MasterReferenceItem[],
  type: MasterReferenceType,
  currentValue: string
) {
  const activeNames = references
    .filter((item) => item.type === type && item.status === "Active")
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, "id"));

  if (!currentValue) return activeNames;
  const normalizedCurrent = normalizeValue(currentValue);
  const existsInActive = activeNames.some((name) => normalizeValue(name) === normalizedCurrent);
  if (existsInActive) return activeNames;
  return [...activeNames, currentValue];
}

export function EmployeeMaster() {
  const session = loadAuthSession();
  const canCreate = hasPermission(session, "masterEmployees", "create");
  const canEdit = hasPermission(session, "masterEmployees", "edit");
  const [activeTab, setActiveTab] = useState<EmployeeTab>("data");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [masterReferences, setMasterReferences] = useState<MasterReferenceItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | EmployeeStatus>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(emptyFormState);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [employeeData, roleData, referenceData] = await Promise.all([
        fetchEmployees(),
        fetchRoles(),
        fetchMasterReferences()
      ]);
      setEmployees(employeeData);
      setRoles(roleData);
      setMasterReferences(referenceData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data pegawai.";
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

  const roleMap = useMemo(() => {
    return roles.reduce<Record<string, Role>>((acc, role) => {
      acc[role.id] = role;
      return acc;
    }, {});
  }, [roles]);

  const roleOptions = useMemo(() => {
    return roles.filter((role) => {
      if (role.status === "Active") return true;
      return modalMode === "edit" && form.roleId === role.id;
    });
  }, [form.roleId, modalMode, roles]);

  const organizationOptions = useMemo(
    () => buildReferenceOptions(masterReferences, "organization", form.organization),
    [form.organization, masterReferences]
  );
  const unitOrganizationOptions = useMemo(
    () => buildReferenceOptions(masterReferences, "unitOrganization", form.unitOrganization),
    [form.unitOrganization, masterReferences]
  );
  const positionOptions = useMemo(
    () => buildReferenceOptions(masterReferences, "position", form.position),
    [form.position, masterReferences]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter !== "All" && employee.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const roleName = roleMap[employee.roleId]?.name ?? "Role tidak ditemukan";
      const source =
        `${employee.nip} ${employee.name} ${employee.email} ${employee.organization} ${employee.unitOrganization} ${employee.position} ${roleName}`.toLowerCase();
      return source.includes(normalizedQuery);
    });
  }, [employees, query, roleMap, statusFilter]);
  const hasSearchInput = searchInput.trim().length > 0;

  const groupedStructure = useMemo(() => {
    const grouped = new Map<string, Map<string, Employee[]>>();
    filteredEmployees.forEach((employee) => {
      if (!grouped.has(employee.organization)) grouped.set(employee.organization, new Map());
      const byUnit = grouped.get(employee.organization)!;
      if (!byUnit.has(employee.unitOrganization)) byUnit.set(employee.unitOrganization, []);
      byUnit.get(employee.unitOrganization)!.push(employee);
    });
    return grouped;
  }, [filteredEmployees]);

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
    const defaultRole = roles.find((role) => role.status === "Active");
    const defaultOrganization = buildReferenceOptions(masterReferences, "organization", "")[0] ?? DEFAULT_ORGANIZATION_NAME;
    const defaultUnitOrganization = buildReferenceOptions(masterReferences, "unitOrganization", "")[0] ?? "";
    const defaultPosition = buildReferenceOptions(masterReferences, "position", "")[0] ?? "";
    setModalMode("create");
    setEditingEmployeeId(null);
    setFormError("");
    setForm({
      ...emptyFormState,
      organization: defaultOrganization,
      unitOrganization: defaultUnitOrganization,
      position: defaultPosition,
      roleId: defaultRole?.id ?? ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (employee: Employee) => {
    if (!canEdit) return;
    setModalMode("edit");
    setEditingEmployeeId(employee.id);
    setFormError("");
    setForm({
      nip: employee.nip,
      name: employee.name,
      email: employee.email,
      organization: employee.organization,
      unitOrganization: employee.unitOrganization,
      position: employee.position,
      roleId: employee.roleId,
      status: employee.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleStatusUpdate = async (employee: Employee, status: Employee["status"]) => {
    if (!canEdit) return;
    try {
      const updated = await updateEmployeeStatus(employee.id, status);
      setEmployees((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`Status pegawai ${employee.name} diperbarui.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui status.";
      setNotice(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: EmployeeFormState = {
      nip: form.nip.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      organization: form.organization.trim(),
      unitOrganization: form.unitOrganization.trim(),
      position: form.position.trim(),
      roleId: form.roleId,
      status: form.status
    };

    if (
      !payload.nip ||
      !payload.name ||
      !payload.email ||
      !payload.organization ||
      !payload.unitOrganization ||
      !payload.position ||
      !payload.roleId
    ) {
      setFormError("Semua field wajib diisi, termasuk role.");
      return;
    }

    const duplicateNip = employees.some(
      (employee) =>
        normalizeValue(employee.nip) === normalizeValue(payload.nip) &&
        (modalMode === "create" || employee.id !== editingEmployeeId)
    );
    if (duplicateNip) {
      setFormError("NIP sudah digunakan oleh pegawai lain.");
      return;
    }

    const duplicateEmail = employees.some(
      (employee) =>
        normalizeValue(employee.email) === normalizeValue(payload.email) &&
        (modalMode === "create" || employee.id !== editingEmployeeId)
    );
    if (duplicateEmail) {
      setFormError("Email sudah digunakan oleh pegawai lain.");
      return;
    }

    try {
      if (modalMode === "create") {
        const created = await createEmployee(payload);
        setEmployees((current) => [created.data, ...current]);
        setNotice(created.message ?? `Pegawai ${payload.name} berhasil ditambahkan.`);
      } else if (editingEmployeeId) {
        const updated = await updateEmployee(editingEmployeeId, payload);
        setEmployees((current) => current.map((item) => (item.id === editingEmployeeId ? updated : item)));
        setNotice(`Perubahan pegawai ${payload.name} berhasil disimpan.`);
      }
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan data pegawai.";
      setFormError(message);
    }
  };

  const handleResetPassword = async (employee: Employee) => {
    if (!canEdit) return;
    const shouldReset = window.confirm(`Reset password untuk ${employee.name}?`);
    if (!shouldReset) return;

    try {
      const message = await resetEmployeePassword(employee.id);
      setNotice(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mereset password pegawai.";
      setNotice(message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Master Data</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">Pegawai</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Master - Pegawai</h1>
        </div>
        {activeTab === "data" && canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Pegawai
          </button>
        )}
      </div>

      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200 w-full">
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center justify-center ${
              activeTab === "data" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 mr-2" /> Data Pegawai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center justify-center ${
              activeTab === "structure" ? "bg-slate-100 text-indigo-700" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Network className="w-4 h-4 mr-2" /> Struktur Organisasi
          </button>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari NIP, nama, email, organisasi, unit, jabatan, role..."
              className="pl-9 pr-10 py-1.5 w-96 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {hasSearchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700">
            Cari
          </button>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "All" | EmployeeStatus)}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white shadow-sm"
          >
            <option value="All">Status: Semua</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="ml-auto text-xs font-medium text-slate-500">
          {filteredEmployees.length} dari {employees.length} pegawai
        </div>
      </div>

      {notice && (
        <div className="px-6 pt-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
        {isLoading && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Memuat data pegawai...
          </div>
        )}

        {!isLoading && activeTab === "data" && (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">NIP</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Organisasi</th>
                  <th className="px-4 py-3 font-medium">Unit Organisasi</th>
                  <th className="px-4 py-3 font-medium">Jabatan</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canEdit && <th className="px-4 py-3 font-medium text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => {
                  const employeeRole = roleMap[employee.roleId];
                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-600">{employee.nip}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{employee.name}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.email}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.organization}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.unitOrganization}</td>
                      <td className="px-4 py-3 text-slate-600">{employee.position}</td>
                      <td className="px-4 py-3">
                        <RoleBadge roleName={employeeRole?.name ?? "Role tidak ditemukan"} status={employeeRole?.status} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={employee.status} />
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(employee)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleResetPassword(employee)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Password
                            </button>
                            {employee.status === "Active" ? (
                              <button
                                type="button"
                                onClick={() => void handleStatusUpdate(employee, "Inactive")}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <UserX className="w-3.5 h-3.5 mr-1.5" /> Nonaktifkan
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleStatusUpdate(employee, "Active")}
                                className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
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

        {!isLoading && activeTab === "structure" && (
          <div className="space-y-4">
            {Array.from(groupedStructure.entries()).map(([organization, byUnit]) => (
              <div key={organization} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{organization}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {Array.from(byUnit.entries()).map(([unitName, users]) => (
                    <div key={unitName} className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-800">
                        Unit Organisasi: <span className="font-medium">{unitName}</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {users.map((user) => (
                          <div key={user.id} className="px-4 py-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{user.name}</p>
                              <p className="text-xs text-slate-500">
                                {user.nip} - {user.email}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">Jabatan: {user.position}</p>
                            </div>
                            <StatusBadge status={user.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{modalMode === "create" ? "Tambah Pegawai" : "Edit Pegawai"}</h2>
              <button type="button" onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="NIP" value={form.nip} onChange={(value) => setForm((cur) => ({ ...cur, nip: value }))} />
                <Input label="Nama" value={form.name} onChange={(value) => setForm((cur) => ({ ...cur, name: value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((cur) => ({ ...cur, email: value }))}
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm((cur) => ({ ...cur, status: value as EmployeeStatus }))}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" }
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Organisasi"
                  value={form.organization}
                  onChange={(value) => setForm((cur) => ({ ...cur, organization: value }))}
                  options={[
                    { value: "", label: "Pilih organisasi" },
                    ...organizationOptions.map((value) => ({ value, label: value }))
                  ]}
                />
                <Select
                  label="Unit Organisasi"
                  value={form.unitOrganization}
                  onChange={(value) => setForm((cur) => ({ ...cur, unitOrganization: value }))}
                  options={[
                    { value: "", label: "Pilih unit organisasi" },
                    ...unitOrganizationOptions.map((value) => ({ value, label: value }))
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Jabatan"
                  value={form.position}
                  onChange={(value) => setForm((cur) => ({ ...cur, position: value }))}
                  options={[
                    { value: "", label: "Pilih jabatan" },
                    ...positionOptions.map((value) => ({ value, label: value }))
                  ]}
                />
                <Select
                  label="Role"
                  value={form.roleId}
                  onChange={(value) => setForm((cur) => ({ ...cur, roleId: value }))}
                  options={[
                    { value: "", label: "Pilih role" },
                    ...roleOptions.map((role) => ({
                      value: role.id,
                      label: `${role.name}${role.status === "Inactive" ? " (Inactive)" : ""}`
                    }))
                  ]}
                />
              </div>
              {modalMode === "create" && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Info akun login pegawai akan otomatis dibuat. Password default ditampilkan pada notifikasi setelah data berhasil disimpan.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 rounded-md text-sm">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
                  {modalMode === "create" ? "Simpan Pegawai" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RoleBadge({ roleName, status }: { roleName: string; status?: Role["status"] }) {
  const style = status === "Inactive" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-700 border-indigo-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${style}`}>
      <Shield className="w-3 h-3 mr-1" />
      {roleName}
    </span>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const styles: Record<EmployeeStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Inactive: "bg-slate-100 text-slate-700 border-slate-200"
  };
  return <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${styles[status]}`}>{status}</span>;
}
