import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/lib/cart";
import { Layout } from "@/components/layout";
import BillingPage from "@/pages/billing";
import OrdersPage from "@/pages/orders";
import AnalyticsPage from "@/pages/analytics";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={BillingPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
