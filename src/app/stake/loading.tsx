import { NavSkeleton, BottomNavSkeleton, SectionHeaderSkeleton, StatCardSkeleton, StakePositionSkeleton, StakeFormSkeleton, Shimmer } from '@/components/Skeleton';

export default function StakeLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <SectionHeaderSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid lg:grid-cols-5 gap-4 mb-8">
          <div className="lg:col-span-3">
            <StakePositionSkeleton />
          </div>
          <div className="lg:col-span-2">
            <StakeFormSkeleton />
          </div>
        </div>
        <SectionHeaderSkeleton />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Shimmer key={i} className="w-full h-32" />)}
        </div>
      </main>
    </div>
  );
}
