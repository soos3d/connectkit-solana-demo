import { ArrowUpRight } from 'lucide-react';

interface ExplorerLinkProps {
  txSignature: string;
  network: string | undefined;
}

export const ExplorerLink = ({ txSignature, network }: ExplorerLinkProps) => {
  const getExplorerUrl = () => {
    const baseUrl = 'https://explorer.solana.com/tx/';
    if (network) {
      if (network.toLowerCase().includes('devnet')) {
        return `${baseUrl}${txSignature}?cluster=devnet`;
      }
      // Mainnet doesn't need a cluster parameter
      if (network.toLowerCase().includes('solana')) {
        return `${baseUrl}${txSignature}`;
      }
      // Fallback for other networks if needed
      return `${baseUrl}${txSignature}?cluster=${network.toLowerCase().replace(' ', '-')}`;
    }
    // Default to mainnet if network is undefined
    return `${baseUrl}${txSignature}`;
  };

  return (
    <a href={getExplorerUrl()} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
      <ArrowUpRight className="h-4 w-4 ml-1" />
    </a>
  );
};
