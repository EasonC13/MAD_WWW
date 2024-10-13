import React from "react";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import {
  SuiClientProvider,
  WalletProvider,
  lightTheme,
} from "@mysten/dapp-kit";
import { type StateStorage } from "zustand/middleware";

type Props = {
  children: React.ReactNode;
};

import { registerStashedWallet } from "@mysten/zksend";

registerStashedWallet("MoveAiBot", {});

const SuiWalletProvider = ({ children }: Props) => {
  const networks = {
    localnet: { url: getFullnodeUrl("localnet") },
    devnet: { url: getFullnodeUrl("devnet") },
    testnet: { url: getFullnodeUrl("testnet") },
    mainnet: { url: getFullnodeUrl("mainnet") },
  };

  if (typeof window === "undefined") return <></>;
  return (
    <>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider
          theme={lightTheme}
          autoConnect={true}
          storage={localStorage as StateStorage}
          storageKey="sui-wallet"
          preferredWallets={["Sui Wallet"]}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </>
  );
};

export default SuiWalletProvider;
