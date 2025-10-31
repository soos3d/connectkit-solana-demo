"use client";

import React from "react";
import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import {
  wallet,
  type EntryPosition,
} from "@particle-network/connectkit/wallet";
import {
  defineChain,
  solanaDevnet,
  Chain,
} from "@particle-network/connectkit/chains";
import { authWalletConnectors } from "@particle-network/connectkit/auth";

import {
  solanaWalletConnectors,
  injected as solaInjected,
} from "@particle-network/connectkit/solana";

const supportChains: Chain[] = [];
// solana start
//supportChains.push(solanaDevnet);
// solana end

supportChains.push(
  defineChain({
    id: 101,
    name: "Solana",
    nativeCurrency: {
      decimals: 18,
      name: "Solana",
      symbol: "SOL",
    },
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL!],
      },
    },
    blockExplorers: {
      default: { name: "Explorer", url: "https://explorer.solana.com" },
    },
    testnet: false,
    custom: {
      // icon: "https://ICON_URL",
    },
  })
);

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
  appId: process.env.NEXT_PUBLIC_APP_ID!,
  appearance: {
    recommendedWallets: [{ walletId: "phantom", label: "Popular" }],
    theme: {
      "--pcm-font-family": "'__Poppins_68bcaa', '__Poppins_Fallback_68bcaa'",
      "--pcm-rounded-sm": "4px",
      "--pcm-rounded-md": "8px",
      "--pcm-rounded-lg": "11px",
      "--pcm-rounded-xl": "22px",
    },
    splitEmailAndPhone: false,
    collapseWalletList: false,
    hideContinueButton: false,
    connectorsOrder: ["social", "wallet"],
    language: "en-US",
    collapsePasskeyButton: true,
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: [
        "google",
        "apple",
        "github",
        "facebook",
        "twitter",
        "microsoft",
        "discord",
        "twitch",
        "linkedin",
      ],
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 0,
        promptPaymentPasswordSettingWhenSign: 0,
      },
    }),

    solanaWalletConnectors({
      connectorFns: [
        solaInjected({ target: "coinbaseWallet" }),
        solaInjected({ target: "okxWallet" }),
        solaInjected({ target: "phantom" }),
        solaInjected({ target: "trustWallet" }),
        solaInjected({ target: "bitKeep" }),
      ],
    }),
  ],
  plugins: [
    wallet({
      entryPosition: "bottom-right" as EntryPosition,
      visible: false,
      customStyle: {
        fiatCoin: "USD",
      },
    }),
  ],
  chains: supportChains as unknown as readonly [Chain, ...Chain[]],
});

// Wrap your application with this component.
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
