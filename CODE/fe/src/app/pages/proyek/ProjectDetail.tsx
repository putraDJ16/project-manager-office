import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bug,
  Calendar,
  CheckSquare,
  Download,
  Eye,
  Edit2,
  FilePlus2,
  FolderClosed,
  FolderPlus,
  GanttChartSquare,
  KanbanSquare,
  Layers,
  List,
  Loader2,
  Plus,
  Save,
  Trash2,
  User,
  Users,
  X
} from "lucide-react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  addProjectMember,
  getProject,
  removeProjectMember,
  updateProject,
  type ApiProjectDetail,
  type ApiProjectMember
} from "../../services/projectApi";
import { fetchEmployees } from "../../services/masterApi";
import {
  createTask,
  createTaskComment,
  fetchPhases,
  fetchTaskComments,
  fetchTasks,
  updateTask,
  type ApiPhase,
  type ApiTask,
  type ApiTaskComment
} from "../../services/taskApi";
import {
  createAttachmentFolder,
  deleteAttachmentFile,
  deleteAttachmentFolder,
  downloadAttachmentFile,
  fetchAttachmentFiles,
  fetchAttachmentFolders,
  fetchAttachmentFileBlob,
  updateAttachmentFile,
  updateAttachmentFolder,
  uploadAttachmentFile,
  type ApiAttachmentFile,
  type ApiAttachmentFolder
} from "../../services/projectAttachmentApi";
import type { Employee } from "../../data/masterData";
import { loadAuthSession } from "../../data/auth";
import { hasPermission } from "../../utils/permissions";
import { TaskDetailModal } from "../tugas/TaskDetailModal";
import { ProjectIssuePanel } from "./ProjectIssuePanel";

const PROJECT_STATUSES = ["Planning", "Active", "On Hold", "Completed"];
const PROJECT_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TASK_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const TASK_PROGRESS_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Planning: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-slate-100 text-slate-600"
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700"
};

