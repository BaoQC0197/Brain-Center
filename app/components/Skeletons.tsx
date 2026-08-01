'use client'

export function ProjectSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-slate-200 rounded-lg w-2/3" />
            <div className="h-5 bg-slate-200 rounded-full w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-full" />
            <div className="h-3.5 bg-slate-200 rounded w-4/5" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-slate-200 rounded-md w-16" />
            <div className="h-6 bg-slate-200 rounded-md w-20" />
            <div className="h-6 bg-slate-200 rounded-md w-14" />
          </div>
          <div className="border-t-2 border-slate-100 pt-4 flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-24" />
            <div className="h-8 bg-slate-200 rounded-xl w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6 w-full pb-16 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="h-4 bg-slate-200 rounded w-32" />
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-6 bg-slate-200 rounded-full w-20" />
          <div className="h-6 bg-slate-200 rounded-full w-24" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-3 border-b-2 border-slate-200 pb-3">
        <div className="h-10 bg-slate-200 rounded-xl w-36" />
        <div className="h-10 bg-slate-200 rounded-xl w-36" />
        <div className="h-10 bg-slate-200 rounded-xl w-36" />
      </div>

      {/* Content Skeleton */}
      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/2" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl w-full" />
          ))}
        </div>
        <div className="md:col-span-8 bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  )
}

export function SystemConfigsSkeleton() {
  return (
    <div className="space-y-6 w-full pb-16 animate-pulse">
      <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl shadow-sm h-16" />
      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-4 bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-12 bg-slate-200 rounded-xl w-full" />
          ))}
        </div>
        <div className="md:col-span-8 bg-white border-2 border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-96 bg-slate-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  )
}

export function DocBuilderSkeleton() {
  return (
    <div className="space-y-6 w-full pb-16 animate-pulse">
      <div className="flex justify-between items-center h-8">
        <div className="h-4 bg-slate-200 rounded w-48" />
        <div className="h-8 bg-slate-200 rounded-xl w-24" />
      </div>
      <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="grid grid-cols-4 gap-3 pt-4">
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
        </div>
      </div>
      <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-32 bg-slate-200 rounded-xl w-full" />
        <div className="h-12 bg-slate-200 rounded-xl w-40 ml-auto" />
      </div>
    </div>
  )
}
