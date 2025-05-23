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
import { Input } from '@/components/ui/input';

interface BaseMintDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function BaseMintDialog({ open, onClose, onSubmit }: BaseMintDialogProps) {
  const [option, setOption] = useState('1');
  const [customAddress, setCustomAddress] = useState('');

  const handleSubmit = () => {
    onSubmit({
      option,
      customAddress: option === '3' ? customAddress : ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Base Mint</DialogTitle>
          <DialogDescription>
            Select the base token for arbitrage calculations
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <RadioGroup value={option} onValueChange={setOption}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="sol" />
              <Label htmlFor="sol">
                SOL (So11111111111111111111111111111111111111112)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="usdc" />
              <Label htmlFor="usdc">
                USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="custom" />
              <Label htmlFor="custom">Custom Address</Label>
            </div>
          </RadioGroup>
          
          {option === '3' && (
            <div className="grid gap-2">
              <Label htmlFor="custom-mint">Custom Mint Address</Label>
              <Input
                id="custom-mint"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter token mint address"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={option === '3' && !customAddress}
          >
            Update Base Mint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}