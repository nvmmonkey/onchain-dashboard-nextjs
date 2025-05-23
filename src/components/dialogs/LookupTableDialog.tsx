import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface LookupTableDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  action: "extend" | "add";
  existingTables?: string[];
}

export function LookupTableDialog({
  open,
  onClose,
  onSubmit,
  action,
  existingTables = [],
}: LookupTableDialogProps) {
  const [address, setAddress] = useState("");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const handleSubmit = () => {
    if (action === "extend" && selectedTable !== null) {
      onSubmit({ selection: selectedTable + 1 }); // 1-based index
    } else if (address) {
      onSubmit({ address });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {action === "extend"
              ? "Extend Lookup Table"
              : "Add Custom Lookup Table"}
          </DialogTitle>
          <DialogDescription>
            {action === "extend"
              ? "Select an existing lookup table to extend or enter a new address"
              : "Enter the lookup table address to add to all tokens"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {action === "extend" && existingTables.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Lookup Tables</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {existingTables.map((table, index) => (
                  <div
                    key={index}
                    className={`p-2 border rounded cursor-pointer text-sm font-mono ${
                      selectedTable === index
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedTable(index);
                      setAddress("");
                    }}
                  >
                    {table}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="address">
              {action === "extend"
                ? "Or Enter New Address"
                : "Lookup Table Address"}
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setSelectedTable(null);
              }}
              placeholder="Enter Solana address"
              className="font-mono text-sm"
            />
          </div>

          {action === "extend" && (
            <div className="text-sm text-yellow-600">
              💰 Cost: ~0.00022 SOL (recoverable by closing table)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!address && selectedTable === null}
          >
            {action === "extend" ? "Extend Table" : "Add Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
