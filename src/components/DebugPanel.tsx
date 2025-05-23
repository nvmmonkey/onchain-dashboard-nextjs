"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, Terminal, CheckCircle, XCircle } from "lucide-react";

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const runDebugChecks = async () => {
    setIsDebugging(true);
    setDebugInfo([]);

    const addInfo = (info: string) => {
      setDebugInfo((prev) => [...prev, info]);
    };

    try {
      // Check 1: SSH Connection
      addInfo("🔍 Checking SSH connection...");
      const sshResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: 'echo "SSH Connected"',
        }),
      });

      if (sshResponse.ok) {
        addInfo("✅ SSH connection successful");
      } else {
        addInfo("❌ SSH connection failed");
        return;
      }

      // Check 2: Bot directory exists
      addInfo("🔍 Checking bot directory...");
      const botPath = process.env.NEXT_PUBLIC_BOT_FOLDER_PATH;
      const dirResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `[ -d "${botPath}" ] && echo "Directory exists" || echo "Directory not found"`,
        }),
      });

      const dirData = await dirResponse.json();
      if (dirData.result?.includes("exists")) {
        addInfo(`✅ Bot directory exists: ${botPath}`);
      } else {
        addInfo(`❌ Bot directory not found: ${botPath}`);
      }

      // Check 3: Bot executable exists
      addInfo("🔍 Checking bot executable...");
      const execResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `[ -f "${botPath}/smb-onchain" ] && echo "Executable exists" || echo "Executable not found"`,
        }),
      });

      const execData = await execResponse.json();
      if (execData.result?.includes("exists")) {
        addInfo("✅ Bot executable found");
      } else {
        addInfo("❌ Bot executable not found");
      }

      // Check 4: Config file exists
      addInfo("🔍 Checking config file...");
      const configResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `[ -f "${botPath}/config.low.toml" ] && echo "Config exists" || echo "Config not found"`,
        }),
      });

      const configData = await configResponse.json();
      if (configData.result?.includes("exists")) {
        addInfo("✅ Config file found");
      } else {
        addInfo("❌ Config file not found");
      }

      // Check 5: Tmux is installed
      addInfo("🔍 Checking tmux installation...");
      const tmuxResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command:
            'which tmux && echo "Tmux installed" || echo "Tmux not found"',
        }),
      });

      const tmuxData = await tmuxResponse.json();
      if (tmuxData.result?.includes("installed")) {
        addInfo("✅ Tmux is installed");
      } else {
        addInfo("❌ Tmux not installed - install with: sudo apt install tmux");
      }

      // Check 6: Check for running tmux sessions
      addInfo("🔍 Checking tmux sessions...");
      const sessionResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: 'tmux list-sessions 2>/dev/null || echo "No sessions"',
        }),
      });

      const sessionData = await sessionResponse.json();
      if (sessionData.result) {
        addInfo(`📋 Tmux sessions:\n${sessionData.result}`);
      }

      // Check 7: Try to find log files
      addInfo("🔍 Looking for log files...");
      const logResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `find ${botPath} -name "*.log" -type f 2>/dev/null | head -10`,
        }),
      });

      const logData = await logResponse.json();
      if (logData.result && logData.result.trim()) {
        addInfo(`📄 Found log files:\n${logData.result}`);
      } else {
        addInfo("❌ No log files found");
      }

      // Check 8: Test bot execution
      addInfo("🔍 Testing bot execution (dry run)...");
      const testResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `cd ${botPath} && ./smb-onchain --help 2>&1 | head -5`,
        }),
      });

      const testData = await testResponse.json();
      if (testData.result) {
        addInfo(`📋 Bot help output:\n${testData.result}`);
      }
    } catch (error) {
      addInfo(
        `❌ Debug error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDebugging(false);
      addInfo("\n✅ Debug checks complete!");
    }
  };

  const testBotCommand = async () => {
    const botPath = process.env.NEXT_PUBLIC_BOT_FOLDER_PATH;
    const command = prompt("Enter command to test (e.g., pwd, ls -la):");

    if (!command) return;

    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `cd ${botPath} && ${command}`,
        }),
      });

      const data = await response.json();
      setDebugInfo((prev) => [
        ...prev,
        `\n🖥️ Command: ${command}\n${data.result || data.error || "No output"}`,
      ]);
    } catch (error) {
      setDebugInfo((prev) => [
        ...prev,
        `\n❌ Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDebugChecks} disabled={isDebugging}>
              {isDebugging ? "Running checks..." : "Run Debug Checks"}
            </Button>
            <Button variant="outline" onClick={testBotCommand}>
              <Terminal className="h-4 w-4 mr-2" />
              Test Command
            </Button>
          </div>

          {debugInfo.length > 0 && (
            <div className="bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-200 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-gray-700 dark:border-gray-600">
              {debugInfo.map((info, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {info}
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="font-semibold">Common Issues:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Bot not running in tmux session named 'solana-bot'</li>
              <li>Bot executable permissions (fix: chmod +x smb-onchain)</li>
              <li>Wrong bot directory path in .env file</li>
              <li>Bot outputs to stderr instead of stdout</li>
              <li>Bot has no console output (runs silently)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
