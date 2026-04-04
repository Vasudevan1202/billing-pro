import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingCart, X, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useListMenuItems, useCreateOrder, getListOrdersQueryKey, getGetAnalyticsSummaryQueryKey, getGetTopItemsQueryKey } from "@workspace/api-client-react";
import type { MenuItem } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PaymentMethod = "cash" | "upi" | "card";

interface ConfirmedOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  items: { menuItemId: number; menuItemName: string; quantity: number; unitPrice: number; subtotal: number }[];
  createdAt: string;
}

export default function BillingPage() {
  const { data: menuItems, isLoading } = useListMenuItems();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showPayModal, setShowPayModal] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showMobileCart, setShowMobileCart] = useState(false);

  const categories = ["All", ...Array.from(new Set(menuItems?.map((m) => m.category) ?? []))];
  const filteredItems = menuItems?.filter(
    (m) => m.available && (selectedCategory === "All" || m.category === selectedCategory)
  );

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item);
  };

  const handlePay = () => {
    if (cart.length === 0) return;
    createOrder.mutate(
      {
        data: {
          items: cart.map((c) => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
          paymentMethod,
        },
      },
      {
        onSuccess: (order) => {
          setConfirmedOrder(order as ConfirmedOrder);
          setShowPayModal(false);
          clearCart();
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTopItemsQueryKey() });
        },
      }
    );
  };

  const upiQRValue = `upi://pay?pa=restaurant@upi&pn=MDS%20Billing&am=${cartTotal.toFixed(2)}&cu=INR`;

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 print:shadow-none">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Payment Confirmed</h2>
              <p className="text-muted-foreground text-sm mt-1">{new Date(confirmedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="border-t border-b py-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Order #</span>
                <span className="font-bold text-primary text-lg">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Payment</span>
                <span className="capitalize font-medium">{confirmedOrder.paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">Items Ordered</h3>
              <div className="space-y-2">
                {confirmedOrder.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.menuItemName} x{item.quantity}</span>
                    <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-primary">₹{confirmedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground mb-6 print:block">
              <p>Thank you for dining with us!</p>
              <p>MDS Billing &mdash; &copy; Vasu</p>
            </div>

            <div className="flex gap-3 print:hidden">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                Print Bill
              </Button>
              <Button className="flex-1" onClick={() => setConfirmedOrder(null)}>
                New Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Menu section */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Menu</h1>
            <button
              className="md:hidden relative"
              onClick={() => setShowMobileCart(true)}
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                  {cart.reduce((s, c) => s + c.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-44 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems?.map((item) => {
                const cartItem = cart.find((c) => c.menuItem.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-transform active:scale-95"
                  >
                    <div className="relative h-32 bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/200x160/f97316/ffffff?text=${encodeURIComponent(item.name)}`;
                        }}
                      />
                      {cartItem && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shadow">
                          {cartItem.quantity}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                      <p className="text-primary font-bold mt-1">₹{item.price}</p>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="mt-auto w-full py-2 rounded-lg bg-primary text-white font-semibold text-sm transition-opacity active:opacity-80 hover:opacity-90"
                      >
                        {cartItem ? "Add More" : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart */}
      <div className="hidden md:flex w-80 bg-white border-l flex-col shadow-lg">
        <CartPanel
          cart={cart}
          cartTotal={cartTotal}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onPayNow={() => setShowPayModal(true)}
        />
      </div>

      {/* Mobile Cart Bottom Sheet */}
      {showMobileCart && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setShowMobileCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Cart</h2>
              <button onClick={() => setShowMobileCart(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <CartPanel
              cart={cart}
              cartTotal={cartTotal}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              onPayNow={() => { setShowMobileCart(false); setShowPayModal(true); }}
            />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Payment</h2>
              <button onClick={() => setShowPayModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-600 mb-3">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "upi", "card"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-xl border-2 font-semibold text-sm capitalize transition-colors ${
                      paymentMethod === method
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {method.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "upi" && (
              <div className="mb-5 flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-3">Scan to pay ₹{cartTotal.toFixed(2)}</p>
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <QRCodeSVG value={upiQRValue} size={160} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">UPI ID: restaurant@upi</p>
              </div>
            )}

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">₹{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full py-6 text-lg font-bold"
              onClick={handlePay}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CartPanelProps {
  cart: ReturnType<typeof useCart>["cart"];
  cartTotal: number;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onPayNow: () => void;
}

function CartPanel({ cart, cartTotal, onUpdateQuantity, onRemove, onClear, onPayNow }: CartPanelProps) {
  return (
    <>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Cart
          </h2>
          {cart.length > 0 && (
            <button
              onClick={onClear}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <ShoppingCart className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-muted-foreground text-sm">Cart is empty</p>
            <p className="text-xs text-gray-400 mt-1">Tap items from the menu to add</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((cartItem) => (
              <div key={cartItem.menuItem.id} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{cartItem.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">₹{cartItem.menuItem.price} each</p>
                  </div>
                  <button
                    onClick={() => onRemove(cartItem.menuItem.id)}
                    className="text-gray-400 hover:text-destructive transition-colors ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:border-primary hover:text-primary transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{cartItem.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-bold text-primary text-sm">
                    ₹{(cartItem.menuItem.price * cartItem.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-muted-foreground">{cart.reduce((s, c) => s + c.quantity, 0)} items</p>
            <p className="text-xl font-bold text-gray-900">₹{cartTotal.toFixed(2)}</p>
          </div>
        </div>
        <Button
          className="w-full py-6 text-base font-bold shadow-md shadow-primary/20"
          onClick={onPayNow}
          disabled={cart.length === 0}
        >
          Pay Now
        </Button>
      </div>
    </>
  );
}
