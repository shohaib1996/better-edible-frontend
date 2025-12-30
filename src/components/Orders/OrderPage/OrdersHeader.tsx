import { Button } from "@/components/ui/button";

interface OrdersHeaderProps {
  onNewOrder: () => void;
}

export const OrdersHeader = ({ onNewOrder }: OrdersHeaderProps) => (
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-semibold">Orders Management</h1>
    <Button onClick={onNewOrder}>+ New Order</Button>
  </div>
);
