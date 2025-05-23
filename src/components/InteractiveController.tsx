// src/components/InteractiveController.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Power, PowerOff, Send, RefreshCw } from "lucide-react";

export default function InteractiveController() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (isSessionActive) {
        // Stop session if component unmounts while active
        fetch("/api/bot/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stop" }),
        });
      }
    };
  }, [isSessionActive]);

  const startSession = async () => {
    console.log("Starting session...");
    setIsLoading(true);
    setOutput(["Connecting to SSH..."]);
    
    try {
      // First ensure SSH connection is established
      const connectResponse = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      
      if (!connectResponse.ok) {
        throw new Error("Failed to establish SSH connection");
      }
      
      setOutput((prev) => [...prev, "SSH connected. Starting bot session..."]);
      
      // Now start the bot session
      const response = await fetch("/api/bot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      
      if (data.success) {
        setIsSessionActive(true);
        setOutput(["Session started. Loading menu..."]);

        // Read initial output after a longer delay to ensure menu loads
        setTimeout(async () => {
          // Read output directly without checking isSessionActive since we just set it
          try {
            const readResponse = await fetch("/api/bot/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "read" }),
            });

            const readData = await readResponse.json();
            console.log("Initial read response:", readData);
            
            if (readData.success && readData.output) {
              const lines = readData.output.split("\n").filter(line => line.trim());
              if (lines.length > 0) {
                setOutput(lines);
              }
            }
          } catch (error) {
            console.error("Error reading initial output:", error);
          }
          
          // Set up periodic reading to keep output updated
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          intervalRef.current = setInterval(() => {
            readOutput();
          }, 2000);
        }, 2500);
      } else {
        throw new Error(data.error || "Failed to start session");
      }
    } catch (error) {
      console.error("Session start error:", error);
      setOutput((prev) => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    setIsLoading(true);
    
    // Clear the interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    try {
      const response = await fetch("/api/bot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      const data = await response.json();
      setIsSessionActive(false);
      setOutput((prev) => [...prev, "Session stopped."]);
    } catch (error) {
      setOutput((prev) => [...prev, `Error: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendCommand = async (cmd?: string) => {
    const commandToSend = cmd || command;
    if (!commandToSend.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/bot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", command: commandToSend }),
      });

      const data = await response.json();
      if (data.success && data.output) {
        const lines = data.output.split("\n").filter(line => line.trim());
        setOutput(lines);
      }

      if (!cmd) {
        setCommand("");
      }
      
      // Read output again after a short delay to get the response
      setTimeout(() => readOutput(), 1000);
    } catch (error) {
      setOutput((prev) => [...prev, `Error: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const readOutput = async () => {
    if (!isSessionActive) {
      console.log("Not reading output - session not active");
      return;
    }

    console.log("Reading output...");
    try {
      const response = await fetch("/api/bot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });

      const data = await response.json();
      console.log("Read output response:", data);
      
      if (data.success && data.output) {
        const lines = data.output.split("\n").filter(line => line.trim());
        console.log("Parsed lines:", lines.length);
        if (lines.length > 0) {
          setOutput(lines);
        }
      }
    } catch (error) {
      console.error("Error reading output:", error);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: "Main Menu", command: "" },
    { label: "Search Token", command: "1" },
    { label: "Modify Config", command: "2" },
    { label: "Spam Settings", command: "3" },
    { label: "Jito Settings", command: "4" },
    { label: "Pool Settings", command: "5" },
    { label: "Base Mint", command: "6" },
    { label: "Exit", command: "13" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Interactive Bot Controller
          </CardTitle>
          <div className="flex gap-2">
            {!isSessionActive ? (
              <>
                <Button onClick={startSession} disabled={isLoading} size="sm">
                  <Power className="h-4 w-4 mr-2" />
                  Start Session
                </Button>
                <Button 
                  onClick={async () => {
                    console.log("Testing SSH connection...");
                    try {
                      const response = await fetch("/api/ssh", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          action: "execute", 
                          command: "echo 'SSH connection test successful'" 
                        }),
                      });
                      const data = await response.json();
                      console.log("SSH test result:", data);
                      setOutput([`SSH Test: ${data.result || data.error || 'No response'}`]);
                    } catch (error) {
                      console.error("SSH test error:", error);
                      setOutput([`SSH Test Error: ${error}`]);
                    }
                  }}
                  variant="outline" 
                  size="sm"
                  title="Test SSH Connection"
                >
                  Test SSH
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={readOutput}
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={stopSession}
                  variant="destructive"
                  size="sm"
                  disabled={isLoading}
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Stop Session
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Output Terminal */}
          <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
            {output.length === 0 ? (
              <div className="text-gray-500">
                {isSessionActive
                  ? "Waiting for output..."
                  : "Start a session to begin"}
              </div>
            ) : (
              <>
                {output.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
                <div ref={outputEndRef} />
              </>
            )}
          </div>

          {/* Quick Actions */}
          {isSessionActive && (
            <>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (action.command) {
                        sendCommand(action.command);
                      } else {
                        // For Main Menu, just refresh
                        readOutput();
                      }
                    }}
                    disabled={isLoading}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Command Input */}
              <div className="flex gap-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendCommand()}
                  placeholder="Enter command..."
                  disabled={!isSessionActive || isLoading}
                />
                <Button
                  onClick={sendCommand}
                  disabled={!isSessionActive || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <div className="text-sm text-gray-500">
            <p>Tips:</p>
            <ul className="list-disc list-inside">
              <li>Start a session to interact with the bot configuration</li>
              <li>Use quick actions or type commands manually</li>
              <li>The session stays open for multiple operations</li>
              <li>Click refresh to update the output</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
