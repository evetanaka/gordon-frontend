import { NavSkeleton, BottomNavSkeleton, VaultCardSkeleton, Shimmer } from '@/components/Skeleton';

export default function VaultsLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <NavSkeleton />
      <BottomNavSkeleton />
      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-12 md:pb-24">
        <Shimmer className="w-full h-16 mb-8" />
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => <Shimmer key={i} className="w-24 h-9" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <VaultCardSkeleton key={i} />)}
        </div>
      </main>
    </div>
  );
}
