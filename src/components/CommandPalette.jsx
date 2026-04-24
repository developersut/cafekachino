import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Store, History, Package, LayoutDashboard, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKachinoStore } from '../store/useKachinoStore';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { items, user } = useKachinoStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const actions = [
    { id: 'pos', name: 'Go to POS Terminal', icon: Store, path: '/', admin: false },
    { id: 'history', name: 'View Audit Logs', icon: History, path: '/history', admin: false },
    { id: 'inventory', name: 'Manage Inventory', icon: Package, path: '/admin/inventory', admin: true },
    { id: 'dashboard', name: 'View Analytics', icon: LayoutDashboard, path: '/dashboard', admin: true },
    { id: 'settings', name: 'System Settings', icon: Settings, path: '/admin/settings', admin: true },
  ];

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const filteredActions = actions.filter(a => 
    (!a.admin || isAdmin) && a.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            style={{ zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="command-palette"
            style={{
              position: 'fixed',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              maxWidth: '90vw',
              background: 'var(--bg-surface)',
              borderRadius: '24px',
              border: '1px solid var(--glass-border-gold)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 10000,
              padding: '10px'
            }}
          >
            <div style={{ position: 'relative', padding: '15px' }}>
              <Search style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search anything... (Escape to close)"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '1.2rem',
                  padding: '12px 15px 12px 45px',
                  borderRadius: '14px'
                }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
              {filteredActions.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 15px', letterSpacing: '1px' }}>Navigation & Tools</div>
                  {filteredActions.map(action => (
                    <div 
                      key={action.id} 
                      onClick={() => handleSelect(action.path)}
                      className="cmd-item"
                      style={{
                        padding: '12px 15px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '10px' }}>
                        <action.icon size={18} color="var(--accent-gold)" />
                      </div>
                      <span style={{ flex: 1, fontWeight: 500 }}>{action.name}</span>
                      <ArrowRight size={14} style={{ opacity: 0.3 }} />
                    </div>
                  ))}
                </div>
              )}

              {filteredItems.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 15px', letterSpacing: '1px' }}>Inventory Quick Search</div>
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleSelect('/admin/inventory')}
                      className="cmd-item"
                      style={{
                        padding: '12px 15px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={item.image} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category} • ${item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredActions.length === 0 && filteredItems.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No results found for "{query}"
                </div>
              )}
            </div>
            
            <div style={{ 
              borderTop: '1px solid var(--glass-border)', 
              padding: '10px 15px', 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '20px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>↵</kbd> to select
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>ESC</kbd> to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
