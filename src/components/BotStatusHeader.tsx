"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Square,
  RefreshCw,
  Settings,
  FileText,
  Terminal,
  Activity,
  ChevronDown,
  Wifi,
  WifiOff,
  Bot,
  Moon,
  Sun,
} from 'lucide-react';
import { useBotStatus } from '@/contexts/BotStatusContext';
import { useTheme } from '@/contexts/ThemeContext';

// Simple custom dropdown component
function SimpleDropdown({ 
  trigger, 
  children, 
  isOpen, 
  onToggle 
}: { 
  trigger: React.ReactNode; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={onToggle}>
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
}) {
  return (
    <button
      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150 ease-in-out flex items-center"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DropdownSeparator() {
  return <div className="border-t border-gray-100 dark:border-gray-700 my-1" />;
}

export default function BotStatusHeader() {
  const {
    isConnected,
    isRunning,
    tokenCount,
    tokens,
    isLoading,
    lastUpdated,
    refreshStatus,
    startBot,
    stopBot,
  } = useBotStatus();
  
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleStartBot = async () => {
    console.log('Header: Starting bot via context...');
    await startBot();
  };

  const handleStopBot = async () => {
    console.log('Header: Stopping bot via context...');
    await stopBot();
  };

  const handleRefresh = async () => {
    console.log('Header: Refreshing status via context...');
    await refreshStatus();
  };

  const navigateTo = (path: string) => {
    // For now, we'll use the tab switching logic since all views are in one component
    // In the future, these could be separate routes
    let view: "controller" | "config" | "logs" | "tmux" | "interactive" | "tokens" = "controller";
    
    switch (path) {
      case '/':
        view = "controller";
        break;
      case '/interactive':
        view = "interactive";
        break;
      case '/config':
        view = "config";
        break;
      case '/logs':
        view = "logs";
        break;
      case '/tmux':
        view = "tmux";
        break;
      case '/tokens':
        view = "tokens";
        break;
    }
    
    // For now, we'll need to communicate with the BotController component
    // This is a temporary solution - in a real app, you'd use proper routing
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
    setIsDropdownOpen(false);
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-600 bg-red-50 border-red-200';
    if (isRunning) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (isRunning) return 'Running';
    return 'Stopped';
  };

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Solana Bot Controller
              </span>
            </div>

            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  !isConnected ? 'bg-red-500' : 
                  isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`} />
                Status: {getStatusText()}
              </div>
            </div>
          </div>

          {/* Right Side Info */}
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>{tokens.filter(t => t !== 'So11111111111111111111111111111111111111112').length} tokens</span>
              </div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {lastUpdated && (
                <div className="text-xs text-gray-400">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Primary Actions */}
            {!isRunning ? (
              <Button
                size="sm"
                onClick={handleStartBot}
                disabled={!isConnected || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Bot
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStopBot}
                disabled={isLoading}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Bot
              </Button>
            )}

            {/* Quick Navigation */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo('/logs')}
              disabled={!isRunning}
            >
              <Terminal className="h-4 w-4 mr-2" />
              View Logs
            </Button>

            {/* Settings Dropdown */}
            <SimpleDropdown
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              trigger={
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              }
            >
              <DropdownItem onClick={() => navigateTo('/')}>
                <Bot className="h-4 w-4 mr-2" />
                Bot Controller
              </DropdownItem>
              <DropdownItem onClick={() => navigateTo('/tokens')}>
                <Activity className="h-4 w-4 mr-2" />
                Token Status
              </DropdownItem>
              <DropdownItem onClick={() => navigateTo('/interactive')}>
                <Terminal className="h-4 w-4 mr-2" />
                Interactive Mode
              </DropdownItem>
              <DropdownItem onClick={() => navigateTo('/config')}>
                <FileText className="h-4 w-4 mr-2" />
                Config Editor
              </DropdownItem>
              <DropdownItem onClick={() => navigateTo('/logs')}>
                <Activity className="h-4 w-4 mr-2" />
                View Logs
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={() => navigateTo('/tmux')}>
                <Terminal className="h-4 w-4 mr-2" />
                Tmux Sessions
              </DropdownItem>
            </SimpleDropdown>
          </div>

          {/* Mobile Stats */}
          <div className="sm:hidden flex items-center gap-2 text-xs text-gray-500">
            <span>{tokens.filter(t => t !== 'So11111111111111111111111111111111111111112').length} tokens</span>
            <span>•</span>
            <span>{isConnected ? '🟢' : '🔴'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
