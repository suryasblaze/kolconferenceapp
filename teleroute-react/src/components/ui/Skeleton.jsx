export function Skeleton({ className = '', width, height, rounded = 'md' }) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`skeleton ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem'
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3">
        <Skeleton width="40px" height="40px" rounded="full" />
        <div className="flex-1">
          <Skeleton height="14px" width="60%" className="mb-2" />
          <Skeleton height="10px" width="40%" />
        </div>
        <Skeleton width="60px" height="24px" rounded="full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex gap-2 p-3 bg-slate-50 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} height="12px" width={`${100 / cols}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex gap-2 p-3 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} height="14px" width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMeetingCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <div className="flex items-start gap-3">
        <Skeleton width="48px" height="48px" rounded="lg" />
        <div className="flex-1">
          <Skeleton height="16px" width="70%" className="mb-2" />
          <Skeleton height="12px" width="50%" className="mb-2" />
          <div className="flex gap-2">
            <Skeleton width="60px" height="20px" rounded="full" />
            <Skeleton width="80px" height="20px" rounded="full" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton width="50px" height="20px" rounded="lg" className="mb-2" />
          <Skeleton width="30px" height="12px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRatesList() {
  return (
    <div className="p-4">
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}

export function SkeletonMeetingsList() {
  return (
    <div className="p-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <SkeletonMeetingCard key={idx} />
      ))}
    </div>
  );
}

export function SkeletonOffersList() {
  return (
    <div className="p-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

export default Skeleton;
