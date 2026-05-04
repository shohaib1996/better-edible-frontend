"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RequestDetailView } from "@/components/DesignRequests/RequestDetailView";
import { useGetDesignRequestByIdQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { getStoreUser } from "@/lib/storeUser";
import { IStoreUser } from "@/types/storeAuth/storeAuth";

export default function StoreDesignRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<IStoreUser | null>(null);

  useEffect(() => {
    const u = getStoreUser();
    if (!u) { router.replace("/store/login"); return; }
    setUser(u);
  }, [router]);

  const { data, isLoading } = useGetDesignRequestByIdQuery(id, { skip: !id || !user });
  const request = data?.request;

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-5">
      <Link
        href="/store/design-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !request ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Request not found.</p>
      ) : (
        <RequestDetailView
          request={request}
          isStore
          authorId={user.contactId}
          authorName={user.name}
          authorRole="store"
        />
      )}
    </div>
  );
}
