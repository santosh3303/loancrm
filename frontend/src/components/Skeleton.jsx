export function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="h-6 bg-gray-100 rounded w-1/4" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-t border-gray-50 animate-pulse">
      <td className="p-3"><div className="h-3 bg-gray-100 rounded w-24" /></td>
      <td><div className="h-3 bg-gray-100 rounded w-20" /></td>
      <td><div className="h-3 bg-gray-100 rounded w-16" /></td>
      <td><div className="h-3 bg-gray-100 rounded w-16" /></td>
    </tr>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-3 animate-pulse">
          <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
          <div className="h-2.5 bg-gray-50 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
