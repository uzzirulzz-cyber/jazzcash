'use client';

import { useState } from 'react';
import {
  DollarSign, TrendingUp, Eye, Users, Activity, Gauge, Crown, Zap, Brain,
  AlertTriangle, Sparkles, ArrowUp, ArrowDown, Bitcoin, CreditCard, Gift,
  Tag, Package, Star, Target, ShieldCheck, Clock, Check, ChevronRight,
} from 'lucide-react';
import { useFetch, apiAction } from '@/hooks/use-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { OwnerMonetizationDashboard } from './owner-monetization';

const PIE_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

interface MonetizationData {
  totalRevenueCents: number;
  todayRevenueCents: number;
  yesterdayRevenueCents: number;
  monthRevenueCents: number;
  dailyGrowth: number;
  availableToWithdraw: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  pageViews: number;
  activeUsers: number;
  totalUsers: number;
  rpm: number;
  activeSubs: number;
  conversionRate: number;
  avgOrderValue: number;
  churnRate: number;
  revenueBySource: { source: string; amount: number; count: number; pct: number }[];
  productCount: number;
  couponCount: number;
  membershipCount: number;
  aiInsights: { type: string; title: string; desc: string; impact: string; priority: string }[];
  recentWithdrawals: { id: string; amountCents: number; method: string; status: string; createdAt: string }[];
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function AIMonetizationDashboard() {
  const { data, loading } = useFetch<MonetizationData>('/api/admin/monetization');

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Today', value: formatMoney(data.todayRevenueCents), icon: DollarSign, accent: 'text-emerald-500', change: data.dailyGrowth, changeLabel: 'vs yesterday' },
    { label: 'Yesterday', value: formatMoney(data.yesterdayRevenueCents), icon: Clock, accent: 'text-blue-500', change: 0, changeLabel: '' },
    { label: 'This Month', value: formatMoney(data.monthRevenueCents), icon: TrendingUp, accent: 'text-amber-500', change: 0, changeLabel: '' },
    { label: 'Total Revenue', value: formatMoney(data.totalRevenueCents), icon: Crown, accent: 'text-violet-500', change: 0, changeLabel: 'all time' },
    { label: 'RPM / 1K views', value: formatMoney(data.rpm), icon: Gauge, accent: 'text-rose-500', change: 0, changeLabel: `${data.pageViews} views` },
    { label: 'Active Users (1h)', value: data.activeUsers, icon: Users, accent: 'text-cyan-500', change: 0, changeLabel: `${data.totalUsers} total` },
    { label: 'Conversion Rate', value: `${data.conversionRate}%`, icon: Target, accent: 'text-emerald-500', change: 0, changeLabel: `${data.activeSubs} subs` },
    { label: 'Avg Order Value', value: formatMoney(data.avgOrderValue), icon: Activity, accent: 'text-amber-500', change: 0, changeLabel: 'PPV events' },
  ];

