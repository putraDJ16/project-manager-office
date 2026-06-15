type CursorPaginationControlsProps = {
  total: number;
  rangeStart: number;
  rangeEnd: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

type LegacyPaginationControlsProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
};

type PaginationControlsProps = CursorPaginationControlsProps | LegacyPaginationControlsProps;

export function PaginationControls(props: PaginationControlsProps) {
  const { className } = props;

  if ("page" in props) {
    const { page, pageSize, totalItems, onPageChange } = props;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

    return (
      <div className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${className ?? ""}`}>
        <p className="text-[var(--ink-3)]">
          Menampilkan {start}-{end} dari {totalItems} data
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--ink-2)] hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <span className="text-[var(--ink-2)]">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--ink-2)] hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Berikutnya
          </button>
        </div>
      </div>
    );
  }

  const { total, rangeStart, rangeEnd, hasPrev, hasNext, onPrev, onNext } = props;

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${className ?? ""}`}>
      <p className="text-[var(--ink-3)]">
        Menampilkan {rangeStart}-{rangeEnd} dari {total} data
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--ink-2)] hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[var(--ink-2)] hover:bg-[var(--bg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
