"use client";

// Skeleton loading components for consistent UX across the app

interface SkeletonProps {
  className?: string;
}

const base = "animate-pulse bg-slate-200 rounded";

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <div className={`${base} h-4 w-full ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-4 space-y-3 ${className}`}>
      <div className={`${base} h-5 w-2/3`} />
      <div className={`${base} h-4 w-full`} />
      <div className={`${base} h-4 w-4/5`} />
      <div className="flex gap-2 pt-1">
        <div className={`${base} h-8 w-20`} />
        <div className={`${base} h-8 w-20`} />
      </div>
    </div>
  );
}

export function SkeletonKPI({ className = "" }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 p-5 ${className}`}>
      <div className={`${base} h-3 w-24 mb-3`} />
      <div className={`${base} h-8 w-16 mb-2`} />
      <div className={`${base} h-3 w-28`} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-100">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 flex gap-4 border-b border-slate-100">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`${base} h-4 flex-1`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`${base} h-4 flex-1 ${c === 0 ? "w-1/4" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className={`${base} h-40 w-full rounded-none`} />
          <div className="p-3 space-y-2">
            <div className={`${base} h-4 w-3/4`} />
            <div className={`${base} h-3 w-1/2`} />
            <div className={`${base} h-6 w-1/3`} />
          </div>
        </div>
      ))}
    </div>
  );
}
