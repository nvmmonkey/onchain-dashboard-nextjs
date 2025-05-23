"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface BotStatusContextType {
  isConnected: boolean;
  isRunning: boolean;
  tokenCount: number;
  tokens: string[];
  isLoading: boolean;
  lastUpdated: Date | null;
  refreshStatus: () => Promise<void>;
  startBot: () => Promise<void>;
  stopBot: () => Promise<void>;
  updateStatus: (connected: boolean, running: boolean, tokenList: string[]) => void;
}

const BotStatusContext = createContext<BotStatusContextType | undefined>(undefined);

export function BotStatusProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isLoadingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const checkBotStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bot/check-session", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        return data.exists || false;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      const response = await fetch("/api/bot/get-tokens", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const tokenList = data.result.split("\n").filter(Boolean);
          return tokenList;
        }
      }
    } catch {
      return [];
    }
    return [];
  }, []);

  const refreshStatus = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('Context: Already loading, skipping refresh');
      return;
    }
    
    setIsLoading(true);
    isLoadingRef.current = true;
    console.log('Context: Refreshing status...');
    try {
      const [connected, running, tokenList] = await Promise.all([
        checkConnection(),
        checkBotStatus(),
        loadTokens(),
      ]);
      
      console.log('Context: Status refreshed:', { connected, running, tokenCount: tokenList.length });
      
      setIsConnected(connected);
      setIsRunning(running);
      setTokens(tokenList);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing bot status:", error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [checkConnection, checkBotStatus, loadTokens]);

  // This function allows BotController to update the shared state
  const updateStatus = useCallback((connected: boolean, running: boolean, tokenList: string[]) => {
    console.log('Context: Updating status from BotController:', { connected, running, tokenCount: tokenList.length });
    setIsConnected(connected);
    setIsRunning(running);
    setTokens(tokenList);
    setLastUpdated(new Date());
    
    // Notify all listeners about the status change
    window.dispatchEvent(new CustomEvent('botStatusChanged', { 
      detail: { connected, running, tokenList, tokenCount: tokenList.length } 
    }));
  }, []);

  const startBot = useCallback(async () => {
    setIsLoading(true);
    console.log('Context: Starting bot...');
    try {
      // Optimistically update the state immediately
      setIsRunning(true);
      setLastUpdated(new Date());
      
      // Then execute the command
      const response = await fetch("/api/bot/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-bot" }),
      });
      
      const data = await response.json();
      console.log('Context: Start bot response:', data);
      
      if (!response.ok || data.error) {
        // Revert on error
        console.error('Context: Failed to start bot:', data);
        setIsRunning(false);
        // Refresh to get actual state
        await refreshStatus();
      } else {
        // Notify listeners of the change
        window.dispatchEvent(new CustomEvent('botStatusChanged', { 
          detail: { connected: isConnected, running: true, tokenList: tokens, tokenCount: tokens.length } 
        }));
        
        // Verify the state after a short delay
        setTimeout(async () => {
          const running = await checkBotStatus();
          if (running !== true) {
            console.log('Context: Bot verification failed, updating state');
            setIsRunning(running);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Context: Error starting bot:", error);
      setIsRunning(false);
      await refreshStatus();
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, tokens, checkBotStatus, refreshStatus]);

  const stopBot = useCallback(async () => {
    setIsLoading(true);
    console.log('Context: Stopping bot...');
    try {
      // Optimistically update the state immediately
      setIsRunning(false);
      setLastUpdated(new Date());
      
      // Then execute the command
      const response = await fetch("/api/bot/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop-bot" }),
      });
      
      const data = await response.json();
      console.log('Context: Stop bot response:', data);
      
      if (!response.ok || data.error) {
        // Revert on error
        console.error('Context: Failed to stop bot:', data);
        setIsRunning(true);
        // Refresh to get actual state
        await refreshStatus();
      } else {
        // Notify listeners of the change
        window.dispatchEvent(new CustomEvent('botStatusChanged', { 
          detail: { connected: isConnected, running: false, tokenList: tokens, tokenCount: tokens.length } 
        }));
        
        // Don't verify immediately as tmux might still show as running briefly
        // Just trust that the stop command worked
      }
    } catch (error) {
      console.error("Context: Error stopping bot:", error);
      setIsRunning(true);
      await refreshStatus();
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, tokens, refreshStatus]);

  // Auto-refresh every 60 seconds (infrequent to avoid conflicts with BotController)
  useEffect(() => {
    refreshStatus(); // Initial load
    
    const interval = setInterval(() => {
      console.log('Context: Auto-refresh triggered (60s interval)');
      refreshStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const value = {
    isConnected,
    isRunning,
    tokenCount: tokens.length,
    tokens,
    isLoading,
    lastUpdated,
    refreshStatus,
    startBot,
    stopBot,
    updateStatus,
  };

  return (
    <BotStatusContext.Provider value={value}>
      {children}
    </BotStatusContext.Provider>
  );
}

export function useBotStatus() {
  const context = useContext(BotStatusContext);
  if (context === undefined) {
    throw new Error('useBotStatus must be used within a BotStatusProvider');
  }
  return context;
}
