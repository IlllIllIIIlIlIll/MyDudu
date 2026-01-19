export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-100 p-4 rounded-2xl h-32">
          <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3"></div>
          <div className="w-20 h-3 bg-gray-200 rounded mb-2"></div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-100 p-4 rounded-2xl h-72 animate-pulse">
      <div className="w-32 h-4 bg-gray-200 rounded mb-4"></div>
      <div className="w-full h-48 bg-gray-200 rounded"></div>
    </div>
  );
}

export function EduCardSkeleton() {
  return (
    <div className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200"></div>
      <div className="p-4">
        <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-full h-3 bg-gray-200 rounded mb-1"></div>
        <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
