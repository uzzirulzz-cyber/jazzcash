'use client';

import { ShieldAlert, AlertOctagon, Check, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/ui/button';

/**
 * Age-gate confirmation modal — shown when a user clicks the Adult nav item.
 * Requires explicit 18+ confirmation before unlocking the Adult section.
 */
export function AgeGateModal() {
  const pendingAdultView = useApp((s) => s.pendingAdultView);
  const unlockAdult = useApp((s) => s.unlockAdult);
  const cancelAdultView = useApp((s) => s.cancelAdultView);

  if (!pendingAdultView) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-600/40 bg-card shadow-2xl">
        {/* Header — red warning band */}
        <div className="flex items-center justify-center gap-2 bg-red-600/15 px-6 py-4">
          <AlertOctagon className="h-6 w-6 text-red-500" />
          <h2 id="age-gate-title" className="text-lg font-extrabold tracking-tight text-red-500">
            Age-Restricted Content
          </h2>
        </div>

        <div className="p-6">
          {/* Big 18+ badge */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-500 bg-red-950/30">
              <span className="text-2xl font-black text-red-500">18+</span>
            </div>
          </div>

          <h3 className="text-center text-xl font-extrabold tracking-tight">
            Confirm You Are 18 or Older
          </h3>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            This section contains adult content including live channels, movies and premium content.
            By clicking <span className="font-semibold text-foreground">"I am 18 or older"</span>, you confirm:
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>You are at least 18 years of age (21 in some jurisdictions).</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>Viewing adult content is legal in your country/state of residence.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>You understand the content is for adults only and will not share access with minors.</span>
            </li>
          </ul>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted/60 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Parental advisory:</span> Keep this device out of reach of minors. You can lock the Adult section at any time using the Lock button in the Adult view header.
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={cancelAdultView}
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button
              className="flex-1 gap-1.5 bg-red-600 text-white hover:bg-red-700"
              onClick={unlockAdult}
            >
              <Check className="h-4 w-4" /> I am 18 or older
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
