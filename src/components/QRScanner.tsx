import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-reader-container";

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          html5QrCode = new Html5Qrcode(scannerId);
          qrRef.current = html5QrCode;

          const config = { 
            fps: 10, 
            qrbox: (width: number, height: number) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          };

          // Try back/rear camera first, fallback to first camera
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('belakang')
          );
          const cameraId = backCamera ? backCamera.id : devices[0].id;

          await html5QrCode.start(
            cameraId,
            config,
            (decodedText) => {
              onScanSuccess(decodedText);
              // Clean up on success
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop()
                  .then(() => onClose())
                  .catch(() => onClose());
              } else {
                onClose();
              }
            },
            () => {
              // Verbose frame scans can be ignored
            }
          );
        } else {
          setError("Kamera tidak ditemukan pada perangkat Anda.");
        }
      } catch (err: any) {
        console.error("Camera access or initialization failed", err);
        setError("Gagal mengakses kamera. Harap izinkan akses kamera pada browser Anda atau periksa koneksi kamera.");
      }
    };

    // Delay initialization slightly to ensure the DOM element is fully rendered and styled
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => {
            console.log("Scanner stopped on unmount");
          })
          .catch((err) => {
            console.error("Failed to stop scanner on unmount", err);
          });
      }
    };
  }, [onScanSuccess, onClose]);

  const handleManualClose = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
      } catch (e) {
        console.error("Error stopping scanner manually", e);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="glass-panel rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 glass-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white neon-text">Scan QR / Barcode Barang</h3>
          </div>
          <button 
            onClick={handleManualClose}
            className="p-1 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Screen */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/60 min-h-[320px] relative">
          {error ? (
            <div className="text-center text-white/70 p-4 max-w-xs flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-xs font-semibold text-white/90">{error}</p>
              <button 
                onClick={handleManualClose}
                className="mt-2 text-xs font-bold text-white glass-button-primary px-4 py-2 rounded-md transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : (
            <div className="w-full relative flex flex-col items-center">
              <div id={scannerId} className="w-full max-w-xs rounded-lg overflow-hidden bg-black aspect-square shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
              {/* Overlaid targeting lines inside scan area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none border-2 border-dashed border-pink-500 rounded-lg animate-pulse" />
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 glass-header flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-semibold text-white/70">
            Posisikan QR Code / Barcode di dalam kotak merah/pink.
          </p>
          <p className="text-[10px] text-white/40 mt-1 font-mono">
            Sistem akan otomatis mendeteksi Kode Barang (contoh: BRG001)
          </p>
        </div>
      </div>
    </div>
  );
}
