"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, RefreshCw, FileText } from "lucide-react";
import * as TOML from "toml";

export default function ConfigEditor() {
  const [config, setConfig] = useState("");
  const [originalConfig, setOriginalConfig] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bot/get-config", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.result);
        setOriginalConfig(data.result);
      } else {
        setError("Failed to load configuration");
      }
    } catch {
      setError("Error loading configuration");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    setError("");

    try {
      // Validate TOML syntax
      TOML.parse(config);

      const response = await fetch("/api/bot/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: config }),
      });

      if (response.ok) {
        setOriginalConfig(config);
        alert("Configuration saved successfully!");
      } else {
        setError("Failed to save configuration");
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(`Invalid TOML syntax: ${error.message}`);
      } else {
        setError("Error saving configuration");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = config !== originalConfig;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration Editor
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadConfig}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Reload
            </Button>
            <Button
              size="sm"
              onClick={saveConfig}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="relative">
          <Textarea
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            className="font-mono text-sm"
            rows={30}
            placeholder="Loading configuration..."
          />
          {hasChanges && (
            <div className="absolute top-2 right-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded text-xs">
              Unsaved changes
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Tips:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Use Ctrl+S to save (when focused on editor)</li>
            <li>The configuration uses TOML format</li>
            <li>Changes are validated before saving</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
