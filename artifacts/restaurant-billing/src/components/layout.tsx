import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Coffee, Settings, BarChart3, Receipt, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Billing", path: "/", icon: Coffee },
    { name: "Orders", path: "/orders", icon: Receipt },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Admin", path: "/admin", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-secondary/30 overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">MDS Billing</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[73px] bg-white z-50 flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-4 rounded-xl text-left w-full transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold" 
                    : "bg-secondary/50 text-muted-foreground font-medium"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-[240px] bg-white border-r shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">MDS Billing</span>
        </div>
        
        <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 scale-[1.02]" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground font-medium"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t">
          <p className="text-xs text-muted-foreground text-center">&copy; Vasu</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-secondary/30 relative">
        {children}
      </main>
    </div>
  );
}