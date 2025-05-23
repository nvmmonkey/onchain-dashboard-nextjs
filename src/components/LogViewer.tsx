"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Trash2, Pause, Play } from "lucide-react";

interface LogViewerProps {
  isRunning: boolean;
}

export default function LogViewer({ isRunning }: LogViewerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRunning && !isStreaming) {
      startLogStream();
    } else if (!isRunning && isStreaming) {
      stopLogStream();
    }
  }, [isRunning]);

  const startLogStream = async () => {
    setIsStreaming(true);

    try {
      // First, check if bot is actually running by checking tmux session
      const checkResponse = await fetch("/api/bot/check-session", {
        method: "POST",
      });

      const checkData = await checkResponse.json();

      if (!checkData.exists) {
        setLogs((prev) => [
          ...prev,
          "[INFO] Bot session not found. Start the bot first.",
        ]);
        setIsStreaming(false);
        return;
      }

      // Start streaming logs from tmux session
      const eventSource = new EventSource("/api/bot/stream-logs");

      eventSource.onmessage = (event) => {
        if (!isPaused) {
          const data = JSON.parse(event.data);
          if (data.log) {
            setLogs((prev) => {
              const newLogs = [...prev, data.log];
              // Keep only last 1000 lines
              if (newLogs.length > 1000) {
                return newLogs.slice(-1000);
              }
              return newLogs;
            });
          }
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setIsStreaming(false);
      };

      // Store eventSource for cleanup
      (window as any).logEventSource = eventSource;
    } catch (error) {
      console.error("Error starting log stream:", error);
      setIsStreaming(false);
    }
  };

  const stopLogStream = () => {
    if ((window as any).logEventSource) {
      (window as any).logEventSource.close();
      delete (window as any).logEventSource;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      stopLogStream();
    };
  }, []);

  useEffect(() => {
    if (!isPaused && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused]);

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
        body: JSON.stringify({ lines: 100 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.logs) {
          setLogs(data.logs.split("\n").filter(Boolean));
        }
      }
    } catch (error) {
      console.error("Error loading historical logs:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Bot Logs{" "}
            {isStreaming && (
              <span className="text-sm font-normal text-green-600">(Live)</span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadHistoricalLogs}>
              Load History
            </Button>
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
          className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">
              No logs yet. Start the bot to see output...
              <br />
              <br />
              Troubleshooting:
              <br />
              - Make sure the bot is running in a tmux session named
              'solana-bot'
              <br />
              - Click "Load History" to see previous logs
              <br />- Check if the bot path is correct in your .env file
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

        {isPaused && (
          <div className="mt-2 text-sm text-yellow-600">
            Log updates are paused. Click Resume to continue receiving logs.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
