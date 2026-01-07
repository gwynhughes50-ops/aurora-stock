import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Package,
  Bell,
  Boxes,
  Thermometer,
  FileText,
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  LogIn,
  UserPlus,
  LogOut,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Layout() {
  const navigate = useNavigate();
  const { firebaseUser, isAdmin } = useAuth();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/inventory", label: "Inventory", icon: Boxes },
    { to: "/alerts", label: "Alerts", icon: AlertTriangle },
    { to: "/temperature", label: "Temperature", icon: Thermometer },
    { to: "/compliance", label: "Compliance", icon: ClipboardCheck },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: FileText }] : []),
    { to: "/reports", label: "Reports", icon: BarChart3 },
  ];
 
  async function handleSignOut() {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -left-32 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        {/* header */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 via-emerald-400 to-cyan-500 shadow-[0_0_35px_rgba(34,211,238,0.6)]">
              <Package className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Aurora Stock Control
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                Inventory, alerts and temperatures across your sites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="gap-2 rounded-full px-3 py-1.5">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>

            {!firebaseUser ? (
              <>
                <NavLink to="/login">
                  <Button variant="ghost" className="gap-2 rounded-full px-3 py-1.5">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Button>
                </NavLink>

                <NavLink to="/register">
                  <Button
                    variant="default"
                    className="gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 px-3 py-1.5 text-slate-950 shadow-lg shadow-emerald-500/40"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register
                  </Button>
                </NavLink>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-200">
                  <span className="text-slate-400">Signed in:</span>
                  <span className="font-medium">{firebaseUser.email}</span>
                  {isAdmin && (
                    <span className="ml-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-teal-200">
                      Admin
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  className="gap-2 rounded-full px-3 py-1.5"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </header>

        {/* nav */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.to !== "/reports"}>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`gap-2 rounded-full px-3 py-1.5 text-xs ${
                      isActive
                        ? "bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40"
                        : "text-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Button>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

