"use client";

import { Factory } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Stage1View from "@/components/PPS/Stage1View";
import Stage2View from "@/components/PPS/Stage2View";
import Stage3View from "@/components/PPS/Stage3View";
import Stage4View from "@/components/PPS/Stage4View";

export default function PPSStaffPage() {
  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Factory className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Production Progression System
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track gummy production through all 4 stages
          </p>
        </div>
      </div>

      <Tabs defaultValue="stage1">
        <TabsList className="mb-6">
          <TabsTrigger value="stage1">Stage 1 — Cooking & Molding</TabsTrigger>
          <TabsTrigger value="stage2">Stage 2 — Dehydrator Loading</TabsTrigger>
          <TabsTrigger value="stage3">Stage 3 — Container & Label</TabsTrigger>
          <TabsTrigger value="stage4">Stage 4 — Packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="stage1">
          <Stage1View />
        </TabsContent>
        <TabsContent value="stage2">
          <Stage2View />
        </TabsContent>
        <TabsContent value="stage3">
          <Stage3View />
        </TabsContent>
        <TabsContent value="stage4">
          <Stage4View />
        </TabsContent>
      </Tabs>
    </div>
  );
}
