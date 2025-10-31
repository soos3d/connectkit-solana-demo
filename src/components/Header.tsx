/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useAccount,
  useModal,
  useDisconnect,
} from "@particle-network/connectkit";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export const Header = () => {
  const { setOpen } = useModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full flex justify-between items-center py-4 mb-4 border-b">
      <img
        src="https://mintcdn.com/particlenetwork-fccf74d2-ua-sdk-updates/KCUJu9Qe-HMYh0BV/logo/dark.png?fit=max&auto=format&n=KCUJu9Qe-HMYh0BV&q=85&s=fd577badf731944decae6dd9572b4cd8"
        alt="Particle Logo"
        className=" h-12"
      />
      <h1 className="text-2xl font-bold">Particle Solana Widget</h1>
      {!isConnected ? (
        <Button onClick={() => setOpen(true)}>Connect Wallet</Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {truncateAddress(address!)}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => disconnect()}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
