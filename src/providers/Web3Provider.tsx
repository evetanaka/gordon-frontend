'use client'

import { ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

const config = getDefaultConfig({
  appName: 'Gordon.fi',
  projectId: '04b6b227e5604e2e8437607e3a30f524',
  chains: [sepolia],
  ssr: true,
})

const gordonTheme = darkTheme({
  accentColor: '#00FF66',
  accentColorForeground: '#0A0A0A',
  borderRadius: 'none',
  fontStack: 'system',
})

// Override specific theme values
gordonTheme.colors.modalBackground = '#0A0A0A'
gordonTheme.colors.profileForeground = '#0A0A0A'
gordonTheme.fonts.body = 'JetBrains Mono, monospace'

export default function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={gordonTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
