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
import { Input } from '@/components/ui/input';

interface PoolSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  currentSettings?: any;
}

export function PoolSettingsDialog({ open, onClose, onSubmit, currentSettings }: PoolSettingsDialogProps) {
  const [maxPools, setMaxPools] = useState('2');
  const [pumpPools, setPumpPools] = useState('1');
  const [meteoraPools, setMeteoraPools] = useState('1');
  const [raydiumPools, setRaydiumPools] = useState('1');
  const [orcaPools, setOrcaPools] = useState('1');

  const handleSubmit = () => {
    // This would need to be implemented to match your Node.js script's input format
    onSubmit({
      maxPools,
      pools: {
        pump: pumpPools,
        meteora: meteoraPools,
        raydium: raydiumPools,
        orca: orcaPools,
      }
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modify DEX Pool Quantities</DialogTitle>
          <DialogDescription>
            Configure the number of pools per DEX
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="max-pools">Total Max Pools per Token</Label>
            <Input
              id="max-pools"
              type="number"
              value={maxPools}
              onChange={(e) => setMaxPools(e.target.value)}
              min="1"
              max="10"
            />
          </div>
          
          <div className="space-y-3">
            <Label>Pools per DEX</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pump" className="text-sm">PumpSwap</Label>
                <Input
                  id="pump"
                  type="number"
                  value={pumpPools}
                  onChange={(e) => setPumpPools(e.target.value)}
                  min="0"
                  max="5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="meteora" className="text-sm">Meteora</Label>
                <Input
                  id="meteora"
                  type="number"
                  value={meteoraPools}
                  onChange={(e) => setMeteoraPools(e.target.value)}
                  min="0"
                  max="5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="raydium" className="text-sm">Raydium</Label>
                <Input
                  id="raydium"
                  type="number"
                  value={raydiumPools}
                  onChange={(e) => setRaydiumPools(e.target.value)}
                  min="0"
                  max="5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="orca" className="text-sm">Orca</Label>
                <Input
                  id="orca"
                  type="number"
                  value={orcaPools}
                  onChange={(e) => setOrcaPools(e.target.value)}
                  min="0"
                  max="5"
                />
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Note: Use the Config Editor for more advanced pool configuration
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}