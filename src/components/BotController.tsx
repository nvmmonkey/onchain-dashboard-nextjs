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
    label: "Search and update (add tokens)",
    action: "search-token",
    icon: Plus,
  },
  {
    id: 2,
    label: "Modify the config (view/delete tokens)",
    action: "modify-config",
    icon: Edit,
  },
  { id: 3, label: "Modify Spam settings", action: "modify-spam", icon: Shield },
  { id: 4, label: "Modify Jito settings", action: "modify-jito", icon: Zap },
  {
    id: 5,
    label: "Modify DEX pool quantities",
    action: "modify-pools",
    icon: GitBranch,
  },
  {
    id: 6,
    label: "Modify Base Mint",
    action: "modify-base-mint",
    icon: DollarSign,
  },
  {
    id: 7,
    label: "Create new lookup table",
    action: "create-lookup-table",
    icon: Database,
  },
  {
    id: 8,
    label: "Extend existing lookup table",
    action: "extend-lookup-table",
    icon: Database,
  },
  { id: 9, label: "Run the bot", action: "run-bot", icon: Play },
  {
    id: 10,
    label: "Modify Merge Mints setting",
    action: "modify-merge-mints",
    icon: GitBranch,
  },
  {
    id: 11,
    label: "Modify Flash Loan settings",
    action: "modify-flash-loan",
    icon: Zap,
  },
  {
    id: 12,
    label: "Add Custom Lookup Table",
    action: "add-custom-lookup-table",
    icon: Database,
  },
];

export default function BotController() {
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

  const checkBotStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/bot/check-session", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsRunning(data.exists);
      }
    } catch (error) {
      console.error("Error checking bot status:", error);
    }
  }, []);

  const loadTokens = useCallback(async () => {
    try {
      const response = await fetch("/api/bot/get-tokens", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          setTokens(data.result.split("\n").filter(Boolean));
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });

      if (response.ok) {
        setIsConnected(true);
        loadTokens();
        checkBotStatus();
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  }, [loadTokens, checkBotStatus]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

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
      addConsoleOutput(`Executing: ${action}`);

      const response = await fetch("/api/bot/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, inputs }),
      });

      const data = await response.json();

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
        await loadTokens();
      }

      if (action === "run-bot") {
        setIsRunning(true);
        setTimeout(() => setActiveView("logs"), 2000);
      } else if (action === "stop-bot") {
        setIsRunning(false);
      }

      addConsoleOutput("✅ Action completed");
    } catch (error) {
      addConsoleOutput(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const handleMenuAction = async (action: string) => {
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
        await loadTokens();
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
    await loadTokens(); // Refresh token list after deletion
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
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Solana Arbitrage Bot Controller
        </h1>
        <ConnectionStatus isConnected={isConnected} />
      </div>

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
                    onClick={() => {
                      loadTokens();
                      checkBotStatus();
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
                {menuOptions.slice(0, 8).map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleMenuAction(option.action)}
                      disabled={!isConnected}
                      className="justify-start"
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span className="text-xs">
                        {option.label.split(" ")[0]}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {menuOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.id}
                      variant="outline"
                      onClick={() => handleMenuAction(option.action)}
                      disabled={!isConnected}
                      className="justify-start"
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {option.label}
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
