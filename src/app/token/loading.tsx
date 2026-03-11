import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, ChartSkeleton, BurnLogSkeleton, Shimmer } from '@/components/Skeleton';

export default function TokenLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <SectionHeaderSkeleton />
        <ChartSkeleton />
        <div className="mt-8">
          <SectionHeaderSkeleton />
          <div className="bg-[#0A0A0A] border border-[#222] p-6 max-h-[400px]">
            <Shimmer className="w-64 h-3 mb-4" />
            <BurnLogSkeleton />
          </div>
        </div>
        <div className="mt-8">
          <SectionHeaderSkeleton />
          <Shimmer className="w-full h-48" />
        </div>
      </main>
    </div>
  );
}
