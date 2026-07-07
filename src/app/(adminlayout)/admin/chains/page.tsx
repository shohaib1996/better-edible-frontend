"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetAllChainsQuery, type IChain } from "@/redux/api/Chains/chainsApi";
import { ChainCard } from "@/components/Chains/ChainCard";
import { ChainModal } from "@/components/Chains/ChainModal";

export default function ChainsPage() {
  const { data, isLoading } = useGetAllChainsQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IChain | null>(null);

  const chains = data?.chains ?? [];

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(chain: IChain) {
    setEditTarget(chain);
    setModalOpen(true);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chains</h1>
            <p className="text-sm text-muted-foreground">
              Group stores under a parent — even when each store has a different name.
              {data ? ` Total chains: ${data.total}` : ""}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="rounded-xs gap-2 bg-primary text-primary-foreground">
          <Plus className="w-4 h-4" /> New Chain
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : chains.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No chains yet</p>
          <p className="text-sm mt-1">Create your first chain to group stores together.</p>
          <Button onClick={openCreate} variant="outline" className="rounded-xs mt-4 gap-2">
            <Plus className="w-4 h-4" /> New Chain
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <ChainCard key={chain.id} chain={chain} onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Create / Edit modal — key forces form reset when switching */}
      <ChainModal
        key={editTarget?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editId={editTarget?.id}
        initial={
          editTarget
            ? {
                name: editTarget.name,
                buyingMode: editTarget.buyingMode,
                notes: editTarget.notes ?? "",
                buyerName: editTarget.buyerName ?? "",
                buyerEmail: editTarget.buyerEmail ?? "",
                buyerPhone: editTarget.buyerPhone ?? "",
                billingContact: editTarget.billingContact ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}
