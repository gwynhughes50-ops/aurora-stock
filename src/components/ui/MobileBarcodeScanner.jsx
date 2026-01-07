import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

/**
 * MobileBarcodeScanner
 * - Opens a modal
 * - Requests camera with rear-facing preference
 * - Shows live video if camera works
 * - If you have a barcode decoding lib, you can plug it in where marked
 *
 * Props:
 * - onScan(code: string)
 */
export default function MobileBarcodeScanner({ onScan }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [errText, setErrText] = useState("");
  const [manual, setManual] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const close = () => setOpen(false);

  // Stop camera when closing/unmounting
  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  // Core: request camera
  const startCamera = async () => {
    setStatus("Requesting camera…");
    setErrText("");

    // Required checks
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrText("Camera API not available in this browser/environment.");
      setStatus("");
      return;
    }

    try {
      // Prefer rear camera on phones; fallback to any camera
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("Camera active. Line barcode up inside the box.");
    } catch (e) {
      // Show exact browser error (this is the truth)
      const name = e?.name || "UnknownError";
      const msg = e?.message || String(e);

      let hint = "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        hint =
          "Permission blocked. Allow camera for this site in browser settings, then refresh.";
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        hint =
          "No camera found (or rear camera unavailable). Try a device with a camera.";
      } else if (name === "NotReadableError") {
        hint =
          "Camera is in use by another app (Zoom/Teams) or OS blocked access. Close other apps and retry.";
      } else if (name === "AbortError") {
        hint = "Camera start was interrupted. Try again.";
      } else {
        hint = "Check HTTPS/localhost and browser permissions.";
      }

      setErrText(`${name}: ${msg}${hint ? `\n\n${hint}` : ""}`);
      setStatus("");
      stopCamera();
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    startCamera();

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // If you later add decoding, call onScan("code") and close().
  const submitManual = () => {
    const code = manual.trim();
    if (!code) return;
    onScan?.(code);
    setManual("");
    close();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2" variant="outline">
        Scan
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-2xl text-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Scan barcode</p>
                <p className="text-xs text-slate-400">
                  If camera fails, use manual entry below.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-72 w-full object-cover"
              />
              {/* Scan box overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-28 w-64 rounded-2xl border-2 border-teal-400/70 shadow-[0_0_30px_rgba(45,212,191,0.35)]" />
              </div>
            </div>

            {status && (
              <p className="mt-3 text-xs text-slate-300 whitespace-pre-line">
                {status}
              </p>
            )}

            {errText && (
              <p className="mt-3 text-xs text-rose-200 whitespace-pre-line">
                {errText}
              </p>
            )}

            {/* Manual fallback */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-400">Enter barcode manually</p>
              <div className="flex gap-2">
                <Input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="Type or paste barcode…"
                />
                <Button onClick={submitManual} disabled={!manual.trim()}>
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  stopCamera();
                  startCamera();
                }}
              >
                Retry camera
              </Button>
              <Button variant="ghost" onClick={close}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

