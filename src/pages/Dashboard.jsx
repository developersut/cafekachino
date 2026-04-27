import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  AlertTriangle,
  Package,
  Award,
  PieChart as PieChartIcon,
  ShieldCheck,
  RefreshCw,
  Plus,
  Receipt,
  X
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useKachinoStore } from '../store/useKachinoStore';
import { toast } from 'sonner';

const Dashboard = () => {
  const { 
    sales = [], expenses = [], items = [], staff = [], auditLogs = [],
    expenseCategories = [],
    zReports = [],
    saveZReport,
    settings 
  } = useKachinoStore();

  const [isZReportModalOpen, setZReportModalOpen] = React.useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('daily'); // daily, weekly, monthly

  const zReportData = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySales = sales.filter(s => s.status !== 'voided' && format(parseISO(s.timestamp), 'yyyy-MM-dd') === todayStr);
    
    const cashSales = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const cardSales = todaySales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
    const otherSales = todaySales.filter(s => s.paymentMethod !== 'cash' && s.paymentMethod !== 'card').reduce((sum, s) => sum + s.total, 0);
    const totalTodayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    return { cashSales, cardSales, otherSales, totalTodayRevenue, count: todaySales.length };
  }, [sales]);

  const handleCloseRegister = async () => {
    const success = await saveZReport(zReportData);
    if (success) {
      setZReportModalOpen(false);
      toast.success('Register Closed - Shift record synchronized');
    }
  };

  // 1. Filter out voided sales for analytics
  const validSales = useMemo(() => sales.filter(s => s.status !== 'voided'), [sales]);

  // 1.5 Filter sales based on current timeframe
  const currentPeriodSales = useMemo(() => {
    const now = new Date();
    let start;
    if (timeframe === 'daily') start = startOfDay(now);
    else if (timeframe === 'weekly') start = startOfWeek(now);
    else start = startOfMonth(now);
    
    return validSales.filter(s => {
      const sd = parseISO(s.timestamp);
      return sd >= start && sd <= now;
    });
  }, [validSales, timeframe]);

  // 2. Dynamic Inventory Alerts
  const inventoryAlerts = useMemo(() => {
    return items.filter(item => item.stock <= (item.lowStockThreshold || 10)).sort((a,b) => a.stock - b.stock);
  }, [items]);

  // 1.6 Filter expenses based on current timeframe
  const currentPeriodExpenses = useMemo(() => {
    const now = new Date();
    let start;
    if (timeframe === 'daily') start = startOfDay(now);
    else if (timeframe === 'weekly') start = startOfWeek(now);
    else start = startOfMonth(now);
    
    return expenses.filter(e => {
      const ed = parseISO(e.timestamp || e.date);
      return ed >= start && ed <= now;
    });
  }, [expenses, timeframe]);

  // 3. Core Business Stats (Period-based)
  const stats = useMemo(() => {
    const totalRevenue = currentPeriodSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = currentPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalOrders = currentPeriodSales.length;
    const netProfit = totalRevenue - totalExpenses;

    return { totalRevenue, totalExpenses, totalOrders, netProfit };
  }, [currentPeriodSales, currentPeriodExpenses]);

  // 4. Trend Chart Data (Unified Revenue & Expenses)
  const chartData = useMemo(() => {
    const periods = timeframe === 'daily' ? 7 : (timeframe === 'weekly' ? 4 : 6);
    
    return [...Array(periods)].map((_, i) => {
      let d, dayStr, start, end;
      const now = new Date();

      if (timeframe === 'daily') {
        d = subDays(now, i);
        dayStr = format(d, 'MMM dd');
        start = startOfDay(d);
        end = endOfDay(d);
      } else if (timeframe === 'weekly') {
        d = subWeeks(now, i);
        start = startOfWeek(d);
        end = endOfWeek(d);
        dayStr = `${format(start, 'MMM dd')} - ${format(end, 'dd')}`;
      } else {
        d = subMonths(now, i);
        start = startOfMonth(d);
        end = endOfMonth(d);
        dayStr = format(d, 'MMM yyyy');
      }

      const periodSales = validSales.filter(s => {
        const sd = parseISO(s.timestamp);
        return sd >= start && sd <= end;
      });
      const periodExpenses = expenses.filter(e => {
        const ed = parseISO(e.timestamp || e.date);
        return ed >= start && ed <= end;
      });

      const revenue = periodSales.reduce((sum, s) => sum + s.total, 0);
      const expense = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      return { name: dayStr, revenue, expense };
    }).reverse();
  }, [validSales, expenses, timeframe]);

  // 5. Staff Performance Mapping
  const staffPerformance = useMemo(() => {
    const performance = staff.map(s => {
      const staffSales = currentPeriodSales.filter(sale => sale.processedBy === s.name);
      return {
        name: s.name,
        orders: staffSales.length,
        revenue: staffSales.reduce((sum, sale) => sum + sale.total, 0)
      };
    }).sort((a, b) => b.revenue - a.revenue);
    return performance;
  }, [currentPeriodSales, staff]);
  // 6. Top Selling Categories Distribution
  const categoryData = useMemo(() => {
    const distro = currentPeriodSales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const cat = item.category || 'Other';
        acc[cat] = (acc[cat] || 0) + (item.price * item.quantity);
      });
      return acc;
    }, {});
    return Object.entries(distro)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [currentPeriodSales]);


  // 8. Top Selling Products (Velocity)
  const productPerformance = useMemo(() => {
    const products = currentPeriodSales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        if (!acc[item.name]) acc[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        acc[item.name].quantity += item.quantity;
        acc[item.name].revenue += item.price * item.quantity;
      });
      return acc;
    }, {});
    return Object.values(products).sort((a,b) => b.quantity - a.quantity).slice(0, 5);
  }, [currentPeriodSales]);

  // 9. Audit Log Filtering
  const [auditFilter] = React.useState('All');

  const COLORS = ['#d4af37', '#e5c14d', '#f4d03f', '#a67c00', '#3b82f6', '#10b981'];

  const cardData = [
    { title: "Total Revenue", value: `${settings?.currencySymbol || '$'}${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: DollarSign, color: "#d4af37", trend: 12 },
    { title: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingBag, color: "#3b82f6", trend: 8 },
    { title: "Total Expenses", value: `${settings?.currencySymbol || '$'}${stats.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "#f87171", trend: -5 },
    { title: "Net Profit", value: `${settings?.currencySymbol || '$'}${stats.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "#10b981", trend: 15 }
  ];

  return (
    <div className="main-content">
      <div className="header-row" style={{ marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Business Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Audit logs and operational resilience</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '10px', marginRight: '10px', border: '1px solid var(--glass-border)' }}>
            {['daily', 'weekly', 'monthly'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  borderRadius: '8px',
                  border: 'none',
                  background: timeframe === t ? 'var(--accent-gold)' : 'transparent',
                  color: timeframe === t ? 'black' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: timeframe === t ? '700' : '500'
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <button 
            className="pay-button" 
            style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--accent-gold)', fontSize: 'var(--font-sm)' }}
            onClick={() => setZReportModalOpen(true)}
          >
            <ShieldCheck size={18} />
            Close Register
          </button>
          <button 
            className="pay-button" 
            style={{ 
              width: 'auto', 
              padding: '10px 20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'rgba(212, 175, 55, 0.1)', 
              border: '1px solid var(--accent-gold)', 
              color: 'var(--accent-gold)',
              fontSize: 'var(--font-xs)',
              fontWeight: 700
            }}
            onClick={() => setHistoryModalOpen(true)}
          >
            <RefreshCw size={18} />
            View History
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '15px', maxWidth: '1400px' }}>
        {cardData.map((card) => (
          <div key={card.title} className="menu-card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: `${card.color}15`, padding: '8px', borderRadius: '10px', color: card.color }}>
              <card.icon size={18} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>{card.title}</div>
              <div style={{ fontSize: 'var(--font-body)', fontWeight: 'bold' }}>{card.value}</div>
              {card.trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: card.trend > 0 ? '#4ade80' : '#f87171', fontSize: '9px', marginTop: '1px' }}>
                  {card.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {/* Revenue Trends */}
        <div className="menu-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--accent-gold)" /> Performance Trends
            </h3>
          </div>
          <div style={{ width: '100%', height: '240px', minHeight: '240px' }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-gold)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-gold)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${settings?.currencySymbol || '$'}${value}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: 'var(--font-xs)' }}
                  itemStyle={{ color: 'var(--accent-gold)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent-gold)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Alerts with Quick Action */}
        <div className="menu-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#fbbf24" /> Inventory Resilience
            </h3>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>{inventoryAlerts.length} Critical</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inventoryAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                <ShieldCheck size={30} style={{ opacity: 0.2, marginBottom: '10px' }} />
                <div>All items well stocked</div>
              </div>
            ) : (
              inventoryAlerts.slice(0, 3).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: item.stock <= 0 ? '#f87171' : '#fbbf24' }}>{item.stock} remaining</div>
                  </div>
                  <button 
                    onClick={() => restockItem(item.id, 50)} 
                    style={{ background: 'var(--accent-gold-soft)', border: 'none', color: 'var(--accent-gold)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    <Plus size={14} /> +50
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Product Categories Distribution */}
        <div className="menu-card" style={{ padding: '16px' }}>
           <h3 style={{ fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <PieChartIcon size={16} color="var(--accent-gold)" /> Revenue Mix
          </h3>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        {/* Staff Performance (NEW) */}
        <div className="menu-card" style={{ padding: '16px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Users size={16} color="var(--accent-gold)" /> Staff Leaderboard
          </h3>
          <div style={{ width: '100%', height: '180px' }}>
            <ResponsiveContainer>
              <BarChart data={staffPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} width={70} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '10px' }}
                />
                <Bar dataKey="revenue" fill="var(--accent-gold)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Velocity (NEW) */}
        <div className="menu-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 600, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Package size={18} color="var(--accent-gold)" /> Top Products
          </h3>
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer>
              <BarChart data={productPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '12px', fontSize: '10px' }}
                />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Z-Report Modal */}
      {isZReportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Z-Report & Settlement</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)', marginBottom: '20px' }}>Verify drawer totals before closing shift.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cash Sales</span>
                  <span style={{ fontWeight: 600 }}>{settings.currencySymbol}{zReportData.cashSales.toFixed(2)}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Card Sales</span>
                  <span style={{ fontWeight: 600 }}>{settings.currencySymbol}{zReportData.cardSales.toFixed(2)}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', borderBottom: '1px dashed var(--glass-border)', paddingBottom: '15px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Other Logged</span>
                  <span style={{ fontWeight: 600 }}>{settings.currencySymbol}{zReportData.otherSales.toFixed(2)}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800 }}>
                  <span>Total System Intake</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{settings.currencySymbol}{zReportData.totalTodayRevenue.toFixed(2)}</span>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setZReportModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white' }}>Cancel</button>
                <button 
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head><title>Z-Report - Settlement</title></head>
                        <body style="font-family: monospace; padding: 30px; color: #111;">
                          <h1 style="text-align: center; margin-bottom: 5px;">CAFE KACHINO</h1>
                          <p style="text-align: center; margin-top: 0; font-size: 12px;">READ • SIP • RETREAT</p>
                          <hr style="border: 0; border-top: 1px dashed #ccc;"/>
                          <h2 style="text-align: center;">SHIFT SETTLEMENT</h2>
                          <div style="margin: 20px 0;">
                            <p>Date: ${format(new Date(), 'PPP p')}</p>
                            <p>Status: UNFINALIZED (Review Copy)</p>
                          </div>
                          <hr style="border: 0; border-top: 1px dashed #ccc;"/>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Cash Sales:</span><span>${settings.currencySymbol}${zReportData.cashSales.toFixed(2)}</span></div>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Card Sales:</span><span>${settings.currencySymbol}${zReportData.cardSales.toFixed(2)}</span></div>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Other:</span><span>${settings.currencySymbol}${zReportData.otherSales.toFixed(2)}</span></div>
                          <hr style="border: 0; border-top: 2px solid #000;"/>
                          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.4em; margin: 15px 0;"><span>TOTAL:</span><span>${settings.currencySymbol}${zReportData.totalTodayRevenue.toFixed(2)}</span></div>
                          <hr style="border: 0; border-top: 2px solid #000;"/>
                          <p style="text-align: center; margin-top: 50px; font-size: 10px;">Audit Copy - Shift Reconciliation</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }} 
                  style={{ flex: 1, padding: '12px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '12px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Receipt size={18} /> Print Report
                </button>
              </div>
              <button onClick={handleCloseRegister} className="pay-button" style={{ width: '100%' }}>Finalize & Close Shift</button>
            </div>
          </div>
        </div>
      )}

      {/* Z-Report History Modal */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Settlement History</h2>
              <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {zReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No past settlements found</div>
              ) : (
                zReports.map(report => (
                  <div key={report.id} className="menu-card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{format(parseISO(report.timestamp), 'PPP p')}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Settled by: {report.settledBy} • {report.count} Orders</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{settings.currencySymbol}{report.totalTodayRevenue.toFixed(2)}</div>
                      <button 
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(`
                      <html>
                        <head><title>Z-Report - ${report.timestamp}</title></head>
                        <body style="font-family: monospace; padding: 30px; color: #111;">
                          <h1 style="text-align: center; margin-bottom: 5px;">CAFE KACHINO</h1>
                          <p style="text-align: center; margin-top: 0; font-size: 12px;">READ • SIP • RETREAT</p>
                          <hr style="border: 0; border-top: 1px dashed #ccc;"/>
                          <h2 style="text-align: center;">SHIFT SETTLEMENT</h2>
                          <div style="margin: 20px 0;">
                            <p>Date: ${format(parseISO(report.timestamp), 'PPP p')}</p>
                            <p>Manager: ${report.settledBy}</p>
                          </div>
                          <hr style="border: 0; border-top: 1px dashed #ccc;"/>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Cash Sales:</span><span>${settings.currencySymbol}${report.cashSales.toFixed(2)}</span></div>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Card Sales:</span><span>${settings.currencySymbol}${report.cardSales.toFixed(2)}</span></div>
                          <div style="display: flex; justify-content: space-between; margin: 10px 0;"><span>Other:</span><span>${settings.currencySymbol}${report.otherSales.toFixed(2)}</span></div>
                          <hr style="border: 0; border-top: 2px solid #000;"/>
                          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.4em; margin: 15px 0;"><span>TOTAL:</span><span>${settings.currencySymbol}${report.totalTodayRevenue.toFixed(2)}</span></div>
                          <hr style="border: 0; border-top: 2px solid #000;"/>
                          <p style="text-align: center; margin-top: 50px; font-size: 10px;">Audit Copy - Past Record</p>
                        </body>
                      </html>
                    `);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        style={{ fontSize: '10px', color: 'var(--accent-gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Print Copy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
