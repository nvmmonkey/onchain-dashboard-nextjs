// src/components/BotController.tsx - Complete implementation
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Square,
  RefreshCw,
  Plus,
  Edit,
  Shield,
  Zap,
  DollarSign,
  GitBranch,
  Database,
} from "lucide-react";
import ConfigEditor from "./ConfigEditor";
import LogViewer from "./LogViewer";
import TmuxController from "./TmuxController";
import ConnectionStatus from "./ConnectionStatus";
import DebugPanel from "./DebugPanel";
import ActionConsole from "./ActionConsole";
import InteractiveController from "./InteractiveController";
import { useBotStatus } from '@/contexts/BotStatusContext';
import {
  TokenSearchDialog,
  ModifyConfigDialog,
  SpamSettingsDialog,
  JitoSettingsDialog,
  BaseMintDialog,
  MergeMintDialog,
  FlashLoanDialog,
  PoolSettingsDialog,
} from "./dialogs";

const menuOptions = [
  {
    id: 1,
    label: "Add New Token",
    description: "Search and add tokens for arbitrage trading",
    action: "search-token",
    icon: Plus,
  },
  {
    id: 2,
    label: "Manage Tokens",
    description: "View and delete existing tokens",
    action: "modify-config",
    icon: Edit,
  },
  { 
    id: 3, 
    label: "Run Bot", 
    description: "Start the arbitrage bot",
    action: "run-bot", 
    icon: Play 
  },
  { 
    id: 4, 
    label: "Spam Protection", 
    description: "Configure transaction spam settings",
    action: "modify-spam", 
    icon: Shield 
  },
  { 
    id: 5, 
    label: "Jito MEV Settings", 
    description: "Configure MEV bundle and tip settings",
    action: "modify-jito", 
    icon: Zap 
  },
  {
    id: 6,
    label: "Base Currency",
    description: "Switch between SOL and USDC",
    action: "modify-base-mint",
    icon: DollarSign,
  },
  {
    id: 7,
    label: "Multi-Token Mode",
    description: "Enable/disable trading multiple tokens",
    action: "modify-merge-mints",
    icon: GitBranch,
  },
  {
    id: 8,
    label: "DEX Pool Config",
    description: "Set pool quantities per DEX",
    action: "modify-pools",
    icon: GitBranch,
  },
  {
    id: 9,
    label: "Create Lookup Table",
    description: "Create new LUT for optimization",
    action: "create-lookup-table",
    icon: Database,
  },
  {
    id: 10,
    label: "Extend Lookup Table",
    description: "Add addresses to existing LUT",
    action: "extend-lookup-table",
    icon: Database,
  },
  {
    id: 11,
    label: "Flash Loan Settings",
    description: "Configure Kamino flash loans",
    action: "modify-flash-loan",
    icon: Zap,
  },
  {
    id: 12,
    label: "Add Custom LUT",
    description: "Add custom lookup table address",
    action: "add-custom-lookup-table",
    icon: Database,
  },
];

