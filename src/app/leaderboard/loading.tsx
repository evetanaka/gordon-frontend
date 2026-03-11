import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, TableRowSkeleton, Shimmer } from '@/components/Skeleton';

export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} className="w-24 h-9" />)}
        </div>
        <Shimmer className="w-full h-10 mb-4" />
        <div className="border border-[#222]">
          {Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      </main>
    </div>
  );
}
