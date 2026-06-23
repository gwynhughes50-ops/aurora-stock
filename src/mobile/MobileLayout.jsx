import MobileHome from "./MobileHome";
import MobileBottomNav from "./MobileBottomNav";
import MobileBarcodeScanner from "@/components/ui/MobileBarcodeScanner";

export default function MobileLayout() {
  const handleMobileScan = (code) => {
    const scannedCode = String(code || "").trim();
    if (!scannedCode) return;

    console.log("Mobile scan:", scannedCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <MobileHome />

      <MobileBarcodeScanner onScan={handleMobileScan} />

      <MobileBottomNav
        onScanClick={() => {
          document.querySelector("[data-mobile-scan-button]")?.click();
        }}
      />
    </div>
  );
}