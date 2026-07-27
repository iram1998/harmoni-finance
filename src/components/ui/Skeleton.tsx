import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high/70 ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col justify-between ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-fadeIn">
      {/* Welcome Header Skeleton */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Bento Grid Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance Card Skeleton */}
        <div className="p-6 lg:p-8 bg-surface-container-high rounded-xl border border-outline-variant flex flex-col justify-between h-[280px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-12 w-56 mb-8" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/40 pt-4">
            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </div>

        {/* Tagihan Mendatang Skeleton */}
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col justify-between h-[280px]">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 border border-outline-variant/60 rounded-lg">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-center gap-3 p-3 border border-outline-variant/60 rounded-lg">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>

        {/* Current Goals Skeleton */}
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col justify-between h-[280px]">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="p-3 border border-outline-variant/60 rounded-lg space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="p-3 border border-outline-variant/60 rounded-lg space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Amplop Anggaran Skeleton */}
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function CashFlowSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Chart & Breakdowns Skeleton */}
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AssetsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <Skeleton className="h-10 w-52 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[140px] flex flex-col justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[140px] flex flex-col justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[140px] flex flex-col justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[340px] flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-52 w-52 rounded-full mx-auto" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[340px] flex flex-col justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>

      {/* Assets List */}
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function BillsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Rows */}
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function BudgetingSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="md:col-span-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant flex flex-col justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Envelopes list */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn p-4 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[130px] flex flex-col justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="md:col-span-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[130px] flex flex-col justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="md:col-span-4 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant h-[130px] flex flex-col justify-between animate-pulse">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-36 w-36 rounded-full mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-36 w-36 rounded-full mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-5" />
          </div>
          <Skeleton className="h-36 w-36 rounded-full mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>

      {/* Breakdown metrics */}
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto p-4 md:p-8">
      <div className="text-center space-y-3">
        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
        <Skeleton className="h-6 w-40 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto p-4 md:p-8">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="p-6 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-6">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="flex justify-between items-center py-2 border-b border-outline-variant/50">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <div className="flex justify-between items-center py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
