"use client";

import {
  ConnectButton,
  useAccount,
  type SolanaChain,
  useWallets,
  usePublicClient,
} from "@particle-network/connectkit";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useEffect, useState, useCallback } from "react";
import bs58 from "bs58";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/CopyButton";
import { ExplorerLink } from "@/components/ExplorerLink";
import { Header } from "@/components/Header";
import { getTransactionHistory } from "./actions";

interface HistoryItem {
  signature: string;
  blockTime: number | null | undefined;
}

// USDC mint address on Solana mainnet-beta
const USDC_MINT_ADDRESS = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

const App = () => {
  const { address, isConnected, chainId, chain } = useAccount();
  const publicClient = usePublicClient<SolanaChain>();
  const [primaryWallet] = useWallets();
  const solanaWallet = primaryWallet?.getWalletClient<SolanaChain>();

  // State for SOL
  const [balance, setBalance] = useState<number | null>(null);

  // State for USDC
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  // State for transaction history
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Common state
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [solAmount, setSolAmount] = useState<string>("0.0001");
  const [usdcAmount, setUsdcAmount] = useState<string>("0.1");

  const truncateSignature = (sig: string) => {
    if (!sig) return "";
    return `${sig.substring(0, 10)}...${sig.substring(sig.length - 10)}`;
  };

  const fetchSolBalance = useCallback(async () => {
    if (isConnected && solanaWallet && publicClient) {
      try {
        const balanceResponse = await publicClient.getBalance(
          solanaWallet.publicKey
        );
        setBalance(balanceResponse / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Failed to fetch SOL balance:", error);
      }
    }
  }, [isConnected, solanaWallet, publicClient]);

  const fetchUsdcBalance = useCallback(async () => {
    if (isConnected && solanaWallet && publicClient) {
      try {
        const ata = await getAssociatedTokenAddress(
          USDC_MINT_ADDRESS,
          solanaWallet.publicKey
        );
        const accountInfo = await publicClient.getParsedAccountInfo(ata);

        if (accountInfo.value) {
          const tokenAmount = (accountInfo.value.data as any).parsed.info
            .tokenAmount.uiAmount;
          setUsdcBalance(tokenAmount);
        } else {
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance(0);
      }
    }
  }, [isConnected, solanaWallet, publicClient]);

  const fetchHistory = useCallback(async () => {
    if (isConnected && address) {
      const signatures = await getTransactionHistory(address);
      setHistory(signatures);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected) {
      fetchSolBalance();
      fetchUsdcBalance();
      fetchHistory();
    }
  }, [isConnected, fetchSolBalance, fetchUsdcBalance, fetchHistory]);

  const executeSolTx = async () => {
    if (!solanaWallet || !publicClient || !recipientAddress) return;
    try {
      const publicKey = solanaWallet.publicKey;
      const tx = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 100000,
          })
        )
        .add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: parseFloat(solAmount) * LAMPORTS_PER_SOL,
          })
        );
      const { blockhash, lastValidBlockHeight } =
        await publicClient.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = publicKey;

      await solanaWallet.sendTransaction(tx);
      // Refresh history after transaction
      setTimeout(fetchHistory, 1000);
    } catch (error) {
      console.error("Failed to execute SOL transaction:", error);
    }
  };

  const executeUsdcTx = async () => {
    if (!solanaWallet || !publicClient || !recipientAddress) return;
    try {
      const fromPublicKey = solanaWallet.publicKey;
      const toPublicKey = new PublicKey(recipientAddress);

      const fromAta = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        fromPublicKey
      );
      const toAta = await getAssociatedTokenAddress(
        USDC_MINT_ADDRESS,
        toPublicKey,
        true // Allow off-curve addresses for the owner (to send to programs/smart accounts)
      );

      const tx = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 100000,
        })
      );
      const toAtaAccount = await publicClient.getAccountInfo(toAta);

      if (!toAtaAccount) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            fromPublicKey,
            toAta,
            toPublicKey,
            USDC_MINT_ADDRESS
          )
        );
      }

      tx.add(
        createTransferInstruction(
          fromAta,
          toAta,
          fromPublicKey,
          parseFloat(usdcAmount) * 1000000 // 6 decimals for USDC
        )
      );

      const { blockhash, lastValidBlockHeight } =
        await publicClient.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = fromPublicKey;

      await solanaWallet.sendTransaction(tx);
      // Refresh history after transaction
      setTimeout(fetchHistory, 1000);
    } catch (error) {
      console.error("Failed to execute USDC transaction:", error);
    }
  };

  const signMessage = async () => {
    if (!solanaWallet) return;
    try {
      const message = new TextEncoder().encode("Particle signing a message");
      await solanaWallet.signMessage(message);
      // Refresh history after signing
      setTimeout(fetchHistory, 1000);
    } catch (error) {
      console.error("Failed to sign message:", error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 md:p-8 gap-4">
      <div className="w-full max-w-7xl mx-auto">
        <Header />
        <div className="text-center my-8">
          <p className="text-lg text-gray-400">
            A demo application for making basic transfers and swaps on the Solana network.
          </p>
        </div>
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Wallet Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono text-sm">{address}</span>
                    <CopyButton textToCopy={address || ""} />
                  </div>
                  <p className="text-sm text-gray-500">Chain ID: {chainId}</p>
                </CardContent>
              </Card>

              {/* Balances */}
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Balances</CardTitle>
                  <CardDescription>SOL and USDC balances</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">
                        {balance ?? "..."} {chain?.nativeCurrency.symbol}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchSolBalance}
                    >
                      🔄
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">
                        {usdcBalance ?? "..."} USDC
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchUsdcBalance}
                    >
                      🔄
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      type="text"
                      placeholder="Enter recipient address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="sol-amount">SOL Amount</Label>
                      <Input
                        id="sol-amount"
                        type="number"
                        placeholder="0.01"
                        value={solAmount}
                        onChange={(e) => setSolAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={executeSolTx}
                      disabled={!recipientAddress || !solAmount}
                      className="w-full"
                    >
                      Send {chain?.nativeCurrency.symbol}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="usdc-amount">USDC Amount</Label>
                      <Input
                        id="usdc-amount"
                        type="number"
                        placeholder="1.00"
                        value={usdcAmount}
                        onChange={(e) => setUsdcAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={executeUsdcTx}
                      disabled={!recipientAddress || !usdcAmount}
                      className="w-full"
                    >
                      Send USDC
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={signMessage} className="w-full">
                    Sign Message
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-500">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.signature} className="flex items-center justify-between">
                        <div>
                          <p className="break-words font-mono text-xs">
                            {truncateSignature(item.signature)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.blockTime
                              ? new Date(item.blockTime * 1000).toLocaleString()
                              : 'Date not available'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <CopyButton textToCopy={item.signature} />
                          <ExplorerLink txSignature={item.signature} network={chain?.name} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No transactions yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
