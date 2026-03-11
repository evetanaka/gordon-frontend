import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, ChartSkeleton, Shimmer } from '@/components/Skeleton';

export default function VaultDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <Shimmer className="w-32 h-3 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Shimmer className="w-48 h-7" />
          <Shimmer className="w-16 h-5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <SectionHeaderSkeleton />
        <ChartSkeleton />
        <div className="mt-8">
          <SectionHeaderSkeleton />
          <div className="grid md:grid-cols-2 gap-4">
            <Shimmer className="h-40" />
            <Shimmer className="h-40" />
          </div>
        </div>
      </main>
    </div>
  );
}
