'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Eye, MousePointerClick, Wallet, ArrowDownToLine, Loader2, Clock, Check, X, Crown, Bitcoin, CreditCard, Building2, Gift, Zap, ShieldCheck } from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RevenueData {
  totalRevenueCents: number;
  todayRevenueCents: number;
  monthRevenueCents: number;
  adRevenueCents: number;
  subscriptionRevenueCents: number;
  donationRevenueCents: number;
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  pageViews: number;
  rpmCents: number;
}

interface Withdrawal {
  id: string;
  amountCents: number;
  status: string;
  method: string;
  createdAt: string;
  processedAt: string | null;
  note: string | null;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  crypto: <Bitcoin className="h-4 w-4" />,
  paypal: <CreditCard className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  gift_card: <Gift className="h-4 w-4" />,
};

// Saved payout methods (persisted in localStorage)
const PAYOUT_STORAGE_KEY = 'pb_payout_methods';

interface SavedMethod {
  method: string;
  label: string;
  detail: string;
}

const DEFAULT_METHODS: SavedMethod[] = [
  { method: 'crypto', label: 'USDT TRC-20', detail: 'TGTiqyvzVeJ2epbcugsY5o2YdbAX6k4M59' },
  { method: 'paypal', label: 'PayPal', detail: 'founder@playbeat.live' },
];

/**
 * Owner Monetization Dashboard with full withdrawal system.
 * Shows real earnings from website traffic + withdraw to saved payout methods.
 */
