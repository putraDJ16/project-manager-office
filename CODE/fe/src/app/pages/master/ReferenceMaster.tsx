import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, Filter, Pencil, Plus, Search, UserCheck, UserX, X } from "lucide-react";
import {
  createMasterReference,
  fetchMasterReferences,
  updateMasterReference,
  updateMasterReferenceStatus
} from "../../services/masterReferenceApi";
import type {
  MasterReferenceItem,
  MasterReferenceStatus,
  MasterReferenceType
} from "../../data/masterReferenceData";
import { loadAuthSession } from "../../data/auth";
import type { ModuleKey } from "../../data/masterData";
import { hasPermission } from "../../utils/permissions";
import { PaginationControls } from "../../components/ui";

type ModalMode = "create" | "edit";
type ReferenceFormState = {
  name: string;
  status: MasterReferenceStatus;
};
const PAGE_SIZE = 10;

type ReferenceMasterProps = {
  type: MasterReferenceType;
  title: string;
  breadcrumb: string;
  addLabel: string;
  placeholder: string;
};

const emptyReferenceForm: ReferenceFormState = {
  name: "",
  status: "Active"
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

const moduleByType: Record<MasterReferenceType, ModuleKey> = {
  organization: "masterOrganizations",
  unitOrganization: "masterOrganizationUnits",
  position: "masterPositions"
};

export function ReferenceMaster({
  type,
  title,
  breadcrumb,
  addLabel,
  placeholder
}: ReferenceMasterProps) {
  const session = loadAuthSession();
  const moduleKey = moduleByType[type];
  const canCreate = hasPermission(session, moduleKey, "create");
  const canEdit = hasPermission(session, moduleKey, "edit");
  const [items, setItems] = useState<MasterReferenceItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | MasterReferenceStatus>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<ReferenceFormState>(emptyReferenceForm);
  const [page, setPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchMasterReferences(type);
      setItems(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data master.";
      setNotice(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [type]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return item.name.toLowerCase().includes(normalizedQuery);
    });
  }, [items, query, statusFilter]);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const hasSearchInput = searchInput.trim().length > 0;
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, type]);

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
    setEditingItemId(null);
    setFormError("");
    setForm(emptyReferenceForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterReferenceItem) => {
    if (!canEdit) return;
    setModalMode("edit");
    setEditingItemId(item.id);
    setFormError("");
    setForm({
      name: item.name,
      status: item.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleStatusUpdate = async (item: MasterReferenceItem, status: MasterReferenceStatus) => {
    if (!canEdit) return;
    try {
      const updated = await updateMasterReferenceStatus(type, item.id, status);
      setItems((current) => current.map((value) => (value.id === updated.id ? updated : value)));
      setNotice(`Status ${item.name} diperbarui.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui status.";
      setNotice(message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      status: form.status
    };

    if (!payload.name) {
      setFormError("Nama wajib diisi.");
      return;
    }

    const duplicate = items.some(
      (item) =>
        normalizeValue(item.name) === normalizeValue(payload.name) &&
        (modalMode === "create" || item.id !== editingItemId)
    );
    if (duplicate) {
      setFormError("Nama sudah digunakan.");
      return;
    }

    try {
      if (modalMode === "create") {
        const created = await createMasterReference({ ...payload, type });
        setItems((current) => [created, ...current].sort((a, b) => a.name.localeCompare(b.name, "id")));
        setNotice(`${payload.name} berhasil ditambahkan.`);
      } else if (editingItemId) {
        const updated = await updateMasterReference(type, editingItemId, payload);
        setItems((current) =>
          current
            .map((value) => (value.id === editingItemId ? updated : value))
            .sort((a, b) => a.name.localeCompare(b.name, "id"))
        );
        setNotice(`Perubahan ${payload.name} berhasil disimpan.`);
      }
      closeModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan data master.";
      setFormError(message);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-1">
            <span>Master Data</span>
            <span className="mx-2">/</span>
            <span className="font-medium text-slate-700">{breadcrumb}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" /> {addLabel}
          </button>
        )}
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={placeholder}
              className="pl-9 pr-10 py-1.5 w-80 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            onChange={(event) => setStatusFilter(event.target.value as "All" | MasterReferenceStatus)}
            className="border border-slate-300 rounded-md py-1.5 px-3 text-sm bg-white shadow-sm"
          >
            <option value="All">Status: Semua</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="ml-auto text-xs font-medium text-slate-500">
          {filteredItems.length} dari {items.length} data
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
            Memuat data master...
          </div>
        )}

        {!isLoading && (
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canEdit && <th className="px-4 py-3 font-medium text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 mr-3">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </button>
                          {item.status === "Active" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item, "Inactive")}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <UserX className="w-3.5 h-3.5 mr-1.5" /> Nonaktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item, "Active")}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Aktifkan
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls page={page} pageSize={PAGE_SIZE} totalItems={filteredItems.length} onPageChange={setPage} className="border-t border-slate-200" />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">{modalMode === "create" ? addLabel : `Edit ${breadcrumb}`}</h2>
              <button type="button" onClick={closeModal} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value as MasterReferenceStatus }))
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-slate-300 rounded-md text-sm">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold">
                  {modalMode === "create" ? "Simpan Data" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: MasterReferenceStatus }) {
  const styles: Record<MasterReferenceStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Inactive: "bg-slate-100 text-slate-700 border-slate-200"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${styles[status]}`}>
      <Building2 className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
}
