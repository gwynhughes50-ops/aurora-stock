import MobileHome from "./MobileHome";
import MobileBottomNav from "./MobileBottomNav";

export default function MobileLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <MobileHome />
      <MobileBottomNav />
    </div>
  );
}