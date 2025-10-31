'use server';

import { Connection, PublicKey } from '@solana/web3.js';

export async function getTransactionHistory(address: string) {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

  if (!rpcUrl) {
    throw new Error('Missing NEXT_PUBLIC_SOLANA_RPC_URL environment variable');
  }

  try {
    const connection = new Connection(rpcUrl);
    const publicKey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

    return signatures.map((sigInfo) => ({
      signature: sigInfo.signature,
      blockTime: sigInfo.blockTime,
    }));
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return [];
  }
}
