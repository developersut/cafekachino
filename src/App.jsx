import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';
import AdminInventory from './pages/AdminInventory';
import AdminExpenses from './pages/AdminExpenses';
import AdminStaff from './pages/AdminStaff';
import OrderHistory from './pages/OrderHistory';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import AdminCustomers from './pages/AdminCustomers';
import TableLayout from './pages/TableLayout';
import RouteProgress from './components/RouteProgress';
import { Menu, ShoppingBag } from 'lucide-react';
import CommandPalette from './components/CommandPalette';
import { useKachinoStore } from './store/useKachinoStore';

function App() {
  const { 
    user, logout, 
    setSidebarOpen, toggleCart, cart,
    initializeCloudState,
    tables
  } = useKachinoStore();

  useEffect(() => {
    initializeCloudState();
  }, [initializeCloudState]);

  // Auto-Logout Implementation
  useEffect(() => {
    if (!user) return;

    let timeout;
    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
        window.location.reload();
      }, 5 * 60 * 1000); 
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  const isAdmin = user?.role === 'admin';
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Router>
      <RouteProgress />
      <CommandPalette />
      
      {!user ? (
        <Login />
      ) : (
        <div className="pos-container">
          <Sidebar user={user} logout={logout} />
          
          <div className="content-wrapper" style={{ flex: 1 }}>
            {/* Mobile Top Header (Premium Glass) */}
            <header className="mobile-header mobile-only" style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 1000, 
              background: 'rgba(8, 8, 8, 0.85)', 
              backdropFilter: 'blur(20px)',
              display: 'flex', 
              flexDirection: 'column', 
              borderBottom: '1px solid var(--glass-border)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', alignItems: 'center' }}>
                <div className="mobile-brand" style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>Cafe Kachino</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={toggleCart} className="icon-btn" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: 'white', position: 'relative', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={18} />
                    {cartItemCount > 0 && <span className="cart-badge-header" style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-gold)', color: 'black', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>{cartItemCount}</span>}
                  </button>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #d4af37, #f5d76e)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                    {user?.name?.charAt(0)}
                  </div>
                </div>
              </div>

              {/* Premium Horizontal Nav */}
              <nav style={{ 
                display: 'flex', 
                overflowX: 'auto', 
                padding: '0 15px 12px 15px', 
                gap: '8px', 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}>
                <NavLink to="/" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>POS Terminal</NavLink>
                <NavLink to="/tables" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Table
                  {tables.filter(t => t.status === 'occupied').length > 0 && (
                    <span style={{ background: 'var(--accent-gold)', color: 'black', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {tables.filter(t => t.status === 'occupied').length}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/admin/customers" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Customers</NavLink>
                <NavLink to="/history" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Order History</NavLink>
                {isAdmin && (
                  <>
                    <NavLink to="/dashboard" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/admin/inventory" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Inventory</NavLink>
                    <NavLink to="/admin/staff" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Staff</NavLink>
                    <NavLink to="/admin/expenses" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Expenses</NavLink>
                    <NavLink to="/admin/settings" className={({isActive}) => `mobile-nav-link ${isActive ? 'active' : ''}`}>Settings</NavLink>
                  </>
                )}
                <button onClick={() => { logout(); window.location.reload(); }} className="mobile-nav-link" style={{ color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.05)' }}>Logout</button>
              </nav>
            </header>

            <Routes>
              <Route path="/" element={<POS />} />
              <Route path="/tables" element={<TableLayout />} />
              
              {isAdmin && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin/inventory" element={<AdminInventory />} />
                  <Route path="/admin/expenses" element={<AdminExpenses />} />
                  <Route path="/admin/staff" element={<AdminStaff />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </>
              )}

              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/history" element={<OrderHistory />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
