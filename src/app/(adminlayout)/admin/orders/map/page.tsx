"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const OrderMapView = dynamic(
  () => import("@/components/Orders/OrderPage/OrderMapView"),
  { ssr: false }
);

const OrderMapPage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <Link
          href="/admin/orders"
          className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-gray-800">Order Map View</h1>
      </div>
      <div className="flex-1 min-h-0">
        <OrderMapView />
      </div>
    </div>
  );
};

export default OrderMapPage;
