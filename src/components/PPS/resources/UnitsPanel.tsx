"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useGetDehydratorUnitsQuery,
  useBulkCreateDehydratorUnitsMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import type { IDehydratorUnit } from "@/types/privateLabel/pps";

function getOccupancy(unit: IDehydratorUnit) {
  const shelves = Object.values(unit.shelves ?? {});
  const occupied = shelves.filter((s) => s.occupied).length;
  return {
    occupied,
    total: unit.totalShelves,
    percentage: Math.round((occupied / unit.totalShelves) * 100),
  };
}

function getGridCols(totalShelves: number) {
  if (totalShelves <= 20) return "grid-cols-4";
  if (totalShelves <= 30) return "grid-cols-6";
  return "grid-cols-8";
}

export default function UnitsPanel() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefix, setPrefix] = useState("D");
  const [startNumber, setStartNumber] = useState("");
  const [endNumber, setEndNumber] = useState("");
  const [totalShelves, setTotalShelves] = useState("24");

  const { data, isLoading } = useGetDehydratorUnitsQuery();
  const [bulkCreate, { isLoading: isCreating }] =
    useBulkCreateDehydratorUnitsMutation();

  const units = [...(data?.units ?? [])].sort((a, b) => {
    const numA = parseInt(a.unitId.replace(/\D/g, ""), 10);
    const numB = parseInt(b.unitId.replace(/\D/g, ""), 10);
    return numA - numB;
  });

  const previewCount =
    startNumber && endNumber && Number(endNumber) >= Number(startNumber)
      ? Number(endNumber) - Number(startNumber) + 1
      : null;

  const handleBulkCreate = async () => {
    const start = Number(startNumber);
    const end = Number(endNumber);
    const shelves = Number(totalShelves);
    if (!start || !end || end < start) {
      toast.error("Invalid number range");
      return;
    }
    if (end - start + 1 > 10) {
      toast.error("Maximum 10 dehydrators at a time");
      return;
    }
    if (!shelves || shelves < 1 || shelves > 100) {
      toast.error("Shelves must be between 1 and 100");
      return;
    }
    try {
      const res = await bulkCreate({ startNumber: start, endNumber: end, prefix, totalShelves: shelves }).unwrap();
      toast.success(
        `Created ${res.created} dehydrator${res.created !== 1 ? "s" : ""}${res.skipped > 0 ? ` (${res.skipped} skipped)` : ""}`
      );
      setShowAddModal(false);
      setStartNumber("");
      setEndNumber("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create dehydrators");
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Dehydrators ({units.length})</h3>
          <p className="text-sm text-muted-foreground">Shelf capacity per dehydrator varies</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xs bg-accent text-white">
              <Plus className="w-4 h-4 mr-1" />
              Add Dehydrators
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-xs">
            <DialogHeader>
              <DialogTitle>Add New Dehydrators</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs mb-1 block">Prefix</Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="D"
                  className="rounded-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Start Number</Label>
                  <Input
                    type="number"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    placeholder="1"
                    className="rounded-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">End Number</Label>
                  <Input
                    type="number"
                    value={endNumber}
                    onChange={(e) => setEndNumber(e.target.value)}
                    placeholder="8"
                    className="rounded-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Shelves per Dehydrator</Label>
                <Input
                  type="number"
                  value={totalShelves}
                  onChange={(e) => setTotalShelves(e.target.value)}
                  placeholder="24"
                  className="rounded-xs"
                />
              </div>

              {previewCount !== null && (
                <div className="bg-muted/50 rounded-xs p-3 text-sm">
                  <p>
                    Will create <strong>{previewCount}</strong> dehydrator
                    {previewCount !== 1 ? "s" : ""} with <strong>{totalShelves || "?"}</strong> shelves each:
                  </p>
                  <p className="text-muted-foreground">
                    {prefix}-{startNumber}, …{" "}
                    {prefix}-{endNumber}
                  </p>
                </div>
              )}

              <Button
                className="w-full rounded-xs"
                onClick={handleBulkCreate}
                disabled={isCreating || !previewCount}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Create Dehydrators
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading dehydrators…</span>
        </div>
      )}

      {/* Dehydrator cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {units.map((unit) => {
            const occ = getOccupancy(unit);
            return (
              <Card key={unit._id} className="rounded-xs">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{unit.unitId}</h4>
                    <Badge variant="outline">
                      {occ.occupied}/{occ.total} shelves ({occ.percentage}%)
                    </Badge>
                  </div>

                  {/* Dynamic shelf grid */}
                  <div className={`grid ${getGridCols(unit.totalShelves)} gap-1`}>
                    {Array.from({ length: unit.totalShelves }, (_, i) => {
                      const pos = String(i + 1);
                      const shelf = unit.shelves[pos];
                      const isOccupied = shelf?.occupied;
                      return (
                        <div
                          key={pos}
                          className={`text-center text-xs py-1.5 rounded-xs border ${
                            isOccupied
                              ? "bg-red-500/10 border-red-500/20 text-red-600"
                              : "bg-green-500/10 border-green-500/20 text-green-600"
                          }`}
                          title={
                            isOccupied
                              ? `Shelf ${pos}: ${shelf.trayId} (${shelf.cookItemId})`
                              : `Shelf ${pos}: Empty`
                          }
                        >
                          {pos}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Available
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Occupied
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
