import { Button } from "@/components/ui/button";

interface OrdersHeaderProps {
  onNewOrder: () => void;
  onNewPrivateLabel?: () => void;
}

export const OrdersHeader = ({
  onNewOrder,
  onNewPrivateLabel,
}: OrdersHeaderProps) => (
  <div className="flex justify-between items-center mb-4">
    <h1 className="text-2xl font-semibold">Orders Management</h1>
    <div className="flex gap-2">
      {onNewPrivateLabel && (
        <Button onClick={onNewPrivateLabel} variant="outline">
          + Private Label
        </Button>
      )}
      <Button onClick={onNewOrder}>+ New Order</Button>
    </div>
  </div>
);
