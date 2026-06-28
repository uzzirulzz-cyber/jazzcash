'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Eye, MousePointerClick, Wallet, ArrowDownToLine, Loader2, Clock, Check, X, Crown } from 'lucide-react';
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

/**
 * Owner Monetization Dashboard — shows website owner's earnings from traffic
 * (ad impressions, clicks, affiliate, donations, PPV) with withdrawal option.
 * This is NOT for visitors — only the website owner sees this in the admin panel.
 */
export function OwnerMonetizationDashboard() {
  const { data: revenue, refetch: refetchRevenue } = useFetch<RevenueData>('/api/revenue');
  const { data: withdrawalData, refetch: refetchWithdrawals } = useFetch<{ withdrawals: Withdrawal[] }>('/api/withdrawals');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('paypal');
  const [payoutDetail, setPayoutDetail] = useState('');
  const [busy, setBusy] = useState(false);

  if (!revenue) return <div className="h-48 animate-pulse rounded-xl bg-muted" />;

  const withdrawals = withdrawalData?.withdrawals ?? [];
  const withdrawnCents = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amountCents, 0);
  const pendingCents = withdrawals.filter((w) => w.status === 'pending' || w.status === 'approved').reduce((s, w) => s + w.amountCents, 0);
  const availableCents = revenue.totalRevenueCents - withdrawnCents - pendingCents;
  const MIN_WITHDRAWAL = 500; // $5.00

  async function requestWithdrawal() {
    const amountCents = Math.round(Number(amount) * 100);
    if (!amountCents || amountCents < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL)}`);
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
      toast.success('Withdrawal request submitted! Processing within 3-5 business days.');
      setWithdrawOpen(false);
      setAmount(''); setPayoutDetail('');
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
            <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
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
      <div className="flex items-center justify-between rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 to-card p-4">
        <div>
          <p className="text-sm font-bold">Withdraw Your Earnings</p>
          <p className="text-xs text-muted-foreground">
            Available: <span className="font-semibold text-emerald-500">{formatMoney(availableCents)}</span>
            {' · '}Min: {formatMoney(MIN_WITHDRAWAL)}
            {' · '}Processed in 3-5 business days
          </p>
        </div>
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
                <p className="text-2xl font-extrabold text-emerald-500">{formatMoney(availableCents)}</p>
                <p className="text-[10px] text-muted-foreground mt-1">From: Ad impressions, clicks, affiliate, donations, PPV</p>
              </div>
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input type="number" min={MIN_WITHDRAWAL / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min $${MIN_WITHDRAWAL / 100}`} />
              </div>
              <div className="space-y-2">
                <Label>Payout Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Crypto (USDT/BTC)</SelectItem>
                    <SelectItem value="gift_card">Gift Card (Amazon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{method === 'paypal' ? 'PayPal Email' : method === 'bank_transfer' ? 'Bank Account Number' : method === 'crypto' ? 'Crypto Wallet Address' : 'Gift Card Email'}</Label>
                <Input value={payoutDetail} onChange={(e) => setPayoutDetail(e.target.value)} placeholder={method === 'paypal' ? 'you@email.com' : method === 'crypto' ? 'Wallet address' : 'Account/email'} />
              </div>
              <p className="rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
                Earnings come from website traffic: ad impressions (${(revenue.totalImpressions * 0.001).toFixed(2)} CPM), clicks, affiliate conversions, donations, and PPV event purchases.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={requestWithdrawal} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                Request Withdrawal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  <div className="flex-1">
                    <p className="text-sm font-bold">{formatMoney(w.amountCents)}</p>
                    <p className="text-xs text-muted-foreground">{w.method} · {new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={w.status === 'paid' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
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
