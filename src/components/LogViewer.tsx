"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Trash2, Pause, Play, RefreshCw } from "lucide-react";
import { useBotStatus } from '@/contexts/BotStatusContext';

interface LogViewerProps {
  isRunning: boolean;
}

export default function LogViewer({ isRunning: propIsRunning }: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use context to get real-time status
  const { isRunning: contextIsRunning } = useBotStatus();
  const isRunning = propIsRunning || contextIsRunning;

  // Scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused, autoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback(() => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  }, []);

  const startLogStream = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("Log stream already active");
      return;
    }

    console.log("Starting log stream...");
    setIsStreaming(true);

    try {
      const eventSource = new EventSource("/api/bot/stream-logs");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Log stream connected");
        // Clear any retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        if (!isPaused) {
          try {
            const data = JSON.parse(event.data);
            if (data.log) {
              setLogs((prev) => {
                const newLogs = [...prev, data.log];
                // Keep only last 2000 lines for performance
                if (newLogs.length > 2000) {
                  return newLogs.slice(-2000);
                }
                return newLogs;
              });
            }
          } catch (error) {
            console.error("Error parsing log data:", error);
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        eventSourceRef.current = null;
        setIsStreaming(false);

        // Retry connection if bot is still running
        if (isRunning && !retryTimeoutRef.current) {
          console.log("Retrying log stream in 2 seconds...");
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            if (isRunning) {
              startLogStream();
            }
          }, 2000);
        }
      };
    } catch (error) {
      console.error("Error starting log stream:", error);
      setIsStreaming(false);
    }
  }, [isPaused, isRunning]);

  const stopLogStream = useCallback(() => {
    console.log("Stopping log stream...");
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setIsStreaming(false);
  }, []);

  // Start/stop streaming based on running state
  useEffect(() => {
    console.log("LogViewer: isRunning changed to", isRunning);
    
    if (isRunning) {
      // Add a small delay to ensure bot has started
      const timeout = setTimeout(() => {
        startLogStream();
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      stopLogStream();
    }
  }, [isRunning, startLogStream, stopLogStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLogStream();
    };
  }, [stopLogStream]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bot-logs-${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadHistoricalLogs = async () => {
    try {
      const response = await fetch("/api/bot/get-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: 500 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          const historicalLogs = data.logs.split("\n").filter(Boolean);
          setLogs(historicalLogs);
          
          // If bot is running, restart stream to continue from here
          if (isRunning && !isStreaming) {
            setTimeout(() => {
              startLogStream();
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error("Error loading historical logs:", error);
    }
  };

  const reconnectStream = () => {
    stopLogStream();
    setTimeout(() => {
      startLogStream();
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Bot Logs{" "}
            {isStreaming && (
              <span className="text-sm font-normal text-green-600 animate-pulse">
                ● Live
              </span>
            )}
            {isRunning && !isStreaming && (
              <span className="text-sm font-normal text-yellow-600">
                ● Connecting...
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadHistoricalLogs}>
              Load History
            </Button>
            {isRunning && (
              <Button variant="outline" size="sm" onClick={reconnectStream}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reconnect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={downloadLogs}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={logsContainerRef}
          onScroll={handleScroll}
          className="bg-black dark:bg-gray-950 text-green-400 dark:text-green-300 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm border border-gray-700 dark:border-gray-600"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              {isRunning ? (
                <>
                  Waiting for logs...
                  <br />
                  <br />
                  If logs don't appear:
                  <br />
                  - Click "Load History" to see previous logs
                  <br />
                  - Click "Reconnect" to refresh the connection
                  <br />
                  - Make sure the bot is running in tmux session 'solana-bot'
                </>
              ) : (
                <>
                  No logs yet. Start the bot to see output...
                  <br />
                  <br />
                  Tips:
                  <br />
                  - The bot runs in a tmux session named 'solana-bot'
                  <br />
                  - Logs will appear here automatically when the bot starts
                  <br />
                  - Click "Load History" to see logs from previous runs
                </>
              )}
            </div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center text-sm">
          <div>
            {isPaused && (
              <span className="text-yellow-600">
                ⏸ Log updates paused
              </span>
            )}
            {!autoScroll && !isPaused && (
              <span className="text-blue-600">
                📜 Auto-scroll disabled (scroll to bottom to re-enable)
              </span>
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {logs.length} lines
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
