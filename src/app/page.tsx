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
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);

  // State for USDC
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [usdcTransactionSignature, setUsdcTransactionSignature] = useState<
    string | null
  >(null);

  const [signMessageSignature, setSignMessageSignature] = useState<
    string | null
  >(null);

  // Common state
  const [recipientAddress, setRecipientAddress] = useState<string>("");

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

  useEffect(() => {
    if (isConnected) {
      fetchSolBalance();
      fetchUsdcBalance();
    }
  }, [isConnected, fetchSolBalance, fetchUsdcBalance]);

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
            lamports: 0.0001 * LAMPORTS_PER_SOL,
          })
        );
      const { blockhash, lastValidBlockHeight } =
        await publicClient.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = publicKey;

      const transactionResponse = await solanaWallet.sendTransaction(tx);
      setTransactionSignature(transactionResponse.signature);
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
          100000 // 0.1 USDC (6 decimals)
        )
      );

      const { blockhash, lastValidBlockHeight } =
        await publicClient.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = fromPublicKey;

      const transactionResponse = await solanaWallet.sendTransaction(tx);
      setUsdcTransactionSignature(transactionResponse.signature);
    } catch (error) {
      console.error("Failed to execute USDC transaction:", error);
    }
  };

  const signMessage = async () => {
    if (!solanaWallet) return;
    try {
      const message = new TextEncoder().encode("Particle signing a message");
      const { signature } = await solanaWallet.signMessage(message);
      console.log("Signature:", bs58.encode(signature));
      setSignMessageSignature(bs58.encode(signature));
    } catch (error) {
      console.error("Failed to sign message:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-4">
        <ConnectButton />
        {isConnected && (
          <>
            <div className="mt-4">
              <h2>Address: {address}</h2>
              <h2>Chain ID: {chainId}</h2>
            </div>

            {/* SOL Balance and Actions */}
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <h2>
                  Balance: {balance ?? "..."} {chain?.nativeCurrency.symbol}
                </h2>
                <button
                  onClick={fetchSolBalance}
                  className="bg-purple-500 text-white p-2 rounded"
                >
                  🔄
                </button>
              </div>
              {transactionSignature && (
                <div className="mt-2">
                  <h3>SOL Tx Signature:</h3>
                  <p className="break-words text-blue-500">
                    {transactionSignature}
                  </p>
                </div>
              )}
            </div>

            {/* USDC Balance and Actions */}
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <h2>Balance: {usdcBalance ?? "..."} USDC</h2>
                <button
                  onClick={fetchUsdcBalance}
                  className="bg-blue-500 text-white p-2 rounded"
                >
                  🔄
                </button>
              </div>
              {usdcTransactionSignature && (
                <div className="mt-2">
                  <h3>USDC Tx Signature:</h3>
                  <p className="break-words text-green-500">
                    {usdcTransactionSignature}
                  </p>
                </div>
              )}
            </div>

            {/* Sign Message */}
            <div className="mt-4 p-4 border rounded-lg">
              <button
                onClick={signMessage}
                className="bg-green-500 text-white p-2 rounded w-full"
              >
                Sign Message
              </button>
              {signMessageSignature && (
                <div className="mt-2">
                  <h3>Signed Message Signature:</h3>
                  <p className="break-words text-purple-500">
                    {signMessageSignature}
                  </p>
                </div>
              )}
            </div>

            {/* Common Controls */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="border border-gray-300 rounded p-2 w-full text-black"
              />
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={executeSolTx}
                  className="bg-purple-500 text-white p-2 rounded w-full"
                >
                  Send 0.0001 {chain?.nativeCurrency.symbol}
                </button>
                <button
                  onClick={executeUsdcTx}
                  className="bg-blue-500 text-white p-2 rounded w-full"
                >
                  Send 0.1 USDC
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
