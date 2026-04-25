import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Layout, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle,
  Coffee,
  ShoppingBag,
  Timer,
  ExternalLink
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useKachinoStore } from '../store/useKachinoStore';

const TableLayout = () => {
  const navigate = useNavigate();
  const { tables, loadFromTable, settings, toggleTableSession, setTablePaid } = useKachinoStore();
  const [now, setNow] = useState(new Date());

  // Update timers every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => ({
    total: tables.length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    available: tables.filter(t => t.status === 'available').length,
  }), [tables]);

  const handleTableClick = (table) => {
    loadFromTable(table.id);
    navigate('/'); // Navigate to POS
  };

  return (
    <div className="main-content">
      {/* Header Dashboard */}
      <div className="header-row" style={{ marginBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Table Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Manage active table sessions</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Occupied</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.occupied}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Available</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{stats.available}</div>
            </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '15px' 
      }}>
        {tables.map((table, index) => {
          const isOccupied = table.status === 'occupied';
          const itemsCount = table.currentOrder?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const balance = table.currentOrder?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
          const seatedTime = table.sessionStartTime ? differenceInMinutes(now, parseISO(table.sessionStartTime)) : 0;
          
          // Warning state for long durations without updates
          const isWarning = isOccupied && seatedTime > 45;

          return (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleTableClick(table)}
              className="menu-card"
              style={{
                padding: '0',
                overflow: 'hidden',
                cursor: 'pointer',
                borderColor: isOccupied ? (isWarning ? '#f87171' : 'var(--accent-gold)') : 'var(--glass-border)',
                background: isOccupied ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)',
                boxShadow: isOccupied ? '0 10px 30px rgba(212, 175, 55, 0.05)' : 'none',
                transition: 'all 0.3s ease'
              }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div style={{ 
                padding: '8px 12px', 
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isOccupied ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ 
                     width: '32px', 
                     height: '32px', 
                     borderRadius: '8px', 
                     background: isOccupied ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: isOccupied ? 'black' : 'white'
                   }}>
                     <Layout size={16} />
                   </div>
                   <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{table.label}</div>
                     <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                       {isOccupied ? 'Active' : 'Free'}
                     </div>
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm(`Are you sure you want to turn ${isOccupied ? 'OFF' : 'ON'} session for ${table.label}?`)) {
                        toggleTableSession(table.id); 
                      }
                    }}
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '15px', 
                      fontSize: '9px', 
                      fontWeight: 'bold', 
                      border: '1px solid var(--glass-border)',
                      background: isOccupied ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                      color: isOccupied ? 'black' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    {isOccupied ? 'OFF' : 'ON'}
                  </button>
                  {isOccupied && (
                    <motion.div 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: '10px', height: '10px', borderRadius: '50%', background: isWarning ? '#f87171' : '#4ade80' }}
                    />
                  )}
                </div>
              </div>

              <div style={{ padding: '14px' }}>
                {isOccupied ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <Timer size={12} /> Seated
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isWarning ? '#f87171' : 'white' }}>{seatedTime}m</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <Users size={12} /> Occupancy
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{table.guestCount || 0} / {table.capacity || 4}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <ShoppingBag size={12} /> Items
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{itemsCount}</div>
                    </div>
                    
                    <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bill</span>
                         <div 
                          onClick={(e) => { e.stopPropagation(); setTablePaid(table.id, !table.isPaid); }}
                          style={{ 
                            fontSize: '9px', 
                            fontWeight: 800, 
                            color: table.isPaid ? '#4ade80' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                         >
                           {table.isPaid ? <CheckCircle size={9} /> : <Clock size={9} />}
                           {table.isPaid ? 'PAID' : 'UNPAID'}
                         </div>
                       </div>
                       <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                         {settings.currencySymbol}{balance.toFixed(2)}
                       </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', opacity: 0.3 }}>
                    <Users size={32} style={{ marginBottom: '10px' }} />
                    <div style={{ fontSize: '0.85rem' }}>Ready for Guests</div>
                    <div style={{ fontSize: '0.65rem', marginTop: '4px' }}>Capacity: {table.capacity || 4} Seats</div>
                  </div>
                )}
              </div>

              <div style={{ 
                padding: '12px 20px', 
                background: 'rgba(255,255,255,0.02)', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                 <span>Click to Open POS</span>
                 <ExternalLink size={12} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
           <Coffee size={40} style={{ opacity: 0.1, marginBottom: '15px' }} />
           <h3>No Tables Configured</h3>
           <p style={{ color: 'var(--text-muted)' }}>Add tables in Admin Settings to start dine-in service.</p>
        </div>
      )}
    </div>
  );
};

export default TableLayout;
