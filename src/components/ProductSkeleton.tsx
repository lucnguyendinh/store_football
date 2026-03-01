export default function ProductSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="h-4 bg-gray-200 rounded-full w-12" />
          <div className="h-4 bg-gray-200 rounded-full w-10" />
        </div>
      </div>
    </div>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  )
}
