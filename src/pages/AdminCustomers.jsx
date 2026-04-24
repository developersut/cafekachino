import React, { useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  Filter,
  DollarSign,
  Briefcase,
  QrCode,
  Edit2,
  Save,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKachinoStore } from '../store/useKachinoStore';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

const AdminCustomers = () => {
  const { customers = [], sales = [], settings, user, addCustomer, updateCustomer, deleteCustomer, fetchCustomers } = useKachinoStore();
  
  React.useEffect(() => {
    fetchCustomers();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('Profile');
  const isAdmin = user?.role === 'admin';
  
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

  const filteredCustomers = useMemo(() => {
    return (customers || []).filter(c => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone || '').includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const selectedCustomer = useMemo(() => {
    return (customers || []).find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const customerHistory = useMemo(() => {
    if (!selectedCustomerId) return [];
    return (sales || []).filter(s => s.customerId === selectedCustomerId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [sales, selectedCustomerId]);

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setValue('name', customer.name);
      setValue('phone', customer.phone);
      setValue('email', customer.email || '');
      setValue('points', customer.points || 0);
    } else {
      setEditingCustomer(null);
      reset({ name: '', phone: '', email: '', points: 0 });
    }
    setIsEditModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: data.name,
          phone: data.phone,
          email: data.email,
          points: parseInt(data.points || 0)
        });
        toast.success('Customer profile updated');
      } else {
        await addCustomer({
          name: data.name,
          phone: data.phone
        });
        toast.success('New customer registered successfully');
      }
      await fetchCustomers();
      setIsEditModalOpen(false);
      reset();
    } catch (err) {
      console.error("Customer Action Error:", err);
      toast.error('Operation failed. Please check network connection.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? All loyalty history will be lost.')) {
      await deleteCustomer(id);
      toast.success('Customer removed');
      setSelectedCustomerId(null);
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div className="header-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Customer Relationship</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
            Insights and loyalty management for your patrons
          </p>
        </div>
        <button 
          className="pay-button" 
          style={{ width: 'auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => handleOpenModal()}
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Customer List */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Search by name or phone..." 
              style={{ width: '100%', paddingLeft: '45px', background: 'var(--bg-surface)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px' }}>
            {filteredCustomers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                   <Users size={40} style={{ marginBottom: '15px' }} />
                   <div>No customers found</div>
                </div>
            ) : (
                filteredCustomers.map(customer => (
                    <motion.div 
                        key={customer.id}
                        layout
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className="menu-card"
                        style={{ 
                            padding: '16px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderColor: selectedCustomerId === customer.id ? 'var(--accent-gold)' : 'var(--glass-border)',
                            background: selectedCustomerId === customer.id ? 'rgba(212, 175, 55, 0.05)' : 'var(--glass-bg)'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' }}>
                                {(customer.name || 'C').charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{customer.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customer.phone}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{customer.points || 0} <span style={{fontSize: '0.6rem'}}>PTS</span></div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Loyalty Member</div>
                        </div>
                    </motion.div>
                ))
            )}
          </div>
        </section>

        {/* Customer Detail */}
        <section>
            <AnimatePresence mode="wait">
                {!selectedCustomer ? (
                    <motion.div 
                        key="empty"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="menu-card" 
                        style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                        <Briefcase size={60} style={{ opacity: 0.1, marginBottom: '20px' }} />
                        <h3>Patron Profile</h3>
                        <p style={{ fontSize: 'var(--font-xs)' }}>Select a customer from the directory to view detailed fiscal engagement and history.</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        key={selectedCustomer.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '12px', marginBottom: '15px', border: '1px solid var(--glass-border)' }}>
                           {['Profile', 'History'].map(tab => (
                             <button
                               key={tab}
                               onClick={() => setActiveTab(tab)}
                               style={{
                                 flex: 1,
                                 padding: '8px',
                                 fontSize: '0.75rem',
                                 fontWeight: 700,
                                 borderRadius: '10px',
                                 border: 'none',
                                 background: activeTab === tab ? 'var(--accent-gold)' : 'transparent',
                                 color: activeTab === tab ? 'black' : 'var(--text-muted)',
                                 cursor: 'pointer',
                                 transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                               }}
                             >
                               {tab}
                             </button>
                           ))}
                        </div>

                        {activeTab === 'Profile' && (
                          <motion.div 
                            key="profile"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                          >
                            <div className="menu-card" style={{ padding: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '25px' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900 }}>
                                        {(selectedCustomer.name || 'C').charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '5px' }}>{selectedCustomer.name}</h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {selectedCustomer.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-white)' }}>
                                                    <Phone size={14} color="var(--accent-gold)" /> {selectedCustomer.phone}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <Clock size={14} /> Joined {format(parseISO(selectedCustomer.since || new Date().toISOString()), 'MMMM yyyy')}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleOpenModal(selectedCustomer)} className="tab" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', color: 'var(--accent-gold)' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(selectedCustomer.id)} className="tab" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(248, 113, 113, 0.2)', color: '#f87171' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }} onClick={() => setIsCardModalOpen(true)}>
                                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Available Balance</div>
                                         <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{selectedCustomer.points || 0} <span style={{fontSize: '0.8rem'}}>PTS</span></div>
                                         <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', marginTop: '8px', fontWeight: 700 }}>VIEW DIGITAL PASS</div>
                                     </div>
                                </div>
                             </div>
                          </motion.div>
                        )}

                        {activeTab === 'History' && (
                            <div className="menu-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <TrendingUp size={20} color="var(--accent-gold)" /> Fiscal Engagement
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '50vh', overflowY: 'auto', paddingRight: '5px' }}>
                                    {customerHistory.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.3 }}>No transaction history found for this patron</div>
                                    ) : (
                                        customerHistory.map(sale => (
                                            <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{format(parseISO(sale.timestamp), 'MMM dd, yyyy • HH:mm')}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.items.length} items • Managed by {sale.processedBy}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{settings?.currencySymbol || '$'}{sale.total.toFixed(2)}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{sale.paymentMethod}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
      </div>

      {/* Edit/Add Customer Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content" 
              style={{ width: '450px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', padding: '30px' }}
            >
              <h2 style={{ marginBottom: '25px', fontSize: '1.4rem', fontWeight: 800 }}>{editingCustomer ? 'Update Profile' : 'New Customer Registration'}</h2>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>FULL NAME</label>
                  <input 
                    {...register('name', { required: 'Name is required' })} 
                    className={`search-bar ${errors.name ? 'error' : ''}`} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }} 
                    placeholder="Enter customer name"
                  />
                  {errors.name && <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> {errors.name.message}</div>}
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>PHONE NUMBER</label>
                  <input 
                    {...register('phone', { required: 'Phone is required' })} 
                    className={`search-bar ${errors.phone ? 'error' : ''}`} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)' }} 
                    placeholder="e.g. +1 234 567 890"
                  />
                  {errors.phone && <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> {errors.phone.message}</div>}
                </div>
                {editingCustomer && (
                    <div className="form-group">
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>LOYALTY POINTS</label>
                        <input 
                          {...register('points')} 
                          type="number" 
                          className="search-bar" 
                          style={{ width: '100%', background: 'rgba(0,0,0,0.2)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }} 
                        />
                    </div>
                )}
                <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="tab" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                  <button type="submit" className="pay-button" style={{ flex: 1, padding: '12px' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : (editingCustomer ? 'Update' : 'Register')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Digital Loyalty Card Modal */}
      <AnimatePresence>
        {isCardModalOpen && selectedCustomer && (
          <div className="modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="menu-card" 
              style={{ width: '360px', padding: '0', overflow: 'hidden', background: '#000', border: '1px solid var(--glass-border-gold)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
            >
              <div style={{ padding: '30px', background: 'linear-gradient(135deg, #1a1a1a, #000)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '45px' }}>
                   <div style={{ fontWeight: 900, fontSize: '0.85rem', letterSpacing: '3px', color: 'var(--accent-gold)' }}>KACHINO PASS</div>
                   <QrCode size={22} color="var(--accent-gold)" />
                </div>
                
                <div style={{ marginBottom: '45px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Premium Patron</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>{selectedCustomer.name}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points Balance</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{selectedCustomer.points || 0}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    v2.0 Verified Terminal
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '35px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
                 <div style={{ padding: '20px', border: '2px solid #000', borderRadius: '20px' }}>
                    <QrCode size={130} color="#000" />
                 </div>
                 <div style={{ color: '#000', fontWeight: 800, letterSpacing: '5px', fontSize: '1.1rem' }}>{(selectedCustomer.phone || '').replace(/[^0-9]/g, '').slice(-8)}</div>
                 <button onClick={() => setIsCardModalOpen(false)} className="pay-button" style={{ background: '#000', color: 'white', width: '100%' }}>Dismiss Pass</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCustomers;
