"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MoldsPanel from "./resources/MoldsPanel";
import TraysPanel from "./resources/TraysPanel";
import UnitsPanel from "./resources/UnitsPanel";

export default function ResourcesView() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Resource Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage molds, dehydrator trays, and dehydrator units
        </p>
      </div>

      <Tabs defaultValue="molds">
        <TabsList>
          <TabsTrigger value="molds">Molds</TabsTrigger>
          <TabsTrigger value="trays">Trays</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>
        <TabsContent value="molds">
          <MoldsPanel />
        </TabsContent>
        <TabsContent value="trays">
          <TraysPanel />
        </TabsContent>
        <TabsContent value="units">
          <UnitsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
