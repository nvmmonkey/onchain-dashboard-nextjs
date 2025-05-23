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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JitoSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function JitoSettingsDialog({ open, onClose, onSubmit }: JitoSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('enable');
  const [enabled, setEnabled] = useState('0');
  const [minProfit, setMinProfit] = useState('17000');
  const [tipOption, setTipOption] = useState('2');

  const handleSubmit = () => {
    const data: Record<string, unknown> = {};
    
    if (activeTab === 'enable') {
      data.choice = '1';
      data.enabled = enabled === '1' ? 'yes' : 'no';
    } else if (activeTab === 'profit') {
      data.choice = '2';
      data.minProfit = minProfit;
    } else if (activeTab === 'tip') {
      data.choice = '3';
      data.tipOption = tipOption;
    }
    
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Modify Jito Settings</DialogTitle>
          <DialogDescription>
            Configure Jito bundle settings for MEV protection
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enable">Enable/Disable</TabsTrigger>
            <TabsTrigger value="profit">Min Profit</TabsTrigger>
            <TabsTrigger value="tip">Tip Config</TabsTrigger>
          </TabsList>
          
          <TabsContent value="enable" className="space-y-4">
            <RadioGroup value={enabled} onValueChange={setEnabled}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="jito-on" />
                <Label htmlFor="jito-on">Enable Jito</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="jito-off" />
                <Label htmlFor="jito-off">Disable Jito</Label>
              </div>
            </RadioGroup>
          </TabsContent>
          
          <TabsContent value="profit" className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="min-profit">Minimum Profit (in lamports)</Label>
              <Input
                id="min-profit"
                type="number"
                value={minProfit}
                onChange={(e) => setMinProfit(e.target.value)}
                placeholder="17000"
              />
              <p className="text-sm text-gray-500">
                Default: 17000 lamports (0.000017 SOL)
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="tip" className="space-y-4">
            <Label>Tip Configuration</Label>
            <RadioGroup value={tipOption} onValueChange={setTipOption}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="tip1" />
                <Label htmlFor="tip1">
                  Random 3,000 - 9,000 (Low range)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="tip2" />
                <Label htmlFor="tip2">
                  Random 5,000 - 13,000 (Recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="tip3" />
                <Label htmlFor="tip3">
                  Random 9,000 - 23,000 (High range)
                </Label>
              </div>
            </RadioGroup>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
