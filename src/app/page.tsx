import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { HowItWorks } from '@/components/HowItWorks'
import { Leaderboard } from '@/components/Leaderboard'
import { Vaults } from '@/components/Vaults'
import { Tokenomics } from '@/components/Tokenomics'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Leaderboard />
      <Vaults />
      <Tokenomics />
      <CTA />
      <Footer />
    </main>
  )
}
