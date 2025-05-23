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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface MergeMintDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  tokenCount: number;
}

export function MergeMintDialog({ open, onClose, onSubmit, tokenCount }: MergeMintDialogProps) {
  const [value, setValue] = useState('false');

  const handleSubmit = () => {
    onSubmit({ value });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Merge Mints Setting</DialogTitle>
          <DialogDescription>
            Configure how the bot handles multiple tokens
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="text-sm text-gray-600">
            Current tokens in config: {tokenCount}
          </div>
          
          <RadioGroup value={value} onValueChange={setValue}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="merge-true" />
              <Label htmlFor="merge-true">
                <div>Enable Merge Mints (Recommended for multiple tokens)</div>
                <div className="text-sm text-gray-500">
                  Trade multiple tokens simultaneously for better opportunities
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="merge-false" />
              <Label htmlFor="merge-false">
                <div>Disable Merge Mints</div>
                <div className="text-sm text-gray-500">
                  Trade tokens individually
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          {tokenCount > 1 && value === 'false' && (
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              💡 Note: You have {tokenCount} tokens. Consider enabling merge mints for better performance.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Setting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
