import { useState } from "react";
import { useGetAnalyticsSummary, useGetTopItems } from "@workspace/api-client-react";
import { TrendingUp, ShoppingBag, IndianRupee, Star, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Period = "today" | "week" | "month" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { data: summary, isLoading: summaryLoading } = useGetAnalyticsSummary({ period });
  const { data: topItems, isLoading: topLoading } = useGetTopItems({ period, limit: 5 });

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, aside, [data-sidebar], header { display: none !important; }
          body { background: white !important; }
          .print-hide { display: none !important; }
          .print-page { padding: 24px !important; max-width: 100% !important; }
          .bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="p-4 max-w-4xl mx-auto print-page">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
            <p className="text-sm text-muted-foreground print-only hidden print:block mt-1">
              MDS Billing &mdash; Period: {PERIOD_LABELS[period]} &mdash; Printed {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2 print-hide"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit print-hide">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                period === p.value
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Period label visible only when printing */}
        <p className="hidden print:block text-sm font-semibold text-gray-600 mb-4 -mt-2">
          Period: {PERIOD_LABELS[period]}
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                ₹{(summary?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{summary?.totalOrders ?? 0}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
            {summaryLoading ? (
              <div className="h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                ₹{(summary?.averageOrderValue ?? 0).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Top Selling Items</h2>
          </div>

          {topLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topItems && topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item, index) => {
                const maxQty = topItems[0]?.totalQuantity ?? 1;
                const barWidth = maxQty > 0 ? (item.totalQuantity / maxQty) * 100 : 0;
                return (
                  <div key={item.menuItemId} className="flex items-center gap-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        index === 0
                          ? "bg-primary text-white"
                          : index === 1
                          ? "bg-orange-200 text-orange-700"
                          : index === 2
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-sm text-gray-900">{item.menuItemName}</span>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">{item.totalQuantity} sold</span>
                          <span className="ml-3 text-sm font-bold text-primary">₹{item.totalRevenue.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="bar-fill h-full bg-primary/60 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p>No sales data for this period</p>
              <p className="text-sm text-gray-400 mt-1">Complete orders to see analytics</p>
            </div>
          )}
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-gray-400 border-t pt-4">
          MDS Billing &mdash; &copy; Vasu
        </div>
      </div>
    </>
  );
}
