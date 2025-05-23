'use client';

import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal, X, Trash2 } from 'lucide-react';

interface ActionConsoleProps {
  output: string[];
  currentAction: string;
  onClose: () => void;
  onClear: () => void;
}

export default function ActionConsole({ output, currentAction, onClose, onClear }: ActionConsoleProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Action Console - {currentAction}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {output.length === 0 ? (
            <div className="text-gray-500">Waiting for output...</div>
          ) : (
            <>
              {output.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}