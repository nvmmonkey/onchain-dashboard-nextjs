'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

interface TokenSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function TokenSearchDialog({ open, onClose, onSubmit }: TokenSearchDialogProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [baseToken, setBaseToken] = useState('1'); // Default to SOL
  const [jitoEnabled, setJitoEnabled] = useState(false);
  const [jitoOption, setJitoOption] = useState('2');
  const [spamEnabled, setSpamEnabled] = useState(true);
  const [spamOption, setSpamOption] = useState('1');

  const handleSubmit = () => {
    onSubmit({
      tokenAddress,
      baseToken: baseToken, // Already '1' or '2'
      jitoEnabled: jitoEnabled ? '1' : '0',
      jitoOption: jitoEnabled ? jitoOption : '',
      spamEnabled: spamEnabled ? '1' : '0',
      spamOption: spamEnabled ? spamOption : '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search and Add Token</DialogTitle>
          <DialogDescription>
            Search for a token and configure its settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="token">Token Address or Symbol</Label>
            <Input
              id="token"
              placeholder="e.g., 9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Base Token Filter</Label>
            <RadioGroup value={baseToken} onValueChange={setBaseToken}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="sol" />
                <Label htmlFor="sol">SOL</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="usdc" />
                <Label htmlFor="usdc">USDC</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="jito">Enable Jito</Label>
              <Switch
                id="jito"
                checked={jitoEnabled}
                onCheckedChange={setJitoEnabled}
              />
            </div>
            
            {jitoEnabled && (
              <RadioGroup value={jitoOption} onValueChange={setJitoOption}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="jito1" />
                  <Label htmlFor="jito1">Random 3000-9000, count 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="jito2" />
                  <Label htmlFor="jito2">Random 5000-13000, count 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="jito3" />
                  <Label htmlFor="jito3">Random 9000-23000, count 1</Label>
                </div>
              </RadioGroup>
            )}
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="spam">Enable Spam</Label>
              <Switch
                id="spam"
                checked={spamEnabled}
                onCheckedChange={setSpamEnabled}
              />
            </div>
            
            {spamEnabled && (
              <RadioGroup value={spamOption} onValueChange={setSpamOption}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="spam1" />
                  <Label htmlFor="spam1">Random 28311-488111</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="spam2" />
                  <Label htmlFor="spam2">Random 218311-588111</Label>
                </div>
              </RadioGroup>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!tokenAddress}>
            Search Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}