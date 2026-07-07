"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Check, X, ChevronDown, ChevronUp, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://ai.better-edibles.com/store2-api";

function getAuthHeaders(): Record<string, string> {
  try {
    const user = JSON.parse(localStorage.getItem("better-user") || "{}");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;
    return headers;
  } catch {
    return { "Content-Type": "application/json" };
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function promoStatus(p: any): "active" | "ended" | "closed" | "upcoming" {
  const now = new Date();
  if (new Date(p.endDate) < now) return "ended";
  if (new Date(p.startDate) > now) return "upcoming";
  if (!p.isOpen) return "closed";
  return "active";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: "#fff8e6", color: "#b5860e", label: "Pending" },
    approved: { bg: "#f0f7f2", color: "#2a7a4e", label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#b91c1c", label: "Rejected" },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── CREATE PROMO MODAL ────────────────────────────────────────────────────

function CreatePromoModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", discountPercent: "", startDate: "", endDate: "", allProducts: true, isOpen: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.title || !form.discountPercent || !form.startDate || !form.endDate) {
      setError("Please fill in all required fields"); return;
    }
    setSubmitting(true); setError("");
    try {
      const r = await fetch(`${API_BASE}/admin/store-promotions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, discountPercent: parseFloat(form.discountPercent) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Failed to create promotion");
      setForm({ title: "", description: "", discountPercent: "", startDate: "", endDate: "", allProducts: true, isOpen: true });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background rounded-xs shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base">New Promotion</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {error && <div className="text-xs text-red-600 px-3 py-2 rounded-xs bg-red-50">{error}</div>}
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Title *</label>
            <input className="w-full px-3 py-2 rounded-xs border text-sm bg-background" placeholder="e.g. 4th of July Sale" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Description</label>
            <textarea className="w-full px-3 py-2 rounded-xs border text-sm bg-background resize-none" rows={2} placeholder="What's the deal?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Discount % *</label>
              <input type="number" min="1" max="100" className="w-full px-3 py-2 rounded-xs border text-sm bg-background" placeholder="20" value={form.discountPercent} onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))} />
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">Start Date *</label>
              <input type="date" className="w-full px-3 py-2 rounded-xs border text-sm bg-background" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">End Date *</label>
              <input type="date" className="w-full px-3 py-2 rounded-xs border text-sm bg-background" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))} />
              Open for enrollment
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.allProducts} onChange={(e) => setForm((f) => ({ ...f, allProducts: e.target.checked }))} />
              All products
            </label>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-border">
          <Button onClick={handleSubmit} disabled={submitting} size="sm" className="rounded-xs">
            {submitting ? "Creating…" : "Create Promotion"}
          </Button>
          <Button variant="outline" onClick={onClose} size="sm" className="rounded-xs">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── PROMOTIONS TAB ────────────────────────────────────────────────────────

function PromotionsTab({ promos, loading, onRefresh }: { promos: any[]; loading: boolean; onRefresh: () => void }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion?")) return;
    setDeletingId(id);
    await fetch(`${API_BASE}/admin/store-promotions/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    onRefresh();
    setDeletingId(null);
  }

  async function handleToggle(id: string, current: boolean) {
    setToggleId(id);
    await fetch(`${API_BASE}/admin/store-promotions/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isOpen: !current }),
    });
    onRefresh();
    setToggleId(null);
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading promotions…</div>;
  if (promos.length === 0) return <Card className="p-8 text-center text-muted-foreground text-sm rounded-xs">No promotions yet. Create one above.</Card>;

  return (
    <div className="space-y-3">
      {promos.map((p) => {
        const status = promoStatus(p);
        const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
          active:   { bg: "#f0f7f2", color: "#2a7a4e", label: "Active" },
          ended:    { bg: "#fff3ed", color: "#c45a1a", label: "Ended" },
          closed:   { bg: "#f5f5f5", color: "#888",    label: "Closed" },
          upcoming: { bg: "#eff6ff", color: "#2563eb", label: "Upcoming" },
        };
        const ss = statusStyles[status];
        return (
          <Card key={p._id} className="p-5 rounded-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-base">{p.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground">{p.discountPercent}% off</span>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mb-2">{p.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</span>
                  {(p.enrollmentCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.enrollmentCount} enrolled</span>
                  )}
                  {p.allProducts && <span>All products</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => handleToggle(p._id, p.isOpen)} disabled={toggleId === p._id} className="text-xs rounded-xs">
                  {p.isOpen ? "Close" : "Open"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(p._id)} disabled={deletingId === p._id} className="text-xs rounded-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                  {deletingId === p._id ? "…" : "Delete"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── CLAIMS TAB ────────────────────────────────────────────────────────────

function ClaimsTab() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchClaims = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/store-promotions/claims`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setClaims(d.claims || []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      const r = await fetch(`${API_BASE}/admin/store-promotions/claims/${id}/approve`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ note: noteMap[id] || "" }),
      });
      if (r.ok) fetchClaims();
    } finally { setActionId(null); }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      const r = await fetch(`${API_BASE}/admin/store-promotions/claims/${id}/reject`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ note: noteMap[id] || "" }),
      });
      if (r.ok) fetchClaims();
    } finally { setActionId(null); }
  }

  const pending = claims.filter((c) => c.status === "pending");
  const reviewed = claims.filter((c) => c.status !== "pending");

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading claims…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pending Claims ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm rounded-xs">No pending claims.</Card>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <Card key={c._id} className="p-4 rounded-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{c.store?.storeName || "Unknown Store"}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Promo: <strong>{c.promotion?.title || "Unknown"}</strong> · {c.promotion?.discountPercent}% credit
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total sales: <strong>${c.totalSalesValue?.toFixed(2)}</strong> · Est. credit: <strong style={{ color: "#2a7a4e" }}>${c.creditEarned?.toFixed(2)}</strong>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === c._id ? null : c._id)} className="text-muted-foreground shrink-0">
                    {expandedId === c._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {expandedId === c._id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {c.items?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Submitted sales:</div>
                        <div className="rounded-xs border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead><tr className="bg-muted/40">
                              <th className="text-left px-3 py-2 font-medium">Product</th>
                              <th className="text-right px-3 py-2 font-medium">Units</th>
                              <th className="text-right px-3 py-2 font-medium">Unit Price</th>
                              <th className="text-right px-3 py-2 font-medium">Total</th>
                            </tr></thead>
                            <tbody>
                              {c.items.map((item: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                  <td className="px-3 py-2">{item.productName}</td>
                                  <td className="px-3 py-2 text-right">{item.unitsSold}</td>
                                  <td className="px-3 py-2 text-right">${item.unitPrice?.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right">${item.lineTotal?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Note (optional)</label>
                    <textarea className="w-full px-3 py-2 rounded-xs border text-sm bg-background resize-none mb-3" rows={2} placeholder="Internal note…" value={noteMap[c._id] || ""} onChange={(e) => setNoteMap((m) => ({ ...m, [c._id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(c._id)} disabled={actionId === c._id} className="flex items-center gap-1 rounded-xs">
                        <Check className="w-3 h-3" /> Approve & Issue Credit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(c._id)} disabled={actionId === c._id} className="flex items-center gap-1 rounded-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {reviewed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Reviewed ({reviewed.length})</h3>
          <div className="space-y-2">
            {reviewed.map((c) => (
              <Card key={c._id} className="p-3 rounded-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{c.store?.storeName || "Unknown Store"}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ${c.totalSalesValue?.toFixed(2)} in sales · ${c.creditEarned?.toFixed(2)} credit
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{fmtDate(c.createdAt)}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── REQUESTS (PROPOSALS) TAB ──────────────────────────────────────────────

function RequestsTab() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProposals = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/admin/store-promotions/proposals`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals || []))
      .catch(() => setProposals([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      const r = await fetch(`${API_BASE}/admin/store-promotions/proposals/${id}/approve`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ adminNote: noteMap[id] || "" }),
      });
      if (r.ok) fetchProposals();
    } finally { setActionId(null); }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      const r = await fetch(`${API_BASE}/admin/store-promotions/proposals/${id}/reject`, {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ adminNote: noteMap[id] || "" }),
      });
      if (r.ok) fetchProposals();
    } finally { setActionId(null); }
  }

  const pending = proposals.filter((p) => p.status === "pending");
  const reviewed = proposals.filter((p) => p.status !== "pending");

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading requests…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pending Requests ({pending.length})</h3>
        {pending.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm rounded-xs">No pending requests.</Card>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <Card key={p._id} className="p-4 rounded-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{p.title}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      From: <strong>{p.storeName || p.store?.storeName || "Unknown Store"}</strong>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.proposedDiscount}% off · {fmtDate(p.proposedStartDate)} → {fmtDate(p.proposedEndDate)}
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                    {p.notes && <p className="text-xs mt-1 italic" style={{ color: "#6b6045" }}>"{p.notes}"</p>}
                  </div>
                  <button onClick={() => setExpandedId(expandedId === p._id ? null : p._id)} className="text-muted-foreground shrink-0">
                    {expandedId === p._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                {expandedId === p._id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">Note to store (optional)</label>
                    <textarea className="w-full px-3 py-2 rounded-xs border text-sm bg-background resize-none mb-3" rows={2} placeholder="Add a note for the store…" value={noteMap[p._id] || ""} onChange={(e) => setNoteMap((m) => ({ ...m, [p._id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(p._id)} disabled={actionId === p._id} className="flex items-center gap-1 rounded-xs">
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(p._id)} disabled={actionId === p._id} className="flex items-center gap-1 rounded-xs text-red-600 hover:text-red-700 hover:bg-red-50">
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {reviewed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Reviewed ({reviewed.length})</h3>
          <div className="space-y-2">
            {reviewed.map((p) => (
              <Card key={p._id} className="p-3 rounded-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{p.title}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.storeName || p.store?.storeName} · {p.proposedDiscount}% off
                    </div>
                    {p.adminNote && <div className="text-xs mt-1 text-muted-foreground italic">Note: {p.adminNote}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{fmtDate(p.createdAt)}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ENROLLMENTS TAB ───────────────────────────────────────────────────────

function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/store-promotions/enrollments`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setEnrollments(d.enrollments || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading enrollments…</div>;
  if (enrollments.length === 0) return <Card className="p-8 text-center text-muted-foreground text-sm rounded-xs">No enrollments yet.</Card>;

  return (
    <div className="space-y-2">
      {enrollments.map((e, i) => (
        <Card key={e._id ?? i} className="p-4 rounded-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{e.store?.storeName || "Unknown Store"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {e.promotion?.title || "Unknown Promo"} · {e.promotion?.discountPercent}% off
              </div>
            </div>
            <div className="text-xs text-muted-foreground shrink-0">{e.enrolledAt ? fmtDate(e.enrolledAt) : "—"}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── CREDITS TAB ───────────────────────────────────────────────────────────

function CreditsTab() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/admin/store-promotions/credits`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setCredits(d.credits || []))
      .catch(() => setCredits([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading credits…</div>;
  if (credits.length === 0) return <Card className="p-8 text-center text-muted-foreground text-sm rounded-xs">No store credits yet.</Card>;

  return (
    <div className="space-y-2">
      {credits.map((c) => (
        <Card key={c._id} className="rounded-xs overflow-hidden">
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{c.store?.storeName || "Unknown Store"}</div>
              {c.store?.email && <div className="text-xs text-muted-foreground">{c.store.email}</div>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-semibold text-sm" style={{ color: c.balance > 0 ? "#2a7a4e" : undefined }}>
                ${(c.balance ?? 0).toFixed(2)}
              </span>
              {c.transactions?.length > 0 && (
                <button onClick={() => setExpandedId(expandedId === c._id ? null : c._id)} className="text-muted-foreground">
                  {expandedId === c._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          {expandedId === c._id && c.transactions?.length > 0 && (
            <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
              {c.transactions.slice().reverse().map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="capitalize text-muted-foreground">{t.type}</span>
                    {t.note && <span className="text-muted-foreground ml-2">· {t.note}</span>}
                  </div>
                  <span style={{ color: t.type === "applied" ? "#b91c1c" : "#2a7a4e" }}>
                    {t.type === "applied" ? "-" : "+"}${(t.amount ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────

type Tab = "promotions" | "claims" | "requests" | "enrollments" | "credits";

export default function AdminPromotionsContent() {
  const [tab, setTab] = useState<Tab>("promotions");
  const [showCreate, setShowCreate] = useState(false);

  const [promos, setPromos] = useState<any[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [outstandingCredits, setOutstandingCredits] = useState(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);

  const fetchPromos = useCallback(() => {
    setPromosLoading(true);
    fetch(`${API_BASE}/admin/store-promotions`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setPromos(d.promotions || []))
      .catch(() => setPromos([]))
      .finally(() => setPromosLoading(false));
  }, []);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  // Fetch stats counts
  useEffect(() => {
    fetch(`${API_BASE}/admin/store-promotions/claims`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setPendingClaimsCount((d.claims || []).filter((c: any) => c.status === "pending").length))
      .catch(() => {});

    fetch(`${API_BASE}/admin/store-promotions/proposals`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setPendingRequestsCount((d.proposals || []).filter((p: any) => p.status === "pending").length))
      .catch(() => {});

    fetch(`${API_BASE}/admin/store-promotions/credits`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setOutstandingCredits((d.credits || []).reduce((sum: number, c: any) => sum + (c.balance ?? 0), 0)))
      .catch(() => {});

    fetch(`${API_BASE}/admin/store-promotions/enrollments`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setEnrollmentsCount((d.enrollments || []).length))
      .catch(() => {});
  }, []);

  const now = new Date();
  const activeCount = promos.filter((p) => p.isOpen && new Date(p.endDate) >= now && new Date(p.startDate) <= now).length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "promotions",  label: "Promotions",  badge: promos.length > 0 ? promos.length : undefined },
    { id: "claims",      label: "Claims" },
    { id: "requests",    label: "Requests",    badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { id: "enrollments", label: "Enrollments", badge: enrollmentsCount > 0 ? enrollmentsCount : undefined },
    { id: "credits",     label: "Credits" },
  ];

  return (
    <>
      <CreatePromoModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchPromos} />

      <div className="p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xs bg-primary/10">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Promotions</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage store promotions, claims, and credits</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="rounded-xs gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> New Promotion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 rounded-xs flex flex-col items-center gap-2 text-center">
            <div className="p-2.5 rounded-xs bg-green-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-muted-foreground">Active Promotions</span>
            <span className="text-2xl font-bold">{activeCount}</span>
          </Card>
          <Card className="p-5 rounded-xs flex flex-col items-center gap-2 text-center">
            <div className="p-2.5 rounded-xs bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-muted-foreground">Pending Claims</span>
            <span className="text-2xl font-bold">{pendingClaimsCount}</span>
          </Card>
          <Card className="p-5 rounded-xs flex flex-col items-center gap-2 text-center">
            <div className="p-2.5 rounded-xs bg-blue-100">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-muted-foreground">Outstanding Credits</span>
            <span className="text-2xl font-bold text-blue-600">${outstandingCredits.toFixed(2)}</span>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: active ? "hsl(var(--primary))" : "transparent",
                  color: active ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                {t.label}
                {t.badge !== undefined && (
                  active ? (
                    <span className="text-xs bg-white/25 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {t.badge}
                    </span>
                  ) : (
                    <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {t.badge}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {tab === "promotions"  && <PromotionsTab promos={promos} loading={promosLoading} onRefresh={fetchPromos} />}
          {tab === "claims"      && <ClaimsTab />}
          {tab === "requests"    && <RequestsTab />}
          {tab === "enrollments" && <EnrollmentsTab />}
          {tab === "credits"     && <CreditsTab />}
        </div>
      </div>
    </>
  );
}