export default function BotController() {
  // Use shared context state for the header
  const { updateStatus } = useBotStatus();
  
  // Keep local state for the component's internal logic
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<
    "controller" | "config" | "logs" | "tmux" | "interactive"
  >("controller");
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<string>("");

  // Dialog states
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showSpamDialog, setShowSpamDialog] = useState(false);
  const [showJitoDialog, setShowJitoDialog] = useState(false);
  const [showBaseMintDialog, setShowBaseMintDialog] = useState(false);
  const [showMergeMintDialog, setShowMergeMintDialog] = useState(false);
  const [showFlashLoanDialog, setShowFlashLoanDialog] = useState(false);
  const [showPoolDialog, setShowPoolDialog] = useState(false);

  // Sync local state with global context
  const syncWithContext = useCallback((connected: boolean, running: boolean, tokenList: string[]) => {
    setIsConnected(connected);
    setIsRunning(running);
    setTokens(tokenList);
    // Update the global context for the header
    updateStatus(connected, running, tokenList);
  }, [updateStatus]);

  const checkBotStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bot/check-session", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
    } catch (error) {
      console.error("Error checking bot status:", error);
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
          return data.result.split("\n").filter(Boolean);
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
    return [];
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });

      if (response.ok) {
        const [running, tokenList] = await Promise.all([
          checkBotStatus(),
          loadTokens(),
        ]);
        // Sync all states at once
        console.log('BotController: Connection successful, syncing with context:', { connected: true, running, tokenCount: tokenList.length });
        syncWithContext(true, running, tokenList);
      } else {
        console.log('BotController: Connection failed, syncing with context');
        syncWithContext(false, false, []);
      }
    } catch (error) {
      console.error("Connection error:", error);
      syncWithContext(false, false, []);
    }
  }, [checkBotStatus, loadTokens, syncWithContext]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Listen for navigation events from the header
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setActiveView(event.detail.view);
    };

    const handleBotStatusChanged = (event: CustomEvent) => {
      console.log('BotController: Received status change from header:', event.detail);
      const { connected, running, tokenList } = event.detail;
      setIsConnected(connected);
      setIsRunning(running);
      setTokens(tokenList);
      
      // If bot just started and we're not on logs view, switch to it
      if (running && activeView !== "logs") {
        console.log('BotController: Bot started, switching to logs view');
        setActiveView("logs");
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    window.addEventListener('botStatusChanged', handleBotStatusChanged as EventListener);
    
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
      window.removeEventListener('botStatusChanged', handleBotStatusChanged as EventListener);
    };
  }, [activeView]);

  const addConsoleOutput = (output: string) => {
    setConsoleOutput((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${output}`,
    ]);
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  const executeAction = async (action: string, inputs?: Record<string, unknown>) => {
    try {
      console.log(`[DEBUG] executeAction called:`);
      console.log(`  - action: '${action}'`);
      console.log(`  - inputs:`, inputs);
      console.log(`BotController: Executing action: ${action}`);
      addConsoleOutput(`Executing: ${action}`);

      const response = await fetch("/api/bot/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, inputs }),
      });

      const data = await response.json();
      console.log(`BotController: Response for ${action}:`, data);

      if (data.error) {
        addConsoleOutput(`❌ Error: ${data.error}`);
        return;
      }

      if (data.result) {
        // Split output by lines and add each non-empty line
        const lines = data.result.split("\n");
        lines.forEach((line: string) => {
          if (line.trim()) {
            addConsoleOutput(line);
          }
        });
      }

      if (data.message) {
        addConsoleOutput(data.message);
      }

      // Handle interactive responses
      if (data.interactive && data.needsInput) {
        addConsoleOutput(`⚠️  Additional input needed: ${data.needsInput}`);
        return data;
      }

      // Refresh data after certain actions
      if (["search-token", "modify-config"].includes(action)) {
        console.log(`BotController: Refreshing tokens after ${action}`);
        const newTokenList = await loadTokens();
        console.log('BotController: Tokens refreshed, syncing with context:', { tokenCount: newTokenList.length });
        // Update local state
        setTokens(newTokenList);
        // Sync with context
        updateStatus(isConnected, isRunning, newTokenList);
      }

      if (action === "run-bot") {
        console.log('BotController: Setting running to true after run-bot action');
        setIsRunning(true);
        // Immediately update context with new status
        updateStatus(isConnected, true, tokens);
        // Switch to logs view immediately so LogViewer can start streaming
        setActiveView("logs");
      } else if (action === "stop-bot") {
        console.log('BotController: Setting running to false after stop-bot action');
        setIsRunning(false);
        // Immediately update context with new status
        updateStatus(isConnected, false, tokens);
      }

      addConsoleOutput("✅ Action completed");
    } catch (error) {
      addConsoleOutput(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleMenuAction = async (action: string) => {
    console.log(`[DEBUG] handleMenuAction called with action: '${action}'`);
    setCurrentAction(action);
    setShowConsole(true);
    clearConsole();
    addConsoleOutput(`Starting action: ${action}`);

    switch (action) {
      case "search-token":
        setShowTokenDialog(true);
        break;

      case "modify-config":
        // Load tokens first
        console.log('BotController: Loading tokens for modify-config');
        const tokenList = await loadTokens();
        console.log('BotController: Tokens loaded, syncing with context:', { tokenCount: tokenList.length });
        syncWithContext(isConnected, isRunning, tokenList);
        setShowConfigDialog(true);
        break;

      case "modify-spam":
        setShowSpamDialog(true);
        break;

      case "modify-jito":
        setShowJitoDialog(true);
        break;

      case "modify-base-mint":
        setShowBaseMintDialog(true);
        break;

      case "modify-merge-mints":
        setShowMergeMintDialog(true);
        break;

      case "modify-flash-loan":
        setShowFlashLoanDialog(true);
        break;

      case "run-bot":
      case "stop-bot":
      case "create-lookup-table":
        console.log(`[DEBUG] Direct execution for action: '${action}'`);
        await executeAction(action);
        break;

      case "modify-pools":
        addConsoleOutput("Fetching current pool settings...");
        await executeAction(action);
        // Show the dialog after displaying current settings
        setTimeout(() => {
          setShowPoolDialog(true);
        }, 2000);
        break;

      case "extend-lookup-table":
        addConsoleOutput("Fetching lookup tables...");
        const tableResult = await executeAction(action);
        if (tableResult?.needsInput === "lookupTableAddress") {
          const address = prompt(
            "Enter lookup table address or selection number:"
          );
          if (address) {
            await executeAction(action, { address });
          }
        }
        break;

      case "add-custom-lookup-table":
        const customAddress = prompt("Enter lookup table address to add:");
        if (customAddress) {
          await executeAction(action, { address: customAddress });
        }
        break;

      default:
        console.log(`[DEBUG] Unknown action: '${action}'`);
        addConsoleOutput(`Action ${action} not implemented yet`);
    }
  };

  const stopBot = async () => {
    setShowConsole(true);
    clearConsole();
    await executeAction("stop-bot");
  };

  // Dialog submit handlers
  const handleTokenSearchSubmit = async (data: Record<string, unknown>) => {
    await executeAction("search-token", data);
  };

  const handleModifyConfigSubmit = async (data: Record<string, unknown>) => {
    addConsoleOutput(`Deleting token at index: ${data.deleteIndex}`);
    await executeAction("modify-config", data);
    // Refresh token list after deletion and sync with context
    console.log('BotController: Refreshing tokens after deletion');
    const newTokenList = await loadTokens();
    console.log('BotController: Tokens refreshed after deletion, syncing:', { tokenCount: newTokenList.length });
    setTokens(newTokenList);
    updateStatus(isConnected, isRunning, newTokenList);
  };

  const handleSpamSubmit = async (data: Record<string, unknown>) => {
    addConsoleOutput(`Modifying spam settings...`);
    addConsoleOutput(`Enable: ${data.enabled}, Option: ${data.option || 'N/A'}`);
    await executeAction("modify-spam", data);
  };

  const handleJitoSubmit = async (data: Record<string, unknown>) => {
    addConsoleOutput(`Modifying Jito settings...`);
    addConsoleOutput(`Choice: ${data.choice}, Enabled: ${data.enabled || 'N/A'}, Min Profit: ${data.minProfit || 'N/A'}, Tip Option: ${data.tipOption || 'N/A'}`);
    await executeAction("modify-jito", data);
  };

  const handleBaseMintSubmit = async (data: Record<string, unknown>) => {
    await executeAction("modify-base-mint", data);
  };

  const handleMergeMintSubmit = async (data: Record<string, unknown>) => {
    await executeAction("modify-merge-mints", data);
  };

  const handleFlashLoanSubmit = async (data: Record<string, unknown>) => {
    await executeAction("modify-flash-loan", data);
  };

  const handlePoolSettingsSubmit = async (data: Record<string, unknown>) => {
    await executeAction("modify-pools", data);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex gap-2">
        <Button
          variant={activeView === "controller" ? "default" : "outline"}
          onClick={() => setActiveView("controller")}
        >
          Controller
        </Button>
        <Button
          variant={activeView === "interactive" ? "default" : "outline"}
          onClick={() => setActiveView("interactive")}
        >
          Interactive
        </Button>
        <Button
          variant={activeView === "config" ? "default" : "outline"}
          onClick={() => setActiveView("config")}
        >
          Config Editor
        </Button>
        <Button
          variant={activeView === "logs" ? "default" : "outline"}
          onClick={() => setActiveView("logs")}
        >
          Logs
        </Button>
        <Button
          variant={activeView === "tmux" ? "default" : "outline"}
          onClick={() => setActiveView("tmux")}
        >
          Tmux Sessions
        </Button>
      </div>

      {activeView === "controller" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ... existing controller content ... */}
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-bold ${
                      isRunning ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isRunning ? "Running" : "Stopped"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Tokens:</span>
                  <span className="font-bold">{tokens.length}</span>
                </div>
                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button
                      onClick={() => handleMenuAction("run-bot")}
                      className="flex-1"
                      disabled={!isConnected}
                    >
                      <Play className="mr-2 h-4 w-4" /> Start Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={stopBot}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="mr-2 h-4 w-4" /> Stop Bot
                    </Button>
                  )}
                  <Button
                    onClick={async () => {
                      console.log('BotController: Manual refresh triggered');
                      const [running, tokenList] = await Promise.all([
                        checkBotStatus(),
                        loadTokens(),
                      ]);
                      console.log('BotController: Manual refresh completed, syncing:', { connected: isConnected, running, tokenCount: tokenList.length });
                      syncWithContext(isConnected, running, tokenList);
                    }}
                    variant="outline"
                    disabled={!isConnected}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("search-token")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="Add new tokens"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="text-xs">Add Token</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-config")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="View & delete tokens"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span className="text-xs">Manage</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-spam")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="Spam settings"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span className="text-xs">Spam</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-jito")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="MEV bundle settings"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  <span className="text-xs">Jito MEV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-pools")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="DEX pool quantities"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  <span className="text-xs">Pools</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-base-mint")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="SOL/USDC base"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span className="text-xs">Base</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("create-lookup-table")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="Create new LUT"
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span className="text-xs">New LUT</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMenuAction("modify-merge-mints")}
                  disabled={!isConnected}
                  className="justify-start"
                  title="Multi-token trading"
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  <span className="text-xs">Multi-Token</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {menuOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      onClick={() => handleMenuAction(option.action)}
                      disabled={!isConnected}
                      className="justify-start h-auto py-3 px-4"
                    >
                      <div className="flex items-start gap-3 w-full">
                        {Icon && <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {showConsole && (
            <div className="md:col-span-2">
              <ActionConsole
                output={consoleOutput}
                currentAction={currentAction}
                onClose={() => setShowConsole(false)}
                onClear={clearConsole}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <DebugPanel />
          </div>
        </div>
      )}

      {activeView === "interactive" && <InteractiveController />}
      {activeView === "config" && <ConfigEditor />}
      {activeView === "logs" && <LogViewer isRunning={isRunning} />}
      {activeView === "tmux" && <TmuxController />}

      {/* Dialogs */}
      <TokenSearchDialog
        open={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
        onSubmit={handleTokenSearchSubmit}
      />

      <ModifyConfigDialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onSubmit={handleModifyConfigSubmit}
        tokens={tokens}
      />

      <SpamSettingsDialog
        open={showSpamDialog}
        onClose={() => setShowSpamDialog(false)}
        onSubmit={handleSpamSubmit}
      />

      <JitoSettingsDialog
        open={showJitoDialog}
        onClose={() => setShowJitoDialog(false)}
        onSubmit={handleJitoSubmit}
      />

      <BaseMintDialog
        open={showBaseMintDialog}
        onClose={() => setShowBaseMintDialog(false)}
        onSubmit={handleBaseMintSubmit}
      />

      <MergeMintDialog
        open={showMergeMintDialog}
        onClose={() => setShowMergeMintDialog(false)}
        onSubmit={handleMergeMintSubmit}
        tokenCount={tokens.length}
      />

      <FlashLoanDialog
        open={showFlashLoanDialog}
        onClose={() => setShowFlashLoanDialog(false)}
        onSubmit={handleFlashLoanSubmit}
      />

      <PoolSettingsDialog
        open={showPoolDialog}
        onClose={() => setShowPoolDialog(false)}
        onSubmit={handlePoolSettingsSubmit}
      />
    </div>
  );
}
