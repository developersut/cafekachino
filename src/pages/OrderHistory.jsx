import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  DollarSign, 
  Eye,
  ArrowRight,
  ChevronRight,
  TrendingDown,
  RotateCcw,
  AlertCircle,
  X,
  AlertTriangle,
  Search,
  ShieldCheck,
  Printer,
  Home,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { useKachinoStore } from '../store/useKachinoStore';
import { exportToCSV } from '../utils/exportUtils';
import Receipt from '../components/Receipt';

const OrderHistory = () => {
  const { sales = [], voidSale, user, settings } = useKachinoStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const isAdmin = user?.role === 'admin';
  const staffList = useKachinoStore.getState().staff;

  const handleVoidConfirm = () => {
    if (selectedSale) {
      voidSale(selectedSale.id);
      toast.success('Transaction voided successfully');
      setSelectedSale(null);
    }
  };

  const handleExport = () => {
    exportToCSV(sales, "Kachino_Sales_History");
    toast.success("Sales history exported to CSV");
  };

  const handleFiscalExport = () => {
    // Basic implementation of fiscal export using local sales
    const denormalized = sales.flatMap(sale => 
      sale.items.map(item => ({
        OrderID: sale.id,
        Timestamp: sale.timestamp,
        Staff: sale.processedBy,
        Status: sale.status,
        Item: item.name,
        Price: item.price,
        Qty: item.quantity,
        Subtotal: (item.price * item.quantity).toFixed(2),
        Tax: sale.tax?.toFixed(2) || "0.00",
        Total: sale.total.toFixed(2)
      }))
    );
    exportToCSV(denormalized, "Kachino_Fiscal_Audit");
    toast.success("Fiscal Audit report generated");
  };
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.toString().includes(searchQuery) || 
                         sale.processedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || sale.status === statusFilter;
    const matchesPayment = paymentFilter === "All" || 
                          (sale.paymentMethod && sale.paymentMethod.toLowerCase() === paymentFilter.toLowerCase());
    const matchesStaff = staffFilter === "All" || sale.processedBy === staffFilter;
    
    let matchesDate = true;
    const saleDate = parseISO(sale.timestamp);
    if (dateRange.start) {
      matchesDate = matchesDate && saleDate >= startOfDay(parseISO(dateRange.start));
    }
    if (dateRange.end) {
      matchesDate = matchesDate && saleDate <= endOfDay(parseISO(dateRange.end));
    }

    return matchesSearch && matchesStatus && matchesDate && matchesPayment && matchesStaff;
  });

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="header-row" style={{ marginBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Transaction Audit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>High-trust auditing with voiding</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="tab" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              background: 'var(--accent-gold-soft)',
              border: '1px solid var(--glass-border-gold)',
              color: 'var(--accent-gold)',
              fontSize: '0.75rem',
              fontWeight: 700,
              boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)'
            }}
            onClick={handleFiscalExport}
          >
            <ShieldCheck size={14} /> FISCAL AUDIT
          </button>
          <button 
            className="tab" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '10px 18px', 
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-white)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
            onClick={handleExport}
          >
            <ShoppingBag size={14} /> SALES CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <div className="search-container" style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by ID or Staff name..." 
            className="search-bar" 
            style={{ width: '100%', paddingLeft: '45px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '5px 15px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
          <Calendar size={18} color="var(--accent-gold)" />
          <input 
            type="date" 
            className="search-bar" 
            style={{ border: 'none', background: 'transparent', padding: '5px', fontSize: '0.85rem' }} 
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input 
            type="date" 
            className="search-bar" 
            style={{ border: 'none', background: 'transparent', padding: '5px', fontSize: '0.85rem' }} 
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
          {(dateRange.start || dateRange.end) && (
            <button 
              onClick={() => setDateRange({ start: '', end: '' })}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '5px' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select 
          className="search-bar" 
          style={{ 
            width: '150px', 
            color: 'var(--accent-gold)', 
            background: 'var(--bg-surface)',
            fontWeight: '600',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '12px',
            border: '1px solid var(--glass-border)'
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All" style={{ background: 'var(--bg-surface)' }}>All Status</option>
          <option value="completed" style={{ background: 'var(--bg-surface)' }}>Completed</option>
          <option value="voided" style={{ background: 'var(--bg-surface)' }}>Voided</option>
        </select>

        <select 
          className="search-bar" 
          style={{ width: '130px', background: 'var(--bg-surface)', fontSize: '0.75rem' }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="All">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>

        <select 
          className="search-bar" 
          style={{ width: '130px', background: 'var(--bg-surface)', fontSize: '0.75rem' }}
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
        >
          <option value="All">All Staff</option>
          {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div className="table-container" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        borderRadius: '18px', 
        border: '1px solid var(--glass-border)' 
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 15px' }}>Ref #</th>
                <th style={{ padding: '12px 15px' }}>Date & Time</th>
                <th style={{ padding: '12px 15px' }}>Items</th>
                <th style={{ padding: '12px 15px' }}>Total</th>
                <th style={{ padding: '12px 15px' }}>Status</th>
                <th style={{ padding: '12px 15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredSales].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map((sale, index) => (
                <motion.tr 
                  key={sale.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                  style={{ 
                    borderBottom: '1px solid var(--glass-border)', 
                    background: sale.status === 'voided' ? 'rgba(248, 113, 113, 0.05)' : 'transparent',
                    opacity: sale.status === 'voided' ? 0.7 : 1
                  }}
                >
                  <td style={{ padding: '10px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    #{sale.id.toString().slice(-6)}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.9rem' }}>{format(parseISO(sale.timestamp), 'MMM dd')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{format(parseISO(sale.timestamp), 'HH:mm')}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {sale.diningMode === 'dinein' ? <Home size={12} /> : <ShoppingBag size={12} />}
                      {sale.items.length} {sale.diningMode === 'dinein' ? `Dine-in (T#${sale.tableNumber})` : 'Take-away'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {sale.processedBy}</div>
                  </td>
                  <td style={{ padding: '10px 20px', fontWeight: 'bold', color: sale.status === 'voided' ? 'var(--text-muted)' : 'var(--accent-gold)' }}>
                    {settings?.currencySymbol || '$'}{sale.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '4px 10px', 
                      borderRadius: '10px', 
                      fontWeight: 'bold',
                      background: sale.status === 'voided' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                      color: sale.status === 'voided' ? '#f87171' : '#4ade80'
                    }}>
                      {sale.status?.toUpperCase() || 'COMPLETED'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="tab"
                        style={{ 
                          padding: '6px 10px', 
                          fontSize: '11px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: '#f87171',
                          borderColor: 'rgba(248, 113, 113, 0.2)'
                        }}
                        disabled={sale.status === 'voided'}
                      >
                        <RotateCcw size={14} /> Void
                      </button>
                      <button 
                        onClick={() => setShowReceiptModal(sale)}
                        className="tab"
                        style={{ 
                          padding: '6px 10px', 
                          fontSize: '11px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          color: 'var(--accent-gold)',
                          borderColor: 'var(--glass-border-gold)'
                        }}
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    </div>
                    {sale.status === 'voided' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        <AlertCircle size={12} /> Stock Returned
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredSales.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 40px', color: 'var(--text-muted)' }}>
              <TrendingDown size={50} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>No transactions found</div>
              <p style={{ fontSize: '0.9rem' }}>V2.0 Resilience System Online.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="menu-card" 
              style={{ width: '400px', padding: '30px', textAlign: 'center' }}
            >
              <div style={{ background: 'rgba(248, 113, 113, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <AlertTriangle size={30} color="#f87171" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Void Transaction?</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '25px' }}>
                Order <strong>#{selectedSale.id.toString().slice(-6)}</strong> for <strong>{settings?.currencySymbol || '$'}{selectedSale.total.toFixed(2)}</strong> will be marked as voided and stock will be returned to inventory. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  className="tab" 
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setSelectedSale(null)}
                >
                  Cancel
                </button>
                <button 
                  className="pay-button" 
                  style={{ flex: 1, padding: '12px', background: '#f87171', color: 'white' }}
                  onClick={handleVoidConfirm}
                >
                  Void Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal (Enterprise Feature) */}
      <AnimatePresence>
        {showReceiptModal && (
           <div className="modal-overlay" style={{ zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="modal-content"
                style={{ position: 'relative', maxHeight: '95vh', overflowY: 'auto', borderRadius: '15px', padding: 0 }}
              >
                 <button 
                    onClick={() => setShowReceiptModal(null)}
                    style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                 >
                   <X size={16} />
                 </button>
                 <Receipt order={showReceiptModal} />
                 <div style={{ background: 'white', padding: '0 20px 20px', textAlign: 'center', borderRadius: '0 0 15px 15px' }}>
                    <button 
                      className="pay-button" 
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                      onClick={() => {
                         useKachinoStore.getState().setPrintOrder(showReceiptModal);
                         setTimeout(() => {
                           window.print();
                           useKachinoStore.getState().setPrintOrder(null);
                         }, 500);
                      }}
                    >
                      <Printer size={18} /> Re-print Official Receipt
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderHistory;
