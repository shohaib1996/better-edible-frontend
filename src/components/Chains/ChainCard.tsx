"use client";

import { useState } from "react";
import { Pencil, Trash2, Store, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { useDeleteChainMutation, type IChain } from "@/redux/api/Chains/chainsApi";
import { MODE_LABEL, MODE_SHORT, MODE_COLOR } from "@/constants/chainConstants";
import { ChainStoresModal } from "./ChainStoresModal";
import { ChainLoginModal } from "./ChainLoginModal";

interface Props {
  chain: IChain;
  onEdit: (chain: IChain) => void;
}

export function ChainCard({ chain, onEdit }: Props) {
  const [storesOpen, setStoresOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [deleteChain] = useDeleteChainMutation();

  return (
    <>
      <Card className="px-5 py-4 rounded-xs shadow-sm hover:shadow-md transition-all gap-0">
        <div className="flex items-start justify-between gap-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-foreground">{chain.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODE_COLOR[chain.buyingMode]}`}>
                {MODE_SHORT[chain.buyingMode]}
              </span>
              {chain.hasLogin && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 flex items-center gap-1">
                  <Key className="w-3 h-3" /> VIP login set
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {MODE_LABEL[chain.buyingMode].split("—")[1]?.trim()}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
              <Store className="w-3.5 h-3.5 shrink-0" />
              {chain.memberCount} {chain.memberCount === 1 ? "store" : "stores"}
              {chain.buyerName ? ` · Buyer: ${chain.buyerName}` : ""}
            </p>
            {chain.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">{chain.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" className="rounded-xs gap-1.5 text-xs" onClick={() => setStoresOpen(true)}>
              <Store className="w-3.5 h-3.5" /> Stores
            </Button>
            <Button variant="secondary" size="sm" className="rounded-xs gap-1.5 text-xs" onClick={() => setLoginOpen(true)}>
              <Key className="w-3.5 h-3.5" /> Login
            </Button>
            <Button variant="outline" size="sm" className="rounded-xs" onClick={() => onEdit(chain)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="outline" size="sm" className="rounded-xs text-destructive border-destructive/30 hover:bg-destructive hover:text-white">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              }
              onConfirm={() => deleteChain(chain.id)}
              title={`Delete ${chain.name}?`}
              description="This action cannot be undone."
              confirmText="Yes, delete"
            />
          </div>
        </div>
      </Card>

      <ChainStoresModal chain={chain} open={storesOpen} onClose={() => setStoresOpen(false)} />

      <ChainLoginModal
        key={loginOpen ? "open" : "closed"}
        chain={chain}
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}
