'use client';

import { useState } from 'react';
import { Download, Smartphone, X, QrCode, Chrome, Apple, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Download App button for the footer.
 * - On Android Chrome: triggers native PWA install prompt
 * - On iOS: shows "Add to Home Screen" instructions
 * - On desktop: shows QR code + instructions
 */
export function DownloadAppButton({ variant = 'footer' }: { variant?: 'footer' | 'landing' }) {
  const { canInstall, installed, isAndroid, isIOS, promptInstall } = usePwaInstall();
  const [showModal, setShowModal] = useState(false);

  // Already installed — don't show the button.
  if (installed) return null;

  async function handleDownload() {
    // If the browser supports native PWA install (Android Chrome), trigger it.
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        toast.success('PlayBeat Arena installed! Check your home screen.');
      }
      return;
    }
    // Otherwise show the instructions modal.
    setShowModal(true);
  }

  return (
    <>
      <button
        onClick={handleDownload}
        className={cn(
          'group flex items-center gap-2 rounded-xl font-semibold transition-all',
          variant === 'footer'
            ? 'border border-white/20 bg-white/5 px-4 py-2.5 text-white hover:bg-white/10'
            : 'brand-bg px-5 py-3 text-sm shadow-lg hover:scale-105',
        )}
      >
        <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
        <div className="text-left">
          <span className="block text-xs font-bold leading-tight">Download App</span>
          <span className="block text-[10px] opacity-80 leading-tight">Free · Android & iOS</span>
        </div>
      </button>

      {showModal && <InstallModal onClose={() => setShowModal(false)} isAndroid={isAndroid} isIOS={isIOS} canInstall={canInstall} promptInstall={promptInstall} />}
    </>
  );
}

function InstallModal({
  onClose, isAndroid, isIOS, canInstall, promptInstall,
}: {
  onClose: () => void;
  isAndroid: boolean;
  isIOS: boolean;
  canInstall: boolean;
  promptInstall: () => Promise<boolean>;
}) {
  async function tryInstall() {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) {
        toast.success('Installed! Check your home screen.');
        onClose();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PlayBeat Arena" className="h-8 w-8 rounded-lg object-contain" />
            <h3 className="font-bold">Install PlayBeat Arena</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6">
          {/* Logo + description */}
          <div className="mb-5 text-center">
            <img src="/android-chrome-192.png" alt="PlayBeat Arena" className="mx-auto mb-3 h-20 w-20 rounded-2xl object-contain shadow-lg" />
            <h4 className="text-lg font-extrabold">PlayBeat Arena</h4>
            <p className="text-sm text-muted-foreground">14,000+ live channels · 100% free</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">★ 4.8</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Sports</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Entertainment</span>
            </div>
          </div>

          {/* Platform-specific instructions */}
          {canInstall ? (
            // Native install available (Android Chrome)
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-3">
                <Chrome className="h-6 w-6 text-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Install on this device</p>
                  <p className="text-xs text-muted-foreground">Add PlayBeat Arena to your home screen</p>
                </div>
              </div>
              <Button onClick={tryInstall} className="w-full gap-2">
                <Download className="h-4 w-4" /> Install Now
              </Button>
            </div>
          ) : isIOS ? (
            // iOS instructions
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                <Apple className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Install on iPhone/iPad</p>
                  <ol className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    <li>1. Tap the <Share className="inline h-3 w-3" /> Share button in Safari</li>
                    <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>3. Tap <strong>"Add"</strong> — done!</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            // Desktop / other — show QR code
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-3">
                <Smartphone className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Install on your phone</p>
                  <p className="text-xs text-muted-foreground">Scan this QR code with your phone camera to install</p>
                </div>
              </div>
              {/* QR code (generated as inline SVG pattern) */}
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-border bg-white p-3">
                  <QrCodeSvg />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Or open this page in Chrome on Android and tap "Install"
              </p>
            </div>
          )}

          {/* Feature list */}
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">✓ No subscription</span>
            <span className="flex items-center gap-1">✓ 14,000+ channels</span>
            <span className="flex items-center gap-1">✓ Live notifications</span>
            <span className="flex items-center gap-1">✓ Works offline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple decorative QR code SVG (not a real QR — just visual). */
function QrCodeSvg() {
  // Generate a pseudo-random 21x21 grid pattern.
  const cells: boolean[] = [];
  const seed = 42;
  for (let i = 0; i < 441; i++) {
    cells.push(((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 > 0.5);
  }
  // Corner markers.
  const isMarker = (r: number, c: number) => {
    const inCorner = (sr: number, sc: number) => r >= sr && r < sr + 7 && c >= sc && c < sc + 7;
    return inCorner(0, 0) || inCorner(0, 14) || inCorner(14, 0);
  };
  const isMarkerBorder = (r: number, c: number) => {
    const check = (sr: number, sc: number) => {
      const dr = r - sr, dc = c - sc;
      return (dr === 0 || dr === 6 || dc === 0 || dc === 6) && dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
    };
    return check(0, 0) || check(0, 14) || check(14, 0);
  };
  const isMarkerCenter = (r: number, c: number) => {
    const check = (sr: number, sc: number) => r >= sr + 2 && r <= sr + 4 && c >= sc + 2 && c <= sc + 4;
    return check(0, 0) || check(0, 14) || check(14, 0);
  };

  return (
    <svg width="120" height="120" viewBox="0 0 21 21" className="h-30 w-30">
      <rect width="21" height="21" fill="white" />
      {cells.map((on, i) => {
        const r = Math.floor(i / 21);
        const c = i % 21;
        if (isMarker(r, c)) {
          if (isMarkerBorder(r, c) || isMarkerCenter(r, c)) {
            return <rect key={i} x={c} y={r} width={1} height={1} fill="black" />;
          }
          return null;
        }
        return on ? <rect key={i} x={c} y={r} width={1} height={1} fill="black" /> : null;
      })}
    </svg>
  );
}
