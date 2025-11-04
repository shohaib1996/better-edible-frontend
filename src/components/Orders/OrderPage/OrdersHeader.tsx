import { Button } from "@/src/components/ui/button";

export const OrdersHeader = ({ onNewOrder }: { onNewOrder: () => void }) => (
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-semibold">Orders Management</h1>
    <Button onClick={onNewOrder}>+ New Order</Button>
  </div>
);
