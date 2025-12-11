import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScanLine, Smartphone } from "lucide-react";

interface MobileBarcodeScannerProps {
  onScan: (value: string) => void;
}

/**
 * MobileBarcodeScanner
 *
 * - Opens a dialog with a live camera preview
 * - Requests the environment/back camera where possible
 * - Uses a higher-resolution constraint to reduce blur
 * - Automatically stops scanning once a code is decoded
 */
export default function MobileBarcodeScanner({ onScan }: MobileBarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    if (!open) {
      // Stop any running scan when dialog closes
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      setError(null);
      return;
    }

    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        // Prefer back camera, with higher resolution to avoid blur
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const videoElement = videoRef.current;
        if (!videoElement) return;

        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, err) => {
            if (result) {
              const text = result.getText();
              if (text) {
                onScan(text);
                setOpen(false);
              }
            }
            // Ignore not-found errors; they are part of the continuous scanning process
          },
          constraints
        );

        controlsRef.current = controls;
      } catch (err) {
        console.error(err);
        setError("Unable to access camera. Please check permissions.");
      }
    };

    startScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [open, onScan]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <ScanLine className="h-4 w-4" />
        Scan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-slate-950 border border-slate-800/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-50">
              <Smartphone className="h-4 w-4" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative mx-auto w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {/* Framing Box */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-40 w-40 border-2 border-teal-400/80 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.75)]" />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 text-center">{error}</p>
            )}

            <p className="text-xs text-slate-400 text-center">
              Align the barcode within the square. Hold your phone steady until it focuses.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
