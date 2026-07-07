"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateChainCredentialsMutation, type IChain } from "@/redux/api/Chains/chainsApi";
import { INPUT_CLS, LABEL_CLS } from "@/constants/chainConstants";

interface Props {
  chain: IChain;
  open: boolean;
  onClose: () => void;
}

export function ChainLoginModal({ chain, open, onClose }: Props) {
  const [email, setEmail] = useState(chain.loginEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [updateCredentials, { isLoading: saving }] = useUpdateChainCredentialsMutation();

  if (!open) return null;

  const hasExisting = chain.hasLogin;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Login email is required"); return; }
    if (!hasExisting && !password) { setError("Password is required for a new login"); return; }
    setError("");
    const result = await updateCredentials({
      id: chain.id,
      loginEmail: email.trim(),
      ...(password ? { password } : {}),
    });
    if (!("error" in result)) onClose();
    else setError("Failed to save credentials. Please try again.");
  }

  async function handleRemove() {
    const result = await updateCredentials({ id: chain.id, clear: true });
    if (!("error" in result)) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card rounded-xs shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">VIP Login — {chain.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Set the parent account credentials the chain buyer uses to sign in to the chain portal.
              {hasExisting ? " Leave password blank to keep the existing one." : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-4 mt-0.5 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
          <div>
            <label className={LABEL_CLS}>Login email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          <div>
            <label className={LABEL_CLS}>
              {hasExisting ? "Password (leave blank to keep current)" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLS}
              placeholder={hasExisting ? "••••••••" : ""}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            <div>
              {hasExisting && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={saving}
                  className="text-sm font-medium text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                >
                  Remove login
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-xs">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xs bg-primary text-primary-foreground">
                {saving ? "Saving…" : "Save Login"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
