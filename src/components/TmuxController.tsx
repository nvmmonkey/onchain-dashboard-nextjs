"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal, Plus, X, RefreshCw, Monitor } from "lucide-react";

interface TmuxSession {
  name: string;
  windows: number;
  created: string;
  attached: boolean;
}

export default function TmuxController() {
  const [sessions, setSessions] = useState<TmuxSession[]>([]);
  const [newSessionName, setNewSessionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command:
            'tmux list-sessions -F "#{session_name}:#{session_windows}:#{session_created}:#{session_attached}"',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.result) {
          const sessionList = data.result
            .split("\n")
            .filter(Boolean)
            .map((line: string) => {
              const [name, windows, created, attached] = line.split(":");
              return {
                name,
                windows: parseInt(windows),
                created: new Date(parseInt(created) * 1000).toLocaleString(),
                attached: attached === "1",
              };
            });
          setSessions(sessionList);
        }
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `tmux new-session -d -s ${newSessionName}`,
        }),
      });

      if (response.ok) {
        setNewSessionName("");
        loadSessions();
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const killSession = async (sessionName: string) => {
    try {
      const response = await fetch("/api/ssh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          command: `tmux kill-session -t ${sessionName}`,
        }),
      });

      if (response.ok) {
        loadSessions();
      }
    } catch (error) {
      console.error("Error killing session:", error);
    }
  };

  const attachSession = async (sessionName: string) => {
    // This would typically open a terminal emulator in the browser
    // For now, we'll just show an alert
    alert(
      `To attach to session "${sessionName}", use SSH and run: tmux attach -t ${sessionName}`
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Tmux Sessions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Session name"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && createSession()}
          />
          <Button onClick={createSession} disabled={!newSessionName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>

        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tmux sessions found
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium">{session.name}</div>
                  <div className="text-sm text-gray-500">
                    {session.windows} windows • Created: {session.created}
                    {session.attached && " • Attached"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => attachSession(session.name)}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => killSession(session.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
