import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  User as UserIcon, 
  Activity, 
  Clock, 
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useKachinoStore } from '../store/useKachinoStore';

const AdminLogs = () => {
  const { auditLogs = [], fetchLogs } = useKachinoStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("All");

  React.useEffect(() => {
    // Refresh logs on mount
    if (typeof fetchLogs === 'function') fetchLogs();
  }, [fetchLogs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(auditLogs.map(log => log.action));
    return ["All", ...Array.from(actions)];
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAction = filterAction === "All" || log.action === filterAction;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchQuery, filterAction]);

  const getActionColor = (action) => {
    if (action.includes('Delete') || action.includes('Void')) return '#f87171';
    if (action.includes('Add') || action.includes('Register')) return '#4ade80';
    if (action.includes('Update') || action.includes('Edit')) return '#fbbf24';
    return 'var(--accent-gold)';
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="header-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>System Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Complete transparency for terminal operations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(74, 222, 128, 0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
           <ShieldCheck size={18} color="#4ade80" />
           <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>Integrity Verified</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by user or details..." 
            className="search-bar" 
            style={{ width: '100%', paddingLeft: '45px', background: 'var(--bg-surface)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '5px 15px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select 
            className="search-bar" 
            style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', width: '150px' }}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            {uniqueActions.map(action => (
              <option key={action} value={action} style={{ background: 'var(--bg-surface)' }}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        borderRadius: '18px', 
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <th style={{ padding: '15px 20px' }}>Timestamp</th>
              <th style={{ padding: '15px 20px' }}>Administrative Actor</th>
              <th style={{ padding: '15px 20px' }}>Action Category</th>
              <th style={{ padding: '15px 20px' }}>Technical Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.01 }}
                style={{ borderBottom: '1px solid var(--glass-border)', transition: 'all 0.2s' }}
                whileHover={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <Clock size={14} color="var(--text-muted)" />
                    {format(parseISO(log.timestamp), 'MMM dd, HH:mm:ss')}
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <UserIcon size={14} color="var(--accent-gold)" />
                    {log.user}
                  </div>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: `${getActionColor(log.action)}15`,
                    color: getActionColor(log.action),
                    border: `1px solid ${getActionColor(log.action)}30`
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  {log.details}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredLogs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '100px', opacity: 0.3 }}>
            <ClipboardList size={48} style={{ marginBottom: '15px' }} />
            <div>No audit entries found</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