  const insightStyles: Record<string, { icon: React.ReactNode; cls: string }> = {
    opportunity: { icon: <Sparkles className="h-4 w-4" />, cls: 'border-emerald-500/30 bg-emerald-500/5' },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, cls: 'border-amber-500/30 bg-amber-500/5' },
    info: { icon: <Brain className="h-4 w-4" />, cls: 'border-blue-500/30 bg-blue-500/5' },
  };

  const priorityStyles: Record<string, string> = {
    high: 'bg-red-500/20 text-red-500',
    medium: 'bg-amber-500/20 text-amber-500',
    low: 'bg-blue-500/20 text-blue-500',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-brand" />
        <h2 className="text-xl font-extrabold tracking-tight">AI Monetization Engine</h2>
        <Badge className="brand-bg gap-1"><Zap className="h-3 w-3" /> REAL-TIME</Badge>
        <Badge className="bg-violet-500/20 text-violet-500 gap-1"><Brain className="h-3 w-3" /> AI OPTIMIZED</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <c.icon className={cn('h-5 w-5', c.accent)} />
                {c.change !== 0 && (
                  <span className={cn('flex items-center gap-0.5 text-xs font-bold', c.change > 0 ? 'text-emerald-500' : 'text-red-500')}>
                    {c.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(c.change)}%
                  </span>
                )}
              </div>
              <p className="mt-2 text-xl font-extrabold">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              {c.changeLabel && <p className="text-[10px] text-muted-foreground/70">{c.changeLabel}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue by source */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4" /> Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueBySource} margin={{ left: -10, right: 10 }}>
                  <XAxis dataKey="source" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {data.revenueBySource.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Source breakdown */}
            <div className="mt-3 space-y-1.5">
              {data.revenueBySource.map((s, i) => (
                <div key={s.source} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1">{s.source}</span>
                  <span className="font-semibold">{formatMoney(s.amount)}</span>
                  <span className="text-xs text-muted-foreground">{s.pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.revenueBySource} dataKey="amount" nameKey="source" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {data.revenueBySource.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-violet-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-violet-500" /> AI Revenue Optimization Insights
            <Badge className="bg-violet-500/20 text-violet-500">AUTO-GENERATED</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.aiInsights.map((insight, i) => {
              const style = insightStyles[insight.type] || insightStyles.info;
              return (
                <div key={i} className={cn('rounded-xl border p-4', style.cls)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', style.cls)}>
                      {style.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{insight.title}</p>
                        <Badge className={cn('text-[9px]', priorityStyles[insight.priority])}>{insight.priority}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{insight.desc}</p>
                      <p className="mt-1.5 text-xs font-semibold text-emerald-500">Expected: {insight.impact}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Owner withdraw section */}
      <OwnerMonetizationDashboard />

      {/* Ecosystem stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Memberships */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Crown className="h-4 w-4 text-amber-500" /> Membership Plans</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">{data.membershipCount}</p>
            <p className="text-xs text-muted-foreground">Active plans</p>
            <p className="mt-1 text-sm text-emerald-500">{data.activeSubs} active subscribers</p>
            <Button variant="outline" size="sm" className="mt-2 w-full gap-1">Manage Plans <ChevronRight className="h-3 w-3" /></Button>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Package className="h-4 w-4 text-violet-500" /> Digital Marketplace</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">{data.productCount}</p>
            <p className="text-xs text-muted-foreground">Active products</p>
            <p className="mt-1 text-sm text-amber-500">IPTV packages, source code, templates</p>
            <Button variant="outline" size="sm" className="mt-2 w-full gap-1">Manage Products <ChevronRight className="h-3 w-3" /></Button>
          </CardContent>
        </Card>

        {/* Coupons */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-rose-500" /> Coupon Engine</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">{data.couponCount}</p>
            <p className="text-xs text-muted-foreground">Active coupons</p>
            <p className="mt-1 text-sm text-rose-500">WELCOME20, SPORTS50, BLACKFRIDAY…</p>
            <Button variant="outline" size="sm" className="mt-2 w-full gap-1">Manage Coupons <ChevronRight className="h-3 w-3" /></Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment gateways */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> Payment Gateways</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: 'Stripe', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-violet-500' },
              { name: 'PayPal', icon: <CreditCard className="h-4 w-4" />, status: 'connected', color: 'text-blue-500' },
              { name: 'Crypto (USDT)', icon: <Bitcoin className="h-4 w-4" />, status: 'connected', color: 'text-amber-500' },
              { name: 'Apple Pay', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-gray-500' },
              { name: 'Google Pay', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-emerald-500' },
              { name: 'Bank Transfer', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-blue-500' },
              { name: 'Paddle', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-rose-500' },
              { name: 'Lemon Squeezy', icon: <CreditCard className="h-4 w-4" />, status: 'ready', color: 'text-amber-500' },
            ].map((gw) => (
              <div key={gw.name} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                <span className={gw.color}>{gw.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{gw.name}</p>
                  <Badge variant={gw.status === 'connected' ? 'default' : 'secondary'} className="text-[8px]">
                    {gw.status === 'connected' ? '✓ Connected' : 'Ready to connect'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security + compliance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[
          { label: 'Secure Payments', icon: ShieldCheck, status: 'PCI DSS Best Practices' },
          { label: 'Fraud Detection', icon: AlertTriangle, status: 'AI-Powered Active' },
          { label: 'Rate Limiting', icon: Zap, status: '100 req/min/IP' },
          { label: 'Audit Logs', icon: Check, status: 'All Transactions Logged' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
            <s.icon className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
