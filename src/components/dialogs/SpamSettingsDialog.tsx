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
import { Switch } from '@/components/ui/switch';

interface SpamSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function SpamSettingsDialog({ open, onClose, onSubmit }: SpamSettingsDialogProps) {
  const [enabled, setEnabled] = useState(true);
  const [option, setOption] = useState('1');

  const handleSubmit = () => {
    // The script expects 'yes' or 'no' for enabled
    onSubmit({
      enabled: enabled ? 'yes' : 'no',
      option: enabled ? option : ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify Spam Settings</DialogTitle>
          <DialogDescription>
            Configure spam protection settings for your bot
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="spam-enabled">Enable Spam Protection</Label>
            <Switch
              id="spam-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
          
          {enabled && (
            <div className="space-y-4">
              <Label>Compute Unit Price Strategy</Label>
              <RadioGroup value={option} onValueChange={setOption}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="spam1" />
                  <Label htmlFor="spam1">
                    Random 28,311 - 488,111 (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="spam2" />
                  <Label htmlFor="spam2">
                    Random 218,311 - 588,111 (Higher range)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

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