import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gordon.fi — Tracking Alpha. Printing Gains.',
  description: 'DeFi protocol that copies the best Polymarket traders via automated vaults.',
  openGraph: {
    title: 'Gordon.fi',
    description: 'Tracking Alpha. Printing Gains.',
    siteName: 'Gordon.fi',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gordon.fi',
    description: 'Tracking Alpha. Printing Gains.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A]">{children}</body>
    </html>
  )
}
