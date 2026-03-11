'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export default function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="border border-[#00FF66] bg-transparent text-[#00FF66] px-4 py-2 font-mono text-sm hover:bg-[#00FF66] hover:text-[#0A0A0A] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {'> CONNECT_WALLET'}
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="border border-red-500 bg-transparent text-red-500 px-4 py-2 font-mono text-sm hover:bg-red-500 hover:text-[#0A0A0A] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {'> WRONG_NETWORK'}
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="border border-[#333] bg-transparent text-[#888] px-3 py-2 font-mono text-xs hover:border-[#00FF66] hover:text-[#00FF66] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="border border-[#00FF66] bg-transparent text-[#00FF66] px-4 py-2 font-mono text-sm hover:bg-[#00FF66] hover:text-[#0A0A0A] transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {account.displayName}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
