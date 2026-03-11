import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, ChartSkeleton } from '@/components/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <SectionHeaderSkeleton />
        <ChartSkeleton />
      </main>
    </div>
  );
}
