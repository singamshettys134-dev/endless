export function CardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-video w-full rounded-2xl" />
      <div className="mt-3 flex gap-3">
        <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-11/12 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton({ compact = false }) {
  return (
    <div className={`flex gap-4 ${compact ? 'p-1.5' : 'p-3'}`} aria-hidden="true">
      <div className={`skeleton aspect-video shrink-0 rounded-xl ${compact ? 'w-40' : 'w-44 sm:w-64'}`} />
      <div className="flex-1 space-y-2 py-1">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
    </div>
  );
}
