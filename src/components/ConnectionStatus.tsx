"use client";

import React from "react";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export default function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4" />
          Connected to VPS
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          Disconnected
        </>
      )}
    </div>
  );
}
