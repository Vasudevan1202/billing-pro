import { useState } from "react";
import { useListOrders, useGetOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { ChevronRight, X, Package } from "lucide-react";

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders({ limit: 50 });
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: selectedOrder } = useGetOrder(selectedOrderId ?? 0, {
    query: { enabled: selectedOrderId !== null },
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Recent Orders</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:border-primary/30 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-primary">{order.orderNumber}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                  <span className="capitalize">{order.paymentMethod}</span>
                  <span>{new Date(order.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className="font-bold text-lg text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-muted-foreground font-medium">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Completed orders will appear here</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId !== null && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="font-bold text-lg">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedOrderId(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold capitalize">{selectedOrder.paymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm mb-5">
                <span className="text-muted-foreground">Status</span>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {selectedOrder.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-700 mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.menuItemName}</p>
                      <p className="text-xs text-muted-foreground">₹{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary">₹{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
