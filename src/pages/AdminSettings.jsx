import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Percent, Settings as SettingsIcon, AlertCircle, Store, MapPin, 
  Phone, Globe, Layout, Plus, Trash2, Hash, Receipt, Shield, ShieldAlert, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { useKachinoStore } from '../store/useKachinoStore';

const AdminSettings = () => {
  const { settings, updateSettings, tables, addTable, deleteTable, updateTable } = useKachinoStore();
  const [taxRate, setTaxRate] = useState(((settings?.taxRate || 0) * 100).toString());
  const [fiscalMeta, setFiscalMeta] = useState({
    fiscalId: settings?.fiscalId || '',
    currencySymbol: settings?.currencySymbol || '$',
    footerMsg: settings?.footerMsg || ''
  });

  const handleSave = () => {
    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0) {
      toast.error('Invalid Tax Rate', {
        description: 'Please enter a valid positive number.'
      });
      return;
    }

    updateSettings({ taxRate: rate / 100 });
    toast.success('Tax Configuration Saved', {
      description: `System tax rate updated to ${rate}%`
    });
  };

  const [formData, setFormData] = useState(settings.storeInfo || {});

  const handleBrandSave = () => {
    updateSettings({ storeInfo: formData });
    toast.success('Brand Identity Updated');
  };

  const handleSecurityToggle = () => {
    updateSettings({ highSecurity: !settings.highSecurity });
    toast.info(`High Security Mode ${!settings.highSecurity ? 'Enabled' : 'Disabled'}`, {
      description: !settings.highSecurity ? 'Staff will be prompted for PIN after every sale.' : 'Standard mode restored.'
    });
  };

  return (
    <div className="main-content" style={{ padding: '0 20px' }}>
      <div className="header-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', margin: 0 }}>System Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Configure global POS parameters and tax logic</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 400px))', gap: '20px', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ background: 'var(--accent-gold-soft)', padding: '8px', borderRadius: '8px' }}>
              <Percent size={18} color="var(--accent-gold)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Tax Configuration</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Global sales tax percentage</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tax Rate (%)
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="number"
                    className="search-bar"
                    style={{ width: '100%', paddingRight: '40px' }}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    step="0.01"
                  />
                  <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Currency Symbol
                </label>
                <input 
                  className="search-bar"
                  style={{ width: '100%' }}
                  value={fiscalMeta.currencySymbol}
                  onChange={(e) => setFiscalMeta({...fiscalMeta, currencySymbol: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fiscal Registry ID
              </label>
              <div style={{ position: 'relative' }}>
                <Hash size={14} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input 
                  className="search-bar"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  value={fiscalMeta.fiscalId}
                  onChange={(e) => setFiscalMeta({...fiscalMeta, fiscalId: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Receipt Footer Message
              </label>
              <div style={{ position: 'relative' }}>
                <Receipt size={14} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input 
                  className="search-bar"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  value={fiscalMeta.footerMsg}
                  onChange={(e) => setFiscalMeta({...fiscalMeta, footerMsg: e.target.value})}
                />
              </div>
            </div>

            <button 
              className="pay-button" 
              style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={() => {
                const rate = parseFloat(taxRate);
                updateSettings({ 
                   taxRate: rate / 100,
                   ...fiscalMeta
                });
                toast.success('Fiscal Configuration Saved');
              }}
            >
              <Save size={18} />
              Save Fiscal Parameters
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ background: 'var(--accent-gold-soft)', padding: '8px', borderRadius: '8px' }}>
              <Store size={18} color="var(--accent-gold)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Brand Identity</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Logo, name, and receipt info</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Store Name</label>
                <input 
                  className="search-bar" 
                  style={{ width: '100%' }}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
             </div>
             <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Physical Address</label>
                <input 
                  className="search-bar" 
                  style={{ width: '100%' }}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
               <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Phone</label>
                  <input 
                    className="search-bar" 
                    style={{ width: '100%' }}
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
               </div>
               <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Logo URL</label>
                  <input 
                    className="search-bar" 
                    style={{ width: '100%' }}
                    placeholder="https://..."
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                  />
               </div>
             </div>
             <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Welcome Message</label>
                <input 
                  className="search-bar" 
                  style={{ width: '100%' }}
                  value={formData.welcomeMsg || ''}
                  onChange={(e) => setFormData({...formData, welcomeMsg: e.target.value})}
                />
             </div>

             <button 
                className="pay-button" 
                style={{ marginTop: '10px' }}
                onClick={handleBrandSave}
              >
                Update Identity
              </button>
          </div>
        </motion.div>

        {/* Table Management (NEW Features) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-gold-soft)', padding: '8px', borderRadius: '8px' }}>
                <Layout size={18} color="var(--accent-gold)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Table Layout</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Configure floor plan and table IDs</p>
              </div>
            </div>
            <button 
              className="tab"
              style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-gold-soft)', color: 'var(--accent-gold)', borderColor: 'transparent' }}
              onClick={() => {
                const label = prompt("Enter Table Label (e.g. Table 13):");
                if (label) addTable(label);
              }}
            >
              <Plus size={16} /> Add Table
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
            {tables.map(table => (
              <div 
                key={table.id}
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)', 
                  padding: '12px', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{table.label}</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                   <button 
                    onClick={() => {
                      const newLabel = prompt("New label:", table.label);
                      if (newLabel) updateTable(table.id, newLabel);
                    }}
                    style={{ flex: 1, background: 'none', border: '1px solid var(--glass-border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                   >
                     Edit
                   </button>
                   <button 
                    onClick={() => {
                       if (confirm(`Delete ${table.label}?`)) deleteTable(table.id);
                    }}
                    style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: '#f87171' }}
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 && (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '20px' }}>
               No tables configured.
             </div>
          )}
        </motion.div>

        {/* Access & Security */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(248, 113, 113, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Shield size={18} color="#f87171" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Access & Security</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Terminal locking and authorization</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
             <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>High Security Mode</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require PIN lock after every transaction</div>
             </div>
             <button 
               onClick={handleSecurityToggle}
               style={{ 
                  background: settings.highSecurity ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)', 
                  border: 'none', width: '50px', height: '26px', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' 
               }}
             >
                <div style={{ 
                  width: '18px', height: '18px', background: settings.highSecurity ? 'black' : 'white', borderRadius: '50%', 
                  position: 'absolute', top: '4px', left: settings.highSecurity ? '28px' : '4px', transition: 'all 0.3s' 
                }} />
             </button>
          </div>
        </motion.div>

        {/* Loyalty Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '8px', borderRadius: '8px' }}>
              <Award size={18} color="var(--accent-gold)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Loyalty Program</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Configure points and rewards</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Points per Spend ({settings.currencySymbol}1 = X pts)</label>
              <input 
                type="number"
                className="search-bar" 
                style={{ width: '100%' }}
                value={settings.loyalty?.pointsPerDollar || 1}
                onChange={(e) => updateSettings({ loyalty: { ...settings.loyalty, pointsPerDollar: parseFloat(e.target.value) || 0 } })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Goal (pts)</label>
                <input 
                  type="number"
                  className="search-bar" 
                  style={{ width: '100%' }}
                  value={settings.loyalty?.redemptionThreshold || 100}
                  onChange={(e) => updateSettings({ loyalty: { ...settings.loyalty, redemptionThreshold: parseInt(e.target.value) || 0 } })}
                />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Reward ({settings.currencySymbol})</label>
                <input 
                  type="number"
                  className="search-bar" 
                  style={{ width: '100%' }}
                  value={settings.loyalty?.redemptionValue || 5}
                  onChange={(e) => updateSettings({ loyalty: { ...settings.loyalty, redemptionValue: parseFloat(e.target.value) || 0 } })}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '5px' }}>
              Current Rule: Customers earn {settings.loyalty?.pointsPerDollar || 1} point per {settings.currencySymbol} spent. 
              Redeem {settings.loyalty?.redemptionThreshold || 100} points for a {settings.currencySymbol}{settings.loyalty?.redemptionValue || 5} discount.
            </p>
          </div>
        </motion.div>

        {/* Expense Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="menu-card" 
          style={{ padding: '22px 15px', cursor: 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--accent-gold-soft)', padding: '8px', borderRadius: '8px' }}>
                <Receipt size={18} color="var(--accent-gold)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem' }}>Expense Categories</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Define business overhead classifications</p>
              </div>
            </div>
            <button 
              className="tab"
              style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-gold-soft)', color: 'var(--accent-gold)', borderColor: 'transparent' }}
              onClick={() => {
                const cat = prompt("Enter New Expense Category:");
                if (cat) useKachinoStore.getState().addExpenseCategory(cat);
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(useKachinoStore.getState().expenseCategories || []).map(cat => (
              <div 
                key={cat}
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--glass-border)', 
                  padding: '6px 12px', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem'
                }}
              >
                <span>{cat}</span>
                <button 
                  onClick={() => {
                    if (confirm(`Delete ${cat}?`)) useKachinoStore.getState().deleteExpenseCategory(cat);
                  }}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
