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
} from "@solana/web3.js";
import { useEffect, useState } from "react";

const App = () => {
  const { address, isConnected, chainId, chain } = useAccount();
  const publicClient = usePublicClient<SolanaChain>();
  const [primaryWallet] = useWallets();
  const solanaWallet = primaryWallet?.getWalletClient<SolanaChain>();

  // State to hold balance, recipient address, and transaction signature
  const [balance, setBalance] = useState<number | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [transactionSignature, setTransactionSignature] = useState<
    string | null
  >(null);

  const fetchBalance = async () => {
    if (isConnected && solanaWallet && publicClient) {
      try {
        const balanceResponse = await publicClient.getBalance(
          solanaWallet.publicKey
        );

        console.log("Balance in SOL:", balanceResponse);
        setBalance(balanceResponse);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      }
    }
  };

  // useEffect to fetch balance
  useEffect(() => {
    fetchBalance();
  }, [isConnected, solanaWallet, publicClient, chainId]);

  const executeTx = async () => {
    try {
      const publicKey = solanaWallet.publicKey;

      // Prepare the transaction object
      const tx = new Transaction();
      tx.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: 0.1 * LAMPORTS_PER_SOL, // Convert 0.1 SOL to lamports
        })
      );

      if (publicClient) {
        const { blockhash, lastValidBlockHeight } =
          await publicClient.getLatestBlockhash({
            commitment: "finalized",
          });

        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;

        const transactionResponse = await solanaWallet.sendTransaction(tx);
        console.log("Transaction sent:", transactionResponse);

        // Set the transaction signature in state
        setTransactionSignature(transactionResponse.signature);
      } else {
        console.error("Public client is not available.");
      }
    } catch (error) {
      console.error("Failed to execute transaction:", error);
    }
  };

  // Standard ConnectButton utilization with inputs for recipient and amount
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <ConnectButton />
        {isConnected && (
          <>
            <h2 className="mt-4">Address: {address}</h2>
            <h2>Chain ID: {chainId}</h2>
            {balance !== null && (
              <div className="flex items-center justify-center space-x-2 mt-4">
                <h2>
                  Balance: {balance} {chain?.nativeCurrency.symbol}
                </h2>
                {/* Button to refresh the balance */}
                <button
                  onClick={fetchBalance}
                  className="bg-purple-500 text-white p-2 rounded"
                >
                  🔄
                </button>
              </div>
            )}
            {/* Input for recipient address */}
            <input
              type="text"
              placeholder="Recipient Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="border border-gray-300 rounded p-2 mt-4 w-full text-black"
            />
            {/* Button to execute transaction */}
            <button
              onClick={executeTx}
              className="bg-purple-500 text-white p-2 rounded mt-4 w-full"
            >
              Send 0.1 {chain?.nativeCurrency.symbol}
            </button>
            {/* Display transaction signature */}
            {transactionSignature && (
              <div className="mt-4">
                <h2>Transaction Signature:</h2>
                <p className="break-words text-blue-500">
                  {transactionSignature}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
