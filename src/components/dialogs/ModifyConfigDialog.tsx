import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface ModifyConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  tokens: string[];
}

export function ModifyConfigDialog({ open, onClose, onSubmit, tokens }: ModifyConfigDialogProps) {
  const [selectedToken, setSelectedToken] = useState<number | null>(null);

  const handleDelete = () => {
    if (selectedToken !== null) {
      onSubmit({ deleteIndex: selectedToken + 1 }); // Node script uses 1-based index
      onClose();
    }
  };

  // If no tokens loaded yet, show loading state
  if (open && tokens.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modify Token Configuration</DialogTitle>
            <DialogDescription>
              Loading tokens...
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Token Configuration</DialogTitle>
          <DialogDescription>
            Select a token to delete from your configuration
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Label>Current Tokens ({tokens.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tokens.map((token, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedToken === index 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedToken(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm">{token}</div>
                  <div className="text-sm text-gray-500">#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={selectedToken === null}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}