type Tab = "ringkasan" | "anggota" | "tugas" | "gantt" | "isu" | "lampiran";
type TaskView = "list" | "kanban";
type TaskComment = { id: number; authorName: string; content: string; createdAt: string };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function toTaskComment(raw: ApiTaskComment): TaskComment {
  return {
    id: raw.id,
    authorName: raw.author_name,
    content: raw.content,
    createdAt: raw.created_at
  };
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = loadAuthSession();
  const canEditProject = hasPermission(session, "masterProjects", "edit");
  const canViewPhases = hasPermission(session, "projectPhases", "view");
  const canCreateMembers = hasPermission(session, "projectMembers", "create");
  const canDeleteMembers = hasPermission(session, "projectMembers", "delete");
  const canViewTasks = hasPermission(session, "projectTasks", "view");
  const canCreateTasks = hasPermission(session, "projectTasks", "create");
  const canEditTasks = hasPermission(session, "projectTasks", "edit");
  const canViewTaskComments = hasPermission(session, "projectTaskComments", "view");
  const canCreateTaskComments = hasPermission(session, "projectTaskComments", "create");
  const canViewIssues = hasPermission(session, "projectIssues", "view");
  const canCreateIssues = hasPermission(session, "projectIssues", "create");
  const canEditIssues = hasPermission(session, "projectIssues", "edit");
  const canViewAttachments = hasPermission(session, "projectAttachments", "view");
  const canCreateAttachments = hasPermission(session, "projectAttachments", "create");
  const canEditAttachments = hasPermission(session, "projectAttachments", "edit");
  const canDeleteAttachments = hasPermission(session, "projectAttachments", "delete");

  const [project, setProject] = useState<ApiProjectDetail | null>(null);
  const [phases, setPhases] = useState<ApiPhase[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("ringkasan");
  const [taskView, setTaskView] = useState<TaskView>("list");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<
    Partial<{
      name: string;
      description: string;
      status: string;
      priority: string;
      manager_id: string;
      start_date: string;
      end_date: string;
    }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSaving, setMemberSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    phase_id: "",
    assignee: "",
    priority: "Medium" as string,
    progress_percentage: 0,
    start_date: "",
    end_date: ""
  });
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSaving, setTaskSaving] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [isLoadingTaskComments, setIsLoadingTaskComments] = useState(false);
  const [isSavingTaskComment, setIsSavingTaskComment] = useState(false);

  const [attachmentFolders, setAttachmentFolders] = useState<ApiAttachmentFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<ApiAttachmentFile[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderEditName, setFolderEditName] = useState("");
  const [folderEditParentId, setFolderEditParentId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState<{ file: File | null; description: string }>({
    file: null,
    description: ""
  });
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [isDropzoneActive, setIsDropzoneActive] = useState(false);
  const [descriptionModal, setDescriptionModal] = useState<{
    fileId: string;
    filename: string;
    description: string;
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ file: ApiAttachmentFile; url: string; text?: string } | null>(
    null
  );
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProject(id),
      canViewPhases ? fetchPhases(id) : Promise.resolve([]),
      canViewTasks ? fetchTasks(id, "") : Promise.resolve([]),
      fetchEmployees(),
      canViewAttachments ? fetchAttachmentFolders(id) : Promise.resolve([])
    ])
      .then(([projectResult, phaseResult, taskResult, employeeResult, folderResult]) => {
        setProject(projectResult);
        setPhases(phaseResult);
        setTasks(taskResult);
        setEmployees(employeeResult);
        setAttachmentFolders(folderResult);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, canViewAttachments, canViewPhases, canViewTasks]);

  useEffect(() => {
    if (!id) return;
    if (!canViewAttachments) {
      setAttachmentFiles([]);
      return;
    }
    setAttachmentLoading(true);
    fetchAttachmentFiles(id, selectedFolderId)
      .then((files) => setAttachmentFiles(files))
      .catch((err: Error) => setAttachmentError(err.message))
      .finally(() => setAttachmentLoading(false));
  }, [id, selectedFolderId, canViewAttachments]);

  const memberEmployeeIds = useMemo(
    () => new Set(project?.members.map((member) => member.employee_id) ?? []),
    [project]
  );

  const availableEmployees = useMemo(
    () => employees.filter((employee) => employee.status === "Active" && !memberEmployeeIds.has(employee.id)),
    [employees, memberEmployeeIds]
  );

  const phasesSorted = useMemo(
    () => [...phases].sort((left, right) => left.order_index - right.order_index),
    [phases]
  );
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const resolveAssigneeLabel = (assigneeValue: string) => {
    if (!assigneeValue) return "";
    const projectMember = (project?.members ?? []).find((member) => member.employee_id === assigneeValue);
    if (projectMember?.employee_name) return projectMember.employee_name;
    const employee = employees.find((item) => item.id === assigneeValue);
    if (employee?.name) return employee.name;
    return assigneeValue;
  };

  useEffect(() => {
    if (!selectedTaskId) return;
    if (!tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks]);

  const refreshAttachmentFolders = async (projectId: string) => {
    if (!canViewAttachments) return;
    const folders = await fetchAttachmentFolders(projectId);
    setAttachmentFolders(folders);
  };

  const refreshAttachmentFiles = async (projectId: string, folderId: string | null) => {
    if (!canViewAttachments) return;
    const files = await fetchAttachmentFiles(projectId, folderId);
    setAttachmentFiles(files);
  };

  const handleCreateFolder = async () => {
    if (!id || !canCreateAttachments) return;
    const name = newFolderName.trim();
    if (!name) return;
    try {
      setAttachmentError(null);
      await createAttachmentFolder(id, { name, parent_id: selectedFolderId });
      await refreshAttachmentFolders(id);
      setNewFolderName("");
      setShowCreateFolder(false);
      setSaveNotice({ type: "success", msg: "Folder lampiran berhasil dibuat." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal membuat folder.");
    }
  };

  const handleUploadAttachment = async () => {
    if (!id || !uploadForm.file || !canCreateAttachments) return;
    try {
      setAttachmentError(null);
      await uploadAttachmentFile(id, {
        file: uploadForm.file,
        folder_id: selectedFolderId,
        description: uploadForm.description.trim() || null
      });
      await refreshAttachmentFiles(id, selectedFolderId);
      setUploadForm({ file: null, description: "" });
      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }
      setSaveNotice({ type: "success", msg: "File lampiran berhasil diunggah." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal mengunggah file.");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!id || !canDeleteAttachments) return;
    try {
      await deleteAttachmentFolder(id, folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
      await refreshAttachmentFolders(id);
      await refreshAttachmentFiles(id, selectedFolderId === folderId ? null : selectedFolderId);
      setSaveNotice({ type: "success", msg: "Folder lampiran berhasil dihapus." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal menghapus folder.");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!id || !canDeleteAttachments) return;
    try {
      await deleteAttachmentFile(id, fileId);
      await refreshAttachmentFiles(id, selectedFolderId);
      setSaveNotice({ type: "success", msg: "File lampiran berhasil dihapus." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal menghapus file.");
    }
  };

  const handleSaveSelectedFolder = async () => {
    if (!id || !selectedFolder || !canEditAttachments) return;
    if (!folderEditName.trim()) {
      setAttachmentError("Nama folder wajib diisi.");
      return;
    }
    try {
      await updateAttachmentFolder(id, selectedFolder.id, {
        name: folderEditName.trim(),
        parent_id: folderEditParentId
      });
      await refreshAttachmentFolders(id);
      setSaveNotice({ type: "success", msg: "Folder lampiran berhasil diperbarui." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal memperbarui folder.");
    }
  };

  const handleMoveFileToFolder = async (fileId: string, targetFolderId: string | null) => {
    if (!id || !canEditAttachments) return;
    try {
      await updateAttachmentFile(id, fileId, { folder_id: targetFolderId });
      await refreshAttachmentFiles(id, selectedFolderId);
      setSaveNotice({ type: "success", msg: "File berhasil dipindahkan ke folder." });
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal memindahkan file.");
    }
  };

  const handleUpdateFileDescription = async (fileId: string, description: string) => {
    if (!id || !canEditAttachments) return false;
    try {
      await updateAttachmentFile(id, fileId, { description });
      await refreshAttachmentFiles(id, selectedFolderId);
      setSaveNotice({ type: "success", msg: "Deskripsi file berhasil diperbarui." });
      return true;
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal memperbarui deskripsi file.");
      return false;
    }
  };

  const handleDownloadFile = async (fileId: string, filename: string) => {
    if (!id || !canViewAttachments) return;
    try {
      await downloadAttachmentFile(id, fileId, filename);
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal mengunduh file.");
    }
  };

  const handlePreviewFile = async (file: ApiAttachmentFile) => {
    if (!id || !canViewAttachments) return;
    try {
      setAttachmentError(null);
      if (previewFile) {
        window.URL.revokeObjectURL(previewFile.url);
      }
      const blob = await fetchAttachmentFileBlob(id, file.id);
      const url = window.URL.createObjectURL(blob);
      if ((file.mime_type ?? "").startsWith("text/") || file.original_name.endsWith(".md") || file.original_name.endsWith(".json")) {
        const text = await blob.text();
        setPreviewFile({ file, url, text });
      } else {
        setPreviewFile({ file, url });
      }
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Gagal menampilkan preview file.");
    }
  };

  const closePreview = () => {
    if (previewFile) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const openDescriptionModal = (file: ApiAttachmentFile) => {
    if (!canEditAttachments) return;
    setDescriptionModal({
      fileId: file.id,
      filename: file.original_name,
      description: file.description ?? ""
    });
  };

  const closeDescriptionModal = () => {
    setDescriptionModal(null);
  };

  const handleSaveDescriptionFromModal = async () => {
    if (!descriptionModal) return;
    const saved = await handleUpdateFileDescription(descriptionModal.fileId, descriptionModal.description.trim());
    if (saved) {
      closeDescriptionModal();
    }
  };

  const handleDropzoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canCreateAttachments) return;
    event.preventDefault();
    event.stopPropagation();
    if (!isDropzoneActive) {
      setIsDropzoneActive(true);
    }
  };

  const handleDropzoneDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropzoneActive(false);
  };

  const handleDropzoneDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!canCreateAttachments) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDropzoneActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    setUploadForm((current) => ({ ...current, file }));
  };

  const folderOptions = useMemo(() => {
    const byParent = attachmentFolders.reduce<Record<string, ApiAttachmentFolder[]>>((acc, folder) => {
      const key = folder.parent_id ?? "root";
      if (!acc[key]) acc[key] = [];
      acc[key].push(folder);
      return acc;
    }, {});
    Object.keys(byParent).forEach((key) => {
      byParent[key] = byParent[key].sort((a, b) => a.name.localeCompare(b.name, "id"));
    });

    const output: Array<{ id: string; label: string }> = [];
    const walk = (parentId: string | null, depth: number) => {
      const key = parentId ?? "root";
      const list = byParent[key] ?? [];
      list.forEach((folder) => {
        output.push({ id: folder.id, label: `${"  ".repeat(depth)}${folder.name}` });
        walk(folder.id, depth + 1);
      });
    };
    walk(null, 0);
    return output;
  }, [attachmentFolders]);

  const selectedFolder = useMemo(
    () => attachmentFolders.find((folder) => folder.id === selectedFolderId) ?? null,
    [attachmentFolders, selectedFolderId]
  );

  const folderLabelMap = useMemo(() => {
    const output = new Map<string, string>();
    folderOptions.forEach((folder) => {
      output.set(folder.id, folder.label.trim());
    });
    return output;
  }, [folderOptions]);

  const filteredFolderOptions = useMemo(() => {
    const query = folderSearch.trim().toLowerCase();
    if (!query) return folderOptions;
    return folderOptions.filter((folder) => folder.label.toLowerCase().includes(query));
  }, [folderOptions, folderSearch]);

  const filteredAttachmentFiles = useMemo(() => {
    const query = fileSearch.trim().toLowerCase();
    if (!query) return attachmentFiles;
    return attachmentFiles.filter((file) => {
      const folderLabel = file.folder_id ? folderLabelMap.get(file.folder_id) ?? "" : "root";
      return (
        file.original_name.toLowerCase().includes(query) ||
        (file.description ?? "").toLowerCase().includes(query) ||
        folderLabel.toLowerCase().includes(query)
      );
    });
  }, [attachmentFiles, fileSearch, folderLabelMap]);

  useEffect(() => {
    if (!selectedFolder) {
      setFolderEditName("");
      setFolderEditParentId(null);
      return;
    }
    setFolderEditName(selectedFolder.name);
    setFolderEditParentId(selectedFolder.parent_id);
  }, [selectedFolder]);

  useEffect(() => {
    return () => {
      if (previewFile) {
        window.URL.revokeObjectURL(previewFile.url);
      }
    };
  }, [previewFile]);

  const invalidParentIds = useMemo(() => {
    if (!selectedFolder) return new Set<string>();

    const childrenByParent = attachmentFolders.reduce<Record<string, string[]>>((acc, folder) => {
      const key = folder.parent_id ?? "root";
      if (!acc[key]) acc[key] = [];
      acc[key].push(folder.id);
      return acc;
    }, {});

    const blocked = new Set<string>([selectedFolder.id]);
    const stack = [selectedFolder.id];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      const children = childrenByParent[current] ?? [];
      children.forEach((childId) => {
        if (!blocked.has(childId)) {
          blocked.add(childId);
          stack.push(childId);
        }
      });
    }

    return blocked;
  }, [attachmentFolders, selectedFolder]);

  const openEdit = () => {
    if (!project || !canEditProject) return;
    setEditForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      priority: project.priority ?? "",
      manager_id: project.manager_id ?? "",
      start_date: project.start_date ?? "",
      end_date: project.end_date ?? ""
    });
    setEditMode(true);
    setSaveNotice(null);
  };

  const handleSaveEdit = async () => {
    if (!id || !project || !canEditProject) return;
    setSaving(true);
    setSaveNotice(null);
    try {
      const updated = await updateProject(id, {
        name: editForm.name?.trim() || project.name,
        description: editForm.description?.trim() || undefined,
        status: editForm.status || project.status,
        priority: editForm.priority || undefined,
        manager_id: editForm.manager_id || undefined,
        start_date: editForm.start_date || undefined,
        end_date: editForm.end_date || undefined
      });
      setProject((current) => (current ? { ...current, ...updated.data } : current));
      setEditMode(false);
      setSaveNotice({ type: "success", msg: "Proyek berhasil diperbarui." });
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err: unknown) {
      setSaveNotice({ type: "error", msg: err instanceof Error ? err.message : "Gagal menyimpan data proyek." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!id || !selectedEmployeeId || !canCreateMembers) return;
    setMemberSaving(true);
    setMemberError(null);
    try {
      const result = await addProjectMember(id, selectedEmployeeId);
      setProject((current) =>
        current
          ? { ...current, members: [...current.members, result.data], member_count: current.member_count + 1 }
          : current
      );
      setSelectedEmployeeId("");
      setShowAddMember(false);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Gagal menambahkan anggota.");
    } finally {
      setMemberSaving(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!id || !canDeleteMembers) return;
    setRemovingId(employeeId);
    try {
      await removeProjectMember(id, employeeId);
      setProject((current) =>
        current
          ? {
              ...current,
              members: current.members.filter((member) => member.employee_id !== employeeId),
              member_count: current.member_count - 1
            }
          : current
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddTask = async () => {
    if (!id || !taskForm.title.trim() || !canCreateTasks) return;
    if (!taskForm.phase_id) {
      setTaskError("Pilih fase untuk tugas ini.");
      return;
    }
    if (taskForm.start_date && taskForm.end_date && taskForm.end_date < taskForm.start_date) {
      setTaskError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    setTaskSaving(true);
    setTaskError(null);
    try {
      const result = await createTask({
        title: taskForm.title.trim(),
        priority: taskForm.priority as ApiTask["priority"],
        assignee: taskForm.assignee,
        project_id: id,
        phase_id: taskForm.phase_id,
        progress_percentage: taskForm.progress_percentage,
        start_date: taskForm.start_date || null,
        end_date: taskForm.end_date || null
      });
      setTasks((current) => [result.data, ...current]);
      setTaskForm({
        title: "",
        phase_id: "",
        assignee: "",
        priority: "Medium",
        progress_percentage: 0,
        start_date: "",
        end_date: ""
      });
      setShowAddTask(false);
    } catch (err: unknown) {
      setTaskError(err instanceof Error ? err.message : "Gagal menambahkan tugas.");
    } finally {
      setTaskSaving(false);
    }
  };

  const handleTaskKanbanDragEnd = async (result: DropResult) => {
    if (!id || !result.destination || !canEditTasks) return;
    const destinationPhaseId = result.destination.droppableId;
    const sourcePhaseId = result.source.droppableId;
    const taskId = result.draggableId;

    if (destinationPhaseId === sourcePhaseId) return;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, phase_id: destinationPhaseId } : task))
    );

    try {
      const updated = await updateTask(taskId, { phase_id: destinationPhaseId });
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    } catch (err: unknown) {
      const freshTasks = await fetchTasks(id, "");
      setTasks(freshTasks);
      setSaveNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal memindahkan tugas antar fase."
      });
    }
  };

  const handleTaskProgressChange = async (taskId: string, nextProgress: number) => {
    if (!id || !canEditTasks) return;
    const sanitized = Math.max(0, Math.min(100, nextProgress));
    const previousTask = tasks.find((task) => task.id === taskId);
    if (!previousTask || previousTask.progress_percentage === sanitized) return;

    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, progress_percentage: sanitized } : task))
    );

    try {
      const updated = await updateTask(taskId, { progress_percentage: sanitized });
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)));
    } catch (err: unknown) {
      const freshTasks = await fetchTasks(id, "");
      setTasks(freshTasks);
      setSaveNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal memperbarui persentase tugas."
      });
    }
  };

  const loadTaskComments = async (taskId: string) => {
    if (!canViewTaskComments) return;
    setIsLoadingTaskComments(true);
    try {
      const rows = await fetchTaskComments(taskId);
      setTaskComments((current) => ({ ...current, [taskId]: rows.map(toTaskComment) }));
    } catch (err: unknown) {
      setSaveNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal memuat komentar tugas."
      });
    } finally {
      setIsLoadingTaskComments(false);
    }
  };

  const handleOpenTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    if (canViewTaskComments) {
      await loadTaskComments(taskId);
    }
  };

  const handleSubmitTaskComment = async (content: string) => {
    if (!selectedTaskId || !canCreateTaskComments) return;
    setIsSavingTaskComment(true);
    try {
      await createTaskComment(selectedTaskId, { content });
      await loadTaskComments(selectedTaskId);
      setSaveNotice({ type: "success", msg: "Komentar berhasil ditambahkan." });
    } catch (err: unknown) {
      setSaveNotice({
        type: "error",
        msg: err instanceof Error ? err.message : "Gagal menambahkan komentar tugas."
      });
      throw err;
    } finally {
      setIsSavingTaskComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat detail proyek...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p>{error ?? "Proyek tidak ditemukan."}</p>
        <button onClick={() => navigate("/proyek/list")} className="text-indigo-600 hover:underline text-sm">
          Kembali ke daftar proyek
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate("/proyek/list")}
            className="mt-1 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center text-xs text-slate-400 mb-1 gap-1">
              <span className="hover:underline cursor-pointer" onClick={() => navigate("/proyek/list")}>
                Proyek
              </span>
              <span>/</span>
              <span className="text-slate-600 font-medium">{project.name}</span>
            </div>
            {editMode ? (
              <input
                type="text"
                value={editForm.name ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                className="text-2xl font-bold text-slate-900 border-b-2 border-indigo-400 focus:outline-none bg-transparent w-full max-w-lg"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-600"}`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {project.status}
              </span>
              {project.priority && (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[project.priority] ?? ""}`}
                >
                  {project.priority}
                </span>
              )}
              {project.manager_name && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  {project.manager_name}
                </span>
              )}
              {project.start_date && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.start_date)}
                  {project.end_date && <span>- {formatDate(project.end_date)}</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-1">
          {saveNotice && (
            <span
              className={`text-xs px-3 py-1.5 rounded-md border ${
                saveNotice.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {saveNotice.msg}
            </span>
          )}
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Simpan
              </button>
            </>
          ) : canEditProject ? (
            <button
              onClick={openEdit}
              className="flex items-center px-4 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"
            >
              <Edit2 className="w-4 h-4 mr-1.5" /> Edit Proyek
            </button>
          ) : null}
        </div>
      </div>

      {editMode && (
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={editForm.status ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prioritas</label>
              <select
                value={editForm.priority ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, priority: event.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">- Tidak Ada -</option>
                {PROJECT_PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={editForm.start_date ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, start_date: event.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={editForm.end_date ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, end_date: event.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Manajer Proyek</label>
              <select
                value={editForm.manager_id ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, manager_id: event.target.value }))}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">- Tidak Ada -</option>
                {employees
                  .filter((employee) => employee.status === "Active")
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Deskripsi</label>
              <textarea
                value={editForm.description ?? ""}
                onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                rows={2}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="px-6 border-b border-slate-200 flex items-center gap-0">
        {([
          { key: "ringkasan", label: "Ringkasan", icon: Layers },
          { key: "anggota", label: `Anggota (${project.member_count})`, icon: Users, visible: hasPermission(session, "projectMembers", "view") },
          { key: "tugas", label: `Tugas (${tasks.length})`, icon: CheckSquare, visible: canViewTasks },
          { key: "gantt", label: "Gantt", icon: GanttChartSquare, visible: canViewTasks },
          { key: "isu", label: "Isu & Bug", icon: Bug, visible: canViewIssues },
          { key: "lampiran", label: `Lampiran (${attachmentFiles.length})`, icon: FolderClosed, visible: canViewAttachments }
        ] as { key: Tab; label: string; icon: React.ElementType; visible?: boolean }[])
          .filter((tab) => tab.visible !== false)
          .map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "ringkasan" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Fase" value={phases.length} icon={Layers} color="indigo" />
              <StatCard label="Total Tugas" value={tasks.length} icon={CheckSquare} color="violet" />
              <StatCard label="Anggota Tim" value={project.member_count} icon={Users} color="sky" />
            </div>

            {project.description && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Deskripsi</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Fase Proyek</h3>
              {phasesSorted.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada fase.</p>
              ) : (
                <div className="space-y-2">
                  {phasesSorted.map((phase, index) => {
                    const phaseTasks = tasks.filter((task) => task.phase_id === phase.id);
                    return (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{phase.name}</span>
                        </div>
                        <span className="text-xs text-slate-500">{phaseTasks.length} tugas</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "anggota" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Anggota Tim</h3>
              {canCreateMembers && (
                <button
                  onClick={() => {
                    setShowAddMember(true);
                    setMemberError(null);
                    setSelectedEmployeeId("");
                  }}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Anggota
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 mb-2">Tambah Anggota Baru</p>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(event) => setSelectedEmployeeId(event.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">- Pilih Pegawai -</option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position} ({employee.organization})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedEmployeeId || memberSaving}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60 shrink-0"
                  >
                    {memberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tambah"}
                  </button>
                  <button onClick={() => setShowAddMember(false)} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {memberError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {memberError}
                  </p>
                )}
              </div>
            )}

            {project.members.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada anggota. Tambahkan pegawai ke proyek ini.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium text-left">Nama</th>
                      <th className="px-4 py-3 font-medium text-left">Jabatan</th>
                      <th className="px-4 py-3 font-medium text-left">Unit</th>
                      <th className="px-4 py-3 font-medium text-left">Bergabung</th>
                      {canDeleteMembers && <th className="px-4 py-3 font-medium text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.members.map((member) => (
                      <MemberRow
                        key={member.employee_id}
                        member={member}
                        removing={removingId === member.employee_id}
                        onRemove={canDeleteMembers ? () => handleRemoveMember(member.employee_id) : undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "tugas" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-slate-700">Daftar Tugas</h3>
                <div className="grid grid-cols-2 bg-white p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTaskView("list")}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
                      taskView === "list" ? "bg-slate-100 text-indigo-700" : "text-slate-600"
                    }`}
                  >
                    <List className="w-4 h-4 mr-1.5" /> List
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskView("kanban")}
                    className={`px-3 py-1.5 text-sm rounded-md flex items-center justify-center ${
                      taskView === "kanban" ? "bg-slate-100 text-indigo-700" : "text-slate-600"
                    }`}
                  >
                    <KanbanSquare className="w-4 h-4 mr-1.5" /> Board
                  </button>
                </div>
              </div>
              {canCreateTasks && (
                <button
                  onClick={() => {
                    setShowAddTask(true);
                    setTaskError(null);
                    setTaskForm({
                      title: "",
                      phase_id: "",
                      assignee: "",
                      priority: "Medium",
                      progress_percentage: 0,
                      start_date: "",
                      end_date: ""
                    });
                  }}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Tugas
                </button>
              )}
            </div>

            {showAddTask && (
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="text-sm font-medium text-indigo-800 mb-3">Tambah Tugas Baru</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Judul tugas..."
                      value={taskForm.title}
                      onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Fase</label>
                    <select
                      value={taskForm.phase_id}
                      onChange={(event) => setTaskForm((current) => ({ ...current, phase_id: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">- Pilih Fase -</option>
                      {phasesSorted.map((phase) => (
                        <option key={phase.id} value={phase.id}>
                          {phase.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Prioritas</label>
                    <select
                      value={taskForm.priority}
                      onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {TASK_PRIORITIES.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Assignee</label>
                    <select
                      value={taskForm.assignee}
                      onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">- Tidak Diassign -</option>
                      {project.members.length > 0
                        ? project.members.map((member) => (
                            <option key={member.employee_id} value={member.employee_id}>
                              {member.employee_name}
                            </option>
                          ))
                        : employees
                            .filter((employee) => employee.status === "Active")
                            .map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taskForm.progress_percentage}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          progress_percentage: Number.isNaN(Number(event.target.value))
                            ? 0
                            : Math.max(0, Math.min(100, Number(event.target.value)))
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={taskForm.start_date}
                      onChange={(event) => setTaskForm((current) => ({ ...current, start_date: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={taskForm.end_date}
                      onChange={(event) => setTaskForm((current) => ({ ...current, end_date: event.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                {taskError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {taskError}
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={taskSaving || !taskForm.title.trim()}
                    className="flex items-center px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {taskSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Simpan Tugas
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {canCreateTasks ? <>Belum ada tugas. Klik <strong>Tambah Tugas</strong> untuk mulai.</> : "Belum ada tugas."}
                </p>
              </div>
            ) : (
              <>
                {taskView === "list" && (
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 font-medium text-left">ID</th>
                          <th className="px-4 py-3 font-medium text-left">Judul</th>
                          <th className="px-4 py-3 font-medium text-left">Fase</th>
                          <th className="px-4 py-3 font-medium text-left">Prioritas</th>
                          <th className="px-4 py-3 font-medium text-left">Progress</th>
                          <th className="px-4 py-3 font-medium text-left">Assignee</th>
                          <th className="px-4 py-3 font-medium text-left">Mulai</th>
                          <th className="px-4 py-3 font-medium text-left">Selesai</th>
                          <th className="px-4 py-3 font-medium text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tasks.map((task) => {
                          const phase = phasesSorted.find((item) => item.id === task.phase_id);
                          return (
                            <tr key={task.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-xs text-slate-400 font-mono">{task.id}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                              <td className="px-4 py-3 text-slate-600">{phase?.name ?? "-"}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                    PRIORITY_COLORS[task.priority] ?? "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <TaskProgressControl
                                  value={task.progress_percentage}
                                  onChange={(next) => void handleTaskProgressChange(task.id, next)}
                                  disabled={!canEditTasks}
                                />
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {resolveAssigneeLabel(task.assignee) || <span className="text-slate-300">-</span>}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(task.start_date)}</td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(task.end_date)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => void handleOpenTaskDetail(task.id)}
                                  className="inline-flex px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  Detail
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {taskView === "kanban" && (
                  <DragDropContext onDragEnd={(result) => void handleTaskKanbanDragEnd(result)}>
                    <div className="flex gap-6 overflow-x-auto pb-2">
                      {phasesSorted.map((phase) => {
                        const phaseTasks = tasks.filter((task) => task.phase_id === phase.id);
                        return (
                          <div key={phase.id} className="w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-xl border border-slate-200">
                            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                              <h3 className="font-semibold text-slate-800 text-sm">{phase.name}</h3>
                              <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {phaseTasks.length}
                              </span>
                            </div>
                            <Droppable droppableId={phase.id}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="p-3 space-y-3 min-h-[140px]"
                                >
                                  {phaseTasks.length === 0 && (
                                    <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded-md px-3 py-2 bg-white">
                                      Belum ada tugas
                                    </div>
                                  )}
                                  {phaseTasks.map((task, index) => (
                                    <Draggable key={task.id} draggableId={task.id} index={index}>
                                      {(draggableProvided) => (
                                        <div
                                          ref={draggableProvided.innerRef}
                                          {...draggableProvided.draggableProps}
                                          {...draggableProvided.dragHandleProps}
                                          className="bg-white p-4 rounded-xl border shadow-sm border-slate-200 cursor-grab active:cursor-grabbing"
                                        >
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold text-slate-400">{task.id}</span>
                                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">
                                              {task.priority}
                                            </span>
                                          </div>
                                          <h4 className="font-medium text-slate-900 mb-2 text-sm">{task.title}</h4>
                                          <button
                                            type="button"
                                            onMouseDown={(event) => event.stopPropagation()}
                                            onClick={() => void handleOpenTaskDetail(task.id)}
                                            className="mb-2 inline-flex px-2.5 py-1 text-[11px] rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100"
                                          >
                                            Buka Detail
                                          </button>
                                          <div className="mb-2">
                                            <label className="block text-[11px] text-slate-500 mb-1">Progress</label>
                                            <TaskProgressControl
                                              value={task.progress_percentage}
                                              onChange={(next) => void handleTaskProgressChange(task.id, next)}
                                              compact
                                              disabled={!canEditTasks}
                                            />
                                          </div>
                                          <p className="text-xs text-slate-500">
                                            Assignee: {resolveAssigneeLabel(task.assignee) || "-"}
                                          </p>
                                          <p className="text-xs text-slate-500 mt-1">
                                            {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                          </p>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "gantt" && (
          <ProjectGanttChart
            project={project}
            tasks={tasks}
            phases={phasesSorted}
            resolveAssigneeLabel={resolveAssigneeLabel}
          />
        )}

        {activeTab === "isu" && (
          <ProjectIssuePanel
            projectId={project.id}
            projectName={project.name}
            assigneeOptions={Array.from(
              new Set(
                [
                  ...project.members.map((member) => member.employee_name ?? "").filter(Boolean),
                  ...employees.filter((employee) => employee.status === "Active").map((employee) => employee.name)
                ].filter((name) => name.trim().length > 0)
              )
            )}
            canCreate={canCreateIssues}
            canEdit={canEditIssues}
            canUploadAttachment={canCreateAttachments}
            onNotice={setSaveNotice}
          />
        )}

        {activeTab === "lampiran" && (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Folder Lampiran</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolder((current) => !current)}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                  >
                    <FolderPlus className="w-3.5 h-3.5 mr-1" /> Folder
                  </button>
                </div>

                {showCreateFolder && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      placeholder="Nama folder..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCreateFolder()}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Simpan Folder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateFolder(false);
                          setNewFolderName("");
                        }}
                        className="px-3 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={folderSearch}
                  onChange={(event) => setFolderSearch(event.target.value)}
                  placeholder="Cari folder..."
                  className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
                />

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(null)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      selectedFolderId === null ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    Semua File
                  </button>
                  {filteredFolderOptions.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md whitespace-pre ${
                        selectedFolderId === folder.id
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <FolderClosed className="inline-block w-3.5 h-3.5 mr-1" />
                      {folder.label}
                    </button>
                  ))}
                  {filteredFolderOptions.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-400">Folder tidak ditemukan.</p>
                  )}
                </div>

                {selectedFolder && (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-600">Kelola Folder Terpilih</p>
                    <input
                      type="text"
                      value={folderEditName}
                      onChange={(event) => setFolderEditName(event.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                    <select
                      value={folderEditParentId ?? ""}
                      onChange={(event) => setFolderEditParentId(event.target.value || null)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value="">(Pindah ke root)</option>
                      {folderOptions
                        .filter((option) => !invalidParentIds.has(option.id))
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveSelectedFolder()}
                        className="inline-flex items-center px-3 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                      >
                        Simpan Folder
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteFolder(selectedFolder.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-12 md:col-span-8 rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload Lampiran</h3>
                <div
                  onDragOver={handleDropzoneDragOver}
                  onDragLeave={handleDropzoneDragLeave}
                  onDrop={handleDropzoneDrop}
                  onClick={() => uploadInputRef.current?.click()}
                  className={`mb-3 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition ${
                    isDropzoneActive
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 text-slate-500 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-medium">Drop file di sini atau klik untuk pilih file</p>
                  <p className="text-xs mt-1">File akan diunggah ke folder yang sedang dipilih.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                  <input
                    type="file"
                    ref={uploadInputRef}
                    onChange={(event) =>
                      setUploadForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                    }
                    className="md:col-span-2 border border-slate-300 rounded-md text-sm px-2 py-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => void handleUploadAttachment()}
                    disabled={!uploadForm.file}
                    className="inline-flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    <FilePlus2 className="w-4 h-4 mr-1.5" /> Upload
                  </button>
                  <input
                    type="text"
                    value={uploadForm.description}
                    onChange={(event) =>
                      setUploadForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Deskripsi file (opsional)"
                    className="md:col-span-3 border border-slate-300 rounded-md text-sm px-3 py-2"
                  />
                </div>

                <input
                  type="text"
                  value={fileSearch}
                  onChange={(event) => setFileSearch(event.target.value)}
                  placeholder="Cari file, deskripsi, atau folder..."
                  className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm"
                />

                {attachmentError && (
                  <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {attachmentError}
                  </p>
                )}

                {attachmentLoading ? (
                  <div className="text-sm text-slate-500 py-8 text-center">Memuat lampiran...</div>
                ) : attachmentFiles.length === 0 ? (
                  <div className="text-sm text-slate-400 py-8 text-center">Belum ada file pada folder ini.</div>
                ) : filteredAttachmentFiles.length === 0 ? (
                  <div className="text-sm text-slate-400 py-8 text-center">
                    Tidak ada file yang cocok dengan pencarian.
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Nama File</th>
                          <th className="px-3 py-2 text-left font-medium">Deskripsi</th>
                          <th className="px-3 py-2 text-left font-medium">Folder</th>
                          <th className="px-3 py-2 text-left font-medium">Ukuran</th>
                          <th className="px-3 py-2 text-right font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAttachmentFiles.map((file) => (
                          <tr key={file.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-800 font-medium">{file.original_name}</td>
                            <td className="px-3 py-2 text-slate-600">{file.description || "-"}</td>
                            <td className="px-3 py-2">
                              <select
                                value={file.folder_id ?? ""}
                                onChange={(event) =>
                                  void handleMoveFileToFolder(file.id, event.target.value || null)
                                }
                                className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs bg-white"
                              >
                                <option value="">(Root)</option>
                                {folderOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {Math.max(1, Math.round(file.size_bytes / 1024))} KB
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void handlePreviewFile(file)}
                                  className="inline-flex items-center px-2 py-1 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDownloadFile(file.id, file.original_name)}
                                  className="inline-flex items-center px-2 py-1 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1" /> Unduh
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDescriptionModal(file)}
                                  className="inline-flex items-center px-2 py-1 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
                                >
                                  Edit Deskripsi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteFile(file.id)}
                                  className="inline-flex items-center px-2 py-1 text-xs border border-red-200 text-red-700 rounded-md hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            priority: selectedTask.priority,
            assignee: selectedTask.assignee,
            createdBy: selectedTask.created_by,
            project: selectedTask.project_id,
            phaseId: selectedTask.phase_id,
            startDate: selectedTask.start_date,
            endDate: selectedTask.end_date,
            progressPercentage: selectedTask.progress_percentage,
            createdAt: selectedTask.created_at,
            updatedAt: selectedTask.updated_at
          }}
          projectName={project.name}
          phaseName={phasesSorted.find((phase) => phase.id === selectedTask.phase_id)?.name ?? "Tanpa Fase"}
          assigneeName={resolveAssigneeLabel(selectedTask.assignee) || selectedTask.assignee}
          comments={taskComments[selectedTask.id] ?? []}
          isLoadingComments={isLoadingTaskComments}
          isSavingComment={isSavingTaskComment}
          canCreateComment={canCreateTaskComments}
          onClose={() => setSelectedTaskId(null)}
          onSubmitComment={handleSubmitTaskComment}
        />
      )}

      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="w-full max-w-5xl max-h-[88vh] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{previewFile.file.original_name}</p>
                <p className="text-xs text-slate-500">
                  {previewFile.file.mime_type || "unknown"} - {Math.max(1, Math.round(previewFile.file.size_bytes / 1024))} KB
                </p>
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="inline-flex items-center px-2.5 py-1.5 text-xs border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(88vh-64px)] bg-slate-50">
              {(previewFile.file.mime_type ?? "").startsWith("image/") && (
                <img src={previewFile.url} alt={previewFile.file.original_name} className="max-w-full h-auto rounded-md mx-auto" />
              )}
              {(previewFile.file.mime_type ?? "").includes("pdf") && (
                <iframe title={previewFile.file.original_name} src={previewFile.url} className="w-full h-[70vh] rounded-md bg-white" />
              )}
              {((previewFile.file.mime_type ?? "").startsWith("text/") || previewFile.text !== undefined) && (
                <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-white border border-slate-200 rounded-md p-3">
                  {previewFile.text ?? "Tidak dapat membaca isi teks."}
                </pre>
              )}
              {!((previewFile.file.mime_type ?? "").startsWith("image/")) &&
                !((previewFile.file.mime_type ?? "").includes("pdf")) &&
                !((previewFile.file.mime_type ?? "").startsWith("text/") || previewFile.text !== undefined) && (
                  <div className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-md p-6 text-center">
                    Preview tidak tersedia untuk tipe file ini. Silakan unduh file.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {descriptionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeDescriptionModal}>
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-800">Edit Deskripsi File</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{descriptionModal.filename}</p>
            </div>
            <div className="p-4">
              <textarea
                value={descriptionModal.description}
                onChange={(event) =>
                  setDescriptionModal((current) =>
                    current ? { ...current, description: event.target.value } : current
                  )
                }
                rows={4}
                placeholder="Tulis deskripsi file..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-y"
              />
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDescriptionModal}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleSaveDescriptionFromModal()}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600"
  };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] ?? "bg-slate-100 text-slate-600"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function MemberRow({
  member,
  removing,
  onRemove
}: {
  member: ApiProjectMember;
  removing: boolean;
  onRemove?: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50 group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
            {(member.employee_name ?? "?")[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="font-medium text-slate-900">{member.employee_name ?? member.employee_id}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-600">{member.employee_position ?? "-"}</td>
      <td className="px-4 py-3 text-slate-500 text-xs">{member.employee_organization ?? "-"}</td>
      <td className="px-4 py-3 text-slate-400 text-xs">
        {new Date(member.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
      </td>
      {onRemove && (
        <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            disabled={removing}
            className="text-red-400 hover:text-red-600 p-1 rounded disabled:opacity-50"
            title="Hapus dari proyek"
          >
            {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </td>
      )}
    </tr>
  );
}

function parseDateValue(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addCalendarDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

function ganttDateLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

function ganttMonthLabel(date: Date) {
  return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

function ganttPriorityClass(priority: ApiTask["priority"]) {
  const styles: Record<ApiTask["priority"], string> = {
    Critical: "bg-red-500",
    High: "bg-orange-500",
    Medium: "bg-blue-500",
    Low: "bg-emerald-500"
  };
  return styles[priority];
}

function ProjectGanttChart({
  project,
  tasks,
  phases,
  resolveAssigneeLabel
}: {
  project: ApiProjectDetail;
  tasks: ApiTask[];
  phases: ApiPhase[];
  resolveAssigneeLabel: (assigneeValue: string) => string;
}) {
  const scheduledTasks = tasks
    .map((task) => ({
      task,
      start: parseDateValue(task.start_date),
      end: parseDateValue(task.end_date)
    }))
    .filter((item): item is { task: ApiTask; start: Date; end: Date } => Boolean(item.start && item.end && item.end >= item.start))
    .sort((left, right) => left.start.getTime() - right.start.getTime() || left.task.title.localeCompare(right.task.title, "id"));

  const unscheduledTasks = tasks.filter((task) => {
    const start = parseDateValue(task.start_date);
    const end = parseDateValue(task.end_date);
    return !start || !end || end < start;
  });

  const projectStart = parseDateValue(project.start_date);
  const projectEnd = parseDateValue(project.end_date);
  const timelineDates = [
    ...scheduledTasks.flatMap((item) => [item.start, item.end]),
    ...(projectStart ? [projectStart] : []),
    ...(projectEnd ? [projectEnd] : [])
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = timelineDates.length
    ? new Date(Math.min(...timelineDates.map((date) => date.getTime())))
    : today;
  const maxDate = timelineDates.length
    ? new Date(Math.max(...timelineDates.map((date) => date.getTime())))
    : addCalendarDays(today, 14);
  const timelineStart = addCalendarDays(minDate, -2);
  const timelineEnd = addCalendarDays(maxDate, 2);
  const totalDays = Math.max(1, daysBetween(timelineStart, timelineEnd) + 1);
  const timelineWidth = Math.max(760, totalDays * (totalDays > 120 ? 10 : totalDays > 60 ? 14 : 24));
  const tickStep = totalDays > 120 ? 30 : totalDays > 60 ? 14 : 7;
  const ticks = Array.from({ length: Math.ceil(totalDays / tickStep) + 1 }, (_, index) =>
    addCalendarDays(timelineStart, index * tickStep)
  ).filter((date) => date <= timelineEnd);
  const todayOffset = today >= timelineStart && today <= timelineEnd
    ? (daysBetween(timelineStart, today) / totalDays) * 100
    : null;

  const scheduledByPhase = phases
    .map((phase) => ({
      phase,
      tasks: scheduledTasks.filter((item) => item.task.phase_id === phase.id)
    }))
    .filter((group) => group.tasks.length > 0);
  const orphanScheduled = scheduledTasks.filter((item) => !phases.some((phase) => phase.id === item.task.phase_id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Gantt Chart Project</h3>
          <p className="mt-1 text-sm text-slate-500">
            Visualisasi timeline berdasarkan tanggal mulai, tanggal selesai, progress, fase, dan assignee tugas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-700">
            {scheduledTasks.length} tugas terjadwal
          </span>
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-700">
            {unscheduledTasks.length} perlu tanggal
          </span>
        </div>
      </div>

      {scheduledTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Belum ada tugas dengan tanggal mulai dan tanggal selesai yang valid.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="min-w-max">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="w-80 shrink-0 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                Tugas
              </div>
              <div className="relative h-14 shrink-0" style={{ width: timelineWidth }}>
                {ticks.map((tick) => {
                  const offset = (daysBetween(timelineStart, tick) / totalDays) * 100;
                  return (
                    <div
                      key={tick.toISOString()}
                      className="absolute top-0 h-full border-l border-slate-200 pl-2 pt-2 text-[11px] font-medium text-slate-500"
                      style={{ left: `${offset}%` }}
                    >
                      {totalDays > 120 ? ganttMonthLabel(tick) : ganttDateLabel(tick)}
                    </div>
                  );
                })}
                {todayOffset !== null && (
                  <div className="absolute top-0 h-full border-l-2 border-red-400" style={{ left: `${todayOffset}%` }}>
                    <span className="absolute left-1 top-8 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                      Hari ini
                    </span>
                  </div>
                )}
              </div>
            </div>

            {[...scheduledByPhase, ...(orphanScheduled.length ? [{ phase: null, tasks: orphanScheduled }] : [])].map((group) => (
              <div key={group.phase?.id ?? "tanpa-fase"}>
                <div className="flex border-b border-slate-200 bg-slate-100/70">
                  <div className="w-80 shrink-0 px-4 py-2 text-xs font-semibold text-slate-700">
                    {group.phase?.name ?? "Tanpa Fase"}
                  </div>
                  <div className="px-3 py-2 text-xs text-slate-500" style={{ width: timelineWidth }}>
                    {group.tasks.length} tugas
                  </div>
                </div>
                {group.tasks.map(({ task, start, end }) => {
                  const left = (daysBetween(timelineStart, start) / totalDays) * 100;
                  const width = Math.max(1.5, ((daysBetween(start, end) + 1) / totalDays) * 100);
                  const progressWidth = Math.max(0, Math.min(100, task.progress_percentage));
                  return (
                    <div key={task.id} className="flex border-b border-slate-100 hover:bg-slate-50">
                      <div className="w-80 shrink-0 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{task.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {task.id} | {resolveAssigneeLabel(task.assignee) || "-"}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {task.progress_percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-16 shrink-0" style={{ width: timelineWidth }}>
                        {ticks.map((tick) => (
                          <div
                            key={`${task.id}-${tick.toISOString()}`}
                            className="absolute top-0 h-full border-l border-slate-100"
                            style={{ left: `${(daysBetween(timelineStart, tick) / totalDays) * 100}%` }}
                          />
                        ))}
                        {todayOffset !== null && (
                          <div className="absolute top-0 h-full border-l border-red-300" style={{ left: `${todayOffset}%` }} />
                        )}
                        <div
                          className={`absolute top-5 h-6 overflow-hidden rounded-md shadow-sm ${ganttPriorityClass(task.priority)}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${task.title} (${formatDate(task.start_date)} - ${formatDate(task.end_date)})`}
                        >
                          <div className="h-full bg-white/35" style={{ width: `${progressWidth}%` }} />
                        </div>
                        <div
                          className="absolute top-12 text-[11px] font-medium text-slate-500"
                          style={{ left: `${left}%` }}
                        >
                          {formatDate(task.start_date)} - {formatDate(task.end_date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {unscheduledTasks.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-amber-900">Tugas Belum Siap Masuk Gantt</h4>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {unscheduledTasks.length} tugas
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {unscheduledTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {task.id} | Mulai: {formatDate(task.start_date)} | Selesai: {formatDate(task.end_date)}
                </p>
              </div>
            ))}
          </div>
          {unscheduledTasks.length > 8 && (
            <p className="mt-2 text-xs text-amber-700">+{unscheduledTasks.length - 8} tugas lain perlu dilengkapi tanggal.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TaskProgressControl({
  value,
  onChange,
  compact = false,
  disabled = false
}: {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const barColorClass =
    safeValue >= 100
      ? "bg-emerald-500"
      : safeValue >= 70
        ? "bg-blue-500"
        : safeValue >= 40
          ? "bg-amber-500"
          : "bg-slate-500";

  return (
    <div className={compact ? "space-y-1.5" : "min-w-[170px] space-y-1.5"}>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColorClass}`}
            style={{ width: `${safeValue}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-600 w-10 text-right">{safeValue}%</span>
      </div>
      <select
        value={safeValue}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs bg-white disabled:bg-slate-100 disabled:text-slate-500"
      >
        {TASK_PROGRESS_OPTIONS.map((optionValue) => (
          <option key={optionValue} value={optionValue}>
            {optionValue}%
          </option>
        ))}
      </select>
    </div>
  );
}
