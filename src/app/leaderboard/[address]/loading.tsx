import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, ChartSkeleton, Shimmer } from '@/components/Skeleton';

export default function WalletProfileLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <Shimmer className="w-32 h-3 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Shimmer className="w-12 h-12 rounded-full" />
          <div>
            <Shimmer className="w-40 h-5 mb-2" />
            <Shimmer className="w-56 h-3" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <SectionHeaderSkeleton />
        <ChartSkeleton />
      </main>
    </div>
  );
}