export function OwnerMonetizationDashboard() {
  const { data: revenue, refetch: refetchRevenue } = useFetch<RevenueData>('/api/revenue');
  const { data: withdrawalData, refetch: refetchWithdrawals } = useFetch<{ withdrawals: Withdrawal[] }>('/api/withdrawals');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('crypto');
  const [payoutDetail, setPayoutDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedMethods, setSavedMethods] = useState<SavedMethod[]>(DEFAULT_METHODS);

  // Load saved payout methods from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAYOUT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setSavedMethods(parsed);
      } else {
        localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify(DEFAULT_METHODS));
      }
    } catch {
      // keep defaults
    }
  }, []);

  // When method changes, auto-fill the saved detail
  useEffect(() => {
    const saved = savedMethods.find((m) => m.method === method);
    if (saved) setPayoutDetail(saved.detail);
  }, [method, savedMethods]);

  if (!revenue) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;

  const withdrawals = withdrawalData?.withdrawals ?? [];
  const withdrawnCents = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amountCents, 0);
  const pendingCents = withdrawals.filter((w) => w.status === 'pending' || w.status === 'approved').reduce((s, w) => s + w.amountCents, 0);
  const availableCents = revenue.totalRevenueCents - withdrawnCents - pendingCents;
  const MIN_WITHDRAWAL = 100; // $1.00 minimum

  async function requestWithdrawal() {
    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}`);
      return;
    }
    if (amountCents > availableCents) {
      toast.error(`Insufficient balance. Available: ${formatMoney(availableCents)}`);
      return;
    }
    if (!payoutDetail) {
      toast.error('Please enter your payout details');
      return;
    }
    setBusy(true);
    const res = await apiAction('POST', '/api/withdrawals', { amountCents, method, payoutDetail });
    setBusy(false);
    if (res.ok) {
      // Save this method if not already saved
      const exists = savedMethods.find((m) => m.method === method && m.detail === payoutDetail);
      if (!exists) {
        const updated = [...savedMethods, { method, label: method === 'crypto' ? 'USDT' : method, detail: payoutDetail }];
        setSavedMethods(updated);
        localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify(updated));
      }
      toast.success(`Withdrawal of ${formatMoney(amountCents)} submitted to ${method}! Processing...`);
      setWithdrawOpen(false);
      setAmount('');
      refetchWithdrawals();
      refetchRevenue();
    } else {
      toast.error(res.error || 'Withdrawal failed');
    }
  }

  // Quick withdraw: withdraw all available funds instantly
  async function withdrawAll() {
    if (availableCents < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}`);
      return;
    }
    const saved = savedMethods.find((m) => m.method === method);
    const detail = saved?.detail || payoutDetail;
    if (!detail) {
      toast.error('Please select a payout method first');
      setWithdrawOpen(true);
      return;
    }
    setBusy(true);
    const res = await apiAction('POST', '/api/withdrawals', {
      amountCents: availableCents,
      method,
      payoutDetail: detail,
    });
    setBusy(false);
    if (res.ok) {
      toast.success(`Withdrew all ${formatMoney(availableCents)} to ${method}!`);
      refetchWithdrawals();
      refetchRevenue();
    } else {
      toast.error(res.error || 'Withdrawal failed');
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-extrabold">Website Monetization Earnings</h3>
        <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">OWNER ONLY</Badge>
        <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 gap-1">
          <ShieldCheck className="h-3 w-3" /> REAL PAYOUTS
        </Badge>
      </div>

      {/* Earnings summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatMoney(availableCents)}</p>
            <p className="text-xs text-muted-foreground">Available to Withdraw</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-brand" />
            <p className="mt-2 text-2xl font-extrabold">{formatMoney(revenue.totalRevenueCents)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue (All Time)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Check className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-2xl font-extrabold">{formatMoney(withdrawnCents)}</p>
            <p className="text-xs text-muted-foreground">Already Withdrawn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Clock className="h-5 w-5 text-amber-500" />
            <p className="mt-2 text-2xl font-extrabold text-amber-500">{formatMoney(pendingCents)}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="font-bold text-emerald-500">{formatMoney(revenue.adRevenueCents)}</p>
          <p className="text-xs text-muted-foreground">Ad Revenue ({revenue.totalImpressions} impr)</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="font-bold text-amber-500">{formatMoney(revenue.subscriptionRevenueCents)}</p>
          <p className="text-xs text-muted-foreground">Subscriptions</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="font-bold text-rose-500">{formatMoney(revenue.donationRevenueCents)}</p>
          <p className="text-xs text-muted-foreground">Donations</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <p className="font-bold text-violet-500">{formatMoney(revenue.rpmCents)}</p>
          <p className="text-xs text-muted-foreground">RPM / 1K views ({revenue.pageViews} views)</p>
        </div>
      </div>

      {/* Withdraw section */}
      <div className="rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">Withdraw Your Earnings</p>
            <p className="text-xs text-muted-foreground">
              Available: <span className="font-semibold text-emerald-500">{formatMoney(availableCents)}</span>
              {' · '}Min: {formatMoney(MIN_WITHDRAWAL)}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Quick withdraw all */}
            <Button
              onClick={withdrawAll}
              disabled={busy || availableCents < MIN_WITHDRAWAL}
              variant="outline"
              className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Withdraw All ({formatMoney(availableCents)})
            </Button>
            {/* Custom amount withdraw */}
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button disabled={availableCents < MIN_WITHDRAWAL} className="gap-2">
                  <ArrowDownToLine className="h-4 w-4" /> Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Withdraw Website Earnings</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Available Balance</p>
                    <p className="text-3xl font-extrabold text-emerald-500">{formatMoney(availableCents)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">From: Ad impressions, clicks, affiliate, donations, PPV</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount (USD)</Label>
                    <div className="flex gap-2">
                      <Input type="number" min={MIN_WITHDRAWAL / 100} max={availableCents / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min $${MIN_WITHDRAWAL / 100}`} />
                      <Button type="button" variant="outline" size="sm" onClick={() => setAmount(String((availableCents / 100).toFixed(2)))}>Max</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto">Crypto (USDT TRC-20) — Saved</SelectItem>
                        <SelectItem value="paypal">PayPal — Saved</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="gift_card">Gift Card (Amazon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{method === 'paypal' ? 'PayPal Email' : method === 'bank_transfer' ? 'Bank Account Number' : method === 'crypto' ? 'Crypto Wallet Address' : 'Gift Card Email'}</Label>
                    <Input value={payoutDetail} onChange={(e) => setPayoutDetail(e.target.value)} placeholder={method === 'paypal' ? 'you@email.com' : method === 'crypto' ? 'Wallet address' : 'Account/email'} />
                    {savedMethods.find((m) => m.method === method) && (
                      <p className="text-[11px] text-emerald-500">✓ Saved payout method loaded</p>
                    )}
                  </div>

                  {/* Saved payout methods */}
                  <div className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved Payout Methods</p>
                    <div className="space-y-1.5">
                      {savedMethods.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => { setMethod(m.method); setPayoutDetail(m.detail); }}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs transition-colors',
                            method === m.method ? 'bg-brand/10 ring-1 ring-brand/30' : 'hover:bg-muted',
                          )}
                        >
                          {METHOD_ICONS[m.method] || <Wallet className="h-4 w-4" />}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{m.label}</p>
                            <p className="truncate text-muted-foreground">{m.detail.slice(0, 30)}{m.detail.length > 30 ? '...' : ''}</p>
                          </div>
                          {method === m.method && <Check className="h-3 w-3 text-brand" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                    Earnings come from website traffic: ad impressions, clicks, affiliate conversions, donations, and PPV event purchases. Withdrawals are processed to your selected payout method.
                  </p>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={requestWithdrawal} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                    Withdraw {amount ? formatMoney(Number(amount) * 100) : ''}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Withdrawal history */}
      <Card>
        <CardHeader><CardTitle className="text-base">Withdrawal History</CardTitle></CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No withdrawals yet. Your earnings accumulate from website traffic.</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    w.status === 'paid' ? 'bg-emerald-500/10' : w.status === 'rejected' ? 'bg-red-500/10' : 'bg-amber-500/10')}>
                    {METHOD_ICONS[w.method] || <Wallet className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{formatMoney(w.amountCents)}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.method} · {new Date(w.createdAt).toLocaleDateString()} {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={w.status === 'paid' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                    {w.status === 'paid' && <Check className="mr-1 h-3 w-3" />}
                    {w.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                    {w.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
