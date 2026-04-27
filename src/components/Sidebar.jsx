import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Coffee, 
  LayoutDashboard, 
  LogOut,
  History,
  Store,
  Tag,
  CreditCard,
  Users,
  UserCheck,
  Sliders,
  Package,
  X,
  Map,
  Shield,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useKachinoStore } from '../store/useKachinoStore';

const NavItem = ({ to, icon: Icon, label, title, setSidebarOpen, activeTablesCount }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    onClick={() => setSidebarOpen(false)}
  >
    <motion.div className="nav-item-inner" whileHover={{ x: 5 }} style={{ position: 'relative' }}>
      <Icon size={15} />
      <span className="nav-label">{label}</span>
      {label === "Table" && activeTablesCount > 0 && (
         <div style={{ 
            marginLeft: 'auto', 
            background: 'var(--accent-gold)',
            color: 'black',
            fontSize: '9px',
            fontWeight: 900,
            padding: '1px 5px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(212, 172, 55, 0.4)'
         }}>
           {activeTablesCount}
         </div>
      )}
    </motion.div>
  </NavLink>
);

const Sidebar = ({ user, logout }) => {
  const isAdmin = user?.role === 'admin';
  const { isSidebarOpen, setSidebarOpen, settings, tables } = useKachinoStore();
  const store = settings?.storeInfo || {};
  const activeTablesCount = tables.filter(t => t.status === 'occupied').length;
  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '8px 10px', marginBottom: '6px' }}>
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {store.logoUrl ? (
               <img src={store.logoUrl} alt="Logo" style={{ width: '22px', height: '22px', borderRadius: '4px' }} />
            ) : (
               <Coffee size={24} color="var(--accent-gold)" />
            )}
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>{store.name || 'KACHINO'}</span>
          </div>
          <button className="mobile-only close-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="nav-items">
          <NavItem to="/" icon={Store} label="POS Terminal" title="POS Terminal" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
          <NavItem to="/tables" icon={Map} label="Table" title="Dine-in Floor Plan" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
          <NavItem to="/history" icon={History} label="Order History" title="Order History" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
          <NavItem to="/admin/customers" icon={Users} label="Customers" title="CRM & Loyalty" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />

          {isAdmin && (
            <div className="admin-section">
              <div className="section-label">Management</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" title="Analytics" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
              <NavItem to="/admin/inventory" icon={Package} label="Inventory" title="Menu & Categories" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
              <NavItem to="/admin/staff" icon={UserCheck} label="Staff" title="Staff Management" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
              <NavItem to="/admin/expenses" icon={CreditCard} label="Expenses" title="Expenses" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
              <NavItem to="/admin/logs" icon={ClipboardList} label="System Logs" title="Audit Trail" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
              <NavItem to="/admin/settings" icon={Sliders} label="Settings" title="System Settings" setSidebarOpen={setSidebarOpen} activeTablesCount={activeTablesCount} />
            </div>
          )}
        </nav>

        <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--accent-gold)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
               <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{user?.role}</div>
            </div>
          </div>
          <button 
            className="nav-item" 
            style={{ width: '100%', color: '#f87171', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => { logout(); window.location.reload(); }}
          >
            <LogOut size={15} />
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600 }}>Exit Terminal</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
