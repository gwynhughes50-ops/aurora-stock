import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { PermissionsProvider, usePermissions } from "@/context/PermissionsContext";
import base44 from "@/lib/base44";
import { navigation, createPageUrl } from "@/config/navigation";

type LayoutPageName = string;

interface LayoutContentProps {
  children: ReactNode;
  currentPageName: LayoutPageName;
}

function LayoutContent({ children, currentPageName }: LayoutContentProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.getCurrentUser(),
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ["stockItems"],
    queryFn: () => base44.entities.StockItem.list(),
  });

  const alertCount = stockItems.filter(
    (item: any) =>
      item.current_stock === 0 || item.current_stock <= item.min_stock
  ).length;

  const filteredNav = navigation.filter((item) => {
    if (item.adminOnly) return user?.role === "admin";
    if (item.permission) return hasPermission(item.permission);
    return true;
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">
                  StockManager
                </h1>
                <p className="text-xs text-slate-500">Inventory System</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {filteredNav.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;

                return (
                  <Link key={item.page} to={createPageUrl(item.page)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "gap-2 relative",
                        isActive &&
                          "bg-teal-50 text-teal-700 hover:bg-teal-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                      {item.page === "Alerts" && alertCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                          {alertCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.full_name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.full_name || user?.email?.split("@")[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium text-slate-900">
                      {user?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="p-4 space-y-1">
              {filteredNav.map((item) => {
                const isActive = currentPageName === item.page;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 relative",
                        isActive && "bg-teal-50 text-teal-700"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                      {item.page === "Alerts" && alertCount > 0 && (
                        <span className="ml-auto h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
                          {alertCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
  currentPageName: LayoutPageName;
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  return (
    <PermissionsProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </PermissionsProvider>
  );
}
