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
import { AlertTriangle } from 'lucide-react';

interface FlashLoanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function FlashLoanDialog({ open, onClose, onSubmit }: FlashLoanDialogProps) {
  const [enabled, setEnabled] = useState('0');

  const handleSubmit = () => {
    onSubmit({ enabled });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Flash Loan Settings</DialogTitle>
          <DialogDescription>
            Configure Kamino flash loan for leveraged arbitrage
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
            <p className="font-semibold mb-1">Flash Loan Info:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Allows borrowing without collateral for arbitrage</li>
              <li>Increases potential profits but adds complexity/risk</li>
              <li>Enable for larger arbitrage opportunities</li>
            </ul>
          </div>
          
          <RadioGroup value={enabled} onValueChange={setEnabled}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="flash-on" />
              <Label htmlFor="flash-on">Enable Flash Loans</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id="flash-off" />
              <Label htmlFor="flash-off">Disable Flash Loans (Recommended for beginners)</Label>
            </div>
          </RadioGroup>
          
          {enabled === '1' && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Warning:</p>
                <p>Flash loans enabled - monitor trades carefully! Start with small amounts to test.</p>
              </div>
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