import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import type { MeetingFile } from "../../domain/meetings";
import { deleteMeetingFile, downloadMeetingFile, fetchMeetingFiles, uploadMeetingFile } from "../../services/meetingFileApi";

type Props = {
  projectId: string;
  meetingId: number;
  canEdit: boolean;
  onNotice: (notice: { type: "success" | "error"; msg: string }) => void;
  onFilesChanged?: (files: MeetingFile[]) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MeetingFilesPanel({ projectId, meetingId, canEdit, onNotice, onFilesChanged }: Props) {
  const [files, setFiles] = useState<MeetingFile[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const result = await fetchMeetingFiles(projectId, meetingId);
      setFiles(result);
      onFilesChanged?.(result);
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal memuat file meeting." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, [projectId, meetingId]);

  const handleUpload = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const result = await uploadMeetingFile(projectId, meetingId, { file, description: description.trim() || null });
      onNotice({ type: "success", msg: result.message ?? "File meeting berhasil diunggah." });
      setFile(null);
      setDescription("");
      if (inputRef.current) inputRef.current.value = "";
      await loadFiles();
    } catch (error) {
      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal mengunggah file meeting." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="rounded-lg border border-color-border p-3">
          <div className="grid grid-cols-12 gap-2">
            <input
              ref={inputRef}
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={saving}
              className="col-span-12 rounded-md border border-color-border px-3 py-2 text-sm md:col-span-5"
            />
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Deskripsi opsional"
              disabled={saving}
              className="col-span-12 rounded-md border border-color-border px-3 py-2 text-sm md:col-span-5"
            />
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={!file || saving}
              className="col-span-12 inline-flex items-center justify-center rounded-md bg-color-primary px-3 py-2 text-sm text-color-primary-foreground disabled:opacity-60 md:col-span-2"
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
              Upload
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-dashed border-color-border px-4 py-6 text-center text-sm text-color-muted-foreground">
          Memuat file meeting...
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-md border border-dashed border-color-border px-4 py-6 text-center text-sm text-color-muted-foreground">
          Belum ada dokumen pendukung.
        </div>
      ) : (
        <div className="divide-y divide-color-border rounded-lg border border-color-border">
          {files.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2">
              <Paperclip className="h-4 w-4 text-color-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-color-foreground">{item.original_name}</p>
                <p className="text-xs text-color-muted-foreground">
                  {formatFileSize(item.size_bytes)}{item.description ? ` | ${item.description}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void downloadMeetingFile(projectId, meetingId, item.id, item.original_name)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-color-border hover:bg-color-secondary"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const result = await deleteMeetingFile(projectId, meetingId, item.id);
                      onNotice({ type: "success", msg: result.message ?? "File meeting berhasil dihapus." });
                      await loadFiles();
                    } catch (error) {
                      onNotice({ type: "error", msg: error instanceof Error ? error.message : "Gagal menghapus file meeting." });
                    }
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-color-border text-color-destructive hover:bg-color-destructive/10"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
