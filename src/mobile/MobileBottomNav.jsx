import { Home, Package, Camera, Bell, User } from "lucide-react";

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-3 pb-3 pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md items-end justify-around">
        <button className="flex flex-col items-center gap-1 text-xs text-slate-300">
          <Home className="h-5 w-5" />
          Home
        </button>

        <button className="flex flex-col items-center gap-1 text-xs text-slate-300">
          <Package className="h-5 w-5" />
          Stock
        </button>

        <button className="-mt-8 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/30">
          <Camera className="h-6 w-6" />
          <span className="mt-0.5 text-[10px] font-bold tracking-wide">
            SCAN
          </span>
        </button>

        <button className="flex flex-col items-center gap-1 text-xs text-slate-300">
          <Bell className="h-5 w-5" />
          Alerts
        </button>

        <button className="flex flex-col items-center gap-1 text-xs text-slate-300">
          <User className="h-5 w-5" />
          Me
        </button>
      </div>
    </nav>
  );
}