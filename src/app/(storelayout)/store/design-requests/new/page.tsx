"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DesignRequestForm } from "@/components/DesignRequests/DesignRequestForm";
import { getStoreUser } from "@/lib/storeUser";
import { IStoreUser } from "@/types/storeAuth/storeAuth";

export default function NewDesignRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState<IStoreUser | null>(null);

  useEffect(() => {
    const u = getStoreUser();
    if (!u) { router.replace("/store/login"); return; }
    setUser(u);
  }, [router]);

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-5">
      <Link
        href="/store/design-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      <Card className="rounded-xs border border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">New Design Request</CardTitle>
          <CardDescription>
            Tell us what you need and we'll assign it to a designer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DesignRequestForm
            source="store"
            submittedBy={user.contactId}
            submittedByName={user.name}
            storeId={user.storeId}
            storeName={user.storeName}
            contactId={user.contactId}
            allowTypeToggle
            onSuccess={() => router.push("/store/design-requests")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
