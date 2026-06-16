"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Gift,
  CreditCard,
  Clock,
  CheckCircle2,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { DesignRequestForm } from "@/components/DesignRequests/DesignRequestForm";
import { getStoreUser } from "@/lib/storeUser";
import { IStoreUser } from "@/types/storeAuth/storeAuth";

const HOW_IT_WORKS = [
  {
    icon: Paperclip,
    title: "Submit your request",
    body: "Describe what you need and attach any reference files.",
  },
  {
    icon: Clock,
    title: "We assign a designer",
    body: "Your request lands in our queue and gets picked up right away.",
  },
  {
    icon: MessageSquare,
    title: "Collaborate",
    body: "Chat with your designer and request revisions until it's perfect.",
  },
  {
    icon: CheckCircle2,
    title: "Download your files",
    body: "Completed files are delivered right in your request.",
  },
];

const TYPE_INFO = {
  free: {
    icon: Gift,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    title: "Free Request",
    body: "Included with your store. Best for our standard product lines — CannaCrispy, Bliss, FiftyOneFifty, and YummyGummy.",
  },
  paid: {
    icon: CreditCard,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    title: "Paid Request",
    body: "For custom or bespoke designs outside our standard product lines. Our team will reach out with a quote.",
  },
};

export default function NewDesignRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<IStoreUser | null>(null);

  useEffect(() => {
    const u = getStoreUser();
    if (!u) {
      router.replace("/store/login");
      return;
    }
    setUser(u);
  }, [router]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/store/assets?tab=requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Design Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            New Design Request
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            Tell us what you need — our designers will take care of the rest.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form — takes 2/3 */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xs p-6">
          <DesignRequestForm
            source="store"
            submittedBy={user.contactId}
            submittedByName={user.name}
            storeId={user.storeId}
            storeName={user.storeName}
            contactId={user.contactId}
            allowTypeToggle
            onSuccess={() => router.push("/store/assets?tab=requests")}
          />
        </div>

        {/* Info sidebar — takes 1/3 */}
        <div className="space-y-4">
          {/* Request type info cards */}
          {(["free", "paid"] as const).map((type) => {
            const { icon: Icon, color, bg, border, title, body } = TYPE_INFO[type];
            return (
              <div
                key={type}
                className={`rounded-xs border ${border} ${bg} px-4 py-4 flex gap-3`}
              >
                <div className={`shrink-0 mt-0.5 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${color}`}>{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            );
          })}

          {/* How it works */}
          <div className="bg-card border border-border rounded-xs px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              How it works
            </p>
            <ol className="space-y-3">
              {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-xs bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
