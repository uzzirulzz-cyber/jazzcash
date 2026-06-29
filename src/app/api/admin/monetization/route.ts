import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/monetization — full monetization dashboard data
export async function GET() {
  // Revenue by source
  const [adRev, affRev, donRev, ppvRev, subRev] = await Promise.all([
    db.revenueDaily.aggregate({ where: { source: { in: ['ad_impression', 'ad_click'] } }, _sum: { amountCents: true }, _count: true }),
    db.revenueDaily.aggregate({ where: { source: { in: ['affiliate_click', 'affiliate_conversion'] } }, _sum: { amountCents: true }, _count: true }),
    db.revenueDaily.aggregate({ where: { source: 'donation' }, _sum: { amountCents: true }, _count: true }),
    db.revenueDaily.aggregate({ where: { source: 'ppv' }, _sum: { amountCents: true }, _count: true }),
    db.revenueDaily.aggregate({ where: { source: 'subscription' }, _sum: { amountCents: true }, _count: true }),
  ]);

  const totalRevenue = (adRev._sum.amountCents ?? 0) + (affRev._sum.amountCents ?? 0) + (donRev._sum.amountCents ?? 0) + (ppvRev._sum.amountCents ?? 0) + (subRev._sum.amountCents ?? 0);

  // Today's revenue
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = await db.revenueDaily.findMany({ where: { date: today } });
  const todayRevenue = todayRows.reduce((s, r) => s + r.amountCents, 0);

  // Yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayRows = await db.revenueDaily.findMany({ where: { date: yesterday } });
  const yesterdayRevenue = yesterdayRows.reduce((s, r) => s + r.amountCents, 0);

  // This month
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthRows = await db.revenueDaily.findMany({ where: { date: { gte: monthStart.toISOString().slice(0, 10) } } });
  const monthRevenue = monthRows.reduce((s, r) => s + r.amountCents, 0);

  // Traffic stats
  const [pageViews, activeUsers, totalUsers] = await Promise.all([
    db.trafficEvent.count({ where: { kind: 'page_view' } }),
    db.trafficEvent.count({ where: { kind: 'page_view', createdAt: { gte: new Date(Date.now() - 3600000) } } }),
    db.user.count(),
  ]);

  // Active subscriptions
  const activeSubs = await db.subscription.count({ where: { status: 'active' } });

  // Withdrawals
  const withdrawals = await db.withdrawalRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  const totalWithdrawn = withdrawals.filter(w => w.status === 'paid').reduce((s, w) => s + w.amountCents, 0);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amountCents, 0);

  // Products + coupons + memberships
  const [productCount, couponCount, membershipCount] = await Promise.all([
    db.product.count({ where: { active: true } }),
    db.coupon.count({ where: { active: true } }),
    db.membershipPlan.count({ where: { active: true } }),
  ]);

  // Revenue by source breakdown
  const revenueBySource = [
    { source: 'Advertising', amount: adRev._sum.amountCents ?? 0, count: adRev._count, pct: 0 },
    { source: 'Affiliate', amount: affRev._sum.amountCents ?? 0, count: affRev._count, pct: 0 },
    { source: 'Donations', amount: donRev._sum.amountCents ?? 0, count: donRev._count, pct: 0 },
    { source: 'PPV Events', amount: ppvRev._sum.amountCents ?? 0, count: ppvRev._count, pct: 0 },
    { source: 'Subscriptions', amount: subRev._sum.amountCents ?? 0, count: subRev._count, pct: 0 },
  ].map(r => ({ ...r, pct: totalRevenue > 0 ? Math.round((r.amount / totalRevenue) * 100) : 0 }));

  // AI insights (simulated based on real data)
  const rpm = pageViews > 0 ? Math.round((totalRevenue / pageViews) * 1000) : 0;
  const conversionRate = totalUsers > 0 ? Math.round((activeSubs / totalUsers) * 1000) / 10 : 0;
  const avgOrderValue = ppvRev._count > 0 ? Math.round((ppvRev._sum.amountCents ?? 0) / ppvRev._count) : 0;
  const churnRate = Math.max(0, 5 - Math.min(5, activeSubs / 10));
  const dailyGrowth = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;

  const aiInsights = [
    { type: 'opportunity', title: 'Increase ad frequency', desc: `Current RPM: $${(rpm / 100).toFixed(2)}. Adding 1 more ad slot per page could increase RPM by 15-25%.`, impact: '+$2-5 RPM', priority: 'high' },
    { type: 'warning', title: 'Churn risk detected', desc: `${churnRate.toFixed(1)}% estimated churn rate. Offer annual plans at 20% discount to reduce churn.`, impact: '-30% churn', priority: 'medium' },
    { type: 'opportunity', title: 'Upsell PPV events', desc: `${ppvRev._count} PPV purchases. Promote upcoming WrestleMania ($29.99) to active users.`, impact: '+$500/mo', priority: 'high' },
    { type: 'info', title: 'Affiliate optimization', desc: `${affRev._count} affiliate clicks but $${((affRev._sum.amountCents ?? 0) / 100).toFixed(2)} revenue. Move betting offers to top position for 3x CTR.`, impact: '+$1.50 RPM', priority: 'medium' },
    { type: 'opportunity', title: 'Launch premium membership', desc: `${activeSubs} active subscribers. Add a $9.99/mo Premium tier for ad-free + 4K streaming.`, impact: `+$${Math.round(activeSubs * 999 / 100)}/mo potential`, priority: 'high' },
    { type: 'info', title: 'Geographic expansion', desc: `Top traffic source generating $${(rpm / 100).toFixed(2)}/1K views. Target India/Pakistan cricket audience for 2x traffic boost.`, impact: '+10K views', priority: 'low' },
  ];

  return NextResponse.json({
    // Real-time revenue
    totalRevenueCents: totalRevenue,
    todayRevenueCents: todayRevenue,
    yesterdayRevenueCents: yesterdayRevenue,
    monthRevenueCents: monthRevenue,
    dailyGrowth,
    availableToWithdraw: totalRevenue - totalWithdrawn - pendingWithdrawals,
    totalWithdrawn,
    pendingWithdrawals,
    // Traffic
    pageViews,
    activeUsers,
    totalUsers,
    rpm,
    // Subscriptions
    activeSubs,
    conversionRate,
    avgOrderValue,
    churnRate,
    // Revenue breakdown
    revenueBySource,
    // Counts
    productCount,
    couponCount,
    membershipCount,
    // AI
    aiInsights,
    // Recent withdrawals
    recentWithdrawals: withdrawals.slice(0, 5).map(w => ({
      id: w.id,
      amountCents: w.amountCents,
      method: w.method,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
    })),
  });
}
