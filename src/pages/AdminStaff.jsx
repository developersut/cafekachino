import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User, 
  Trash2, 
  Edit2, 
  X, 
  Check,
  ShieldAlert,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useKachinoStore } from '../store/useKachinoStore';

const AdminStaff = () => {
  const { staff, addStaff, updateStaff, deleteStaff } = useKachinoStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (member = null) => {
    setEditingStaff(member);
    reset(member || {
      name: '',
      pin: '',
      role: 'staff'
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    let success = false;
    if (editingStaff) {
      success = await updateStaff(editingStaff.id, { ...editingStaff, ...data });
      if (success) {
        toast.success(`${data.name} updated successfully`);
        setIsModalOpen(false);
      }
    } else {
      success = await addStaff(data);
      if (success) {
        toast.success(`${data.name} added to team`);
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="main-content">
      <div className="header-row" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Team Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Manage staff access codes and system roles</p>
        </div>
        <button 
          className="pay-button" 
          style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)' }}
          onClick={() => handleOpenModal()}
        >
          <UserPlus size={16} />
          Add Staff
        </button>
      </div>

      <div className="search-container" style={{ position: 'relative', marginBottom: '30px' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
        <input 
          type="text" 
          className="search-bar" 
          placeholder="Search team members..." 
          style={{ paddingLeft: '45px', width: '100%' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredStaff.map(member => (
          <motion.div 
            layout
            key={member.id} 
            className="menu-card" 
            style={{ padding: '16px', position: 'relative' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ 
                background: member.role === 'admin' ? 'var(--accent-gold-soft)' : 'rgba(255,255,255,0.05)', 
                width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                {member.role === 'admin' ? <Shield size={18} color="var(--accent-gold)" /> : <User size={18} color="var(--text-muted)" />}
              </div>
              <div>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{member.name}</h3>
                <span style={{ 
                  fontSize: '9px', 
                  background: member.role === 'admin' ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', 
                  color: member.role === 'admin' ? 'black' : 'var(--text-muted)',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {member.role === 'admin' ? 'Manager' : 'Staff'}
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Access Code</div>
              <div style={{ letterSpacing: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>••••</div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="tab" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', fontSize: '0.7rem' }}
                onClick={() => handleOpenModal(member)}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button 
                className="tab" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px', color: '#f87171', fontSize: '0.7rem' }}
                onClick={() => { if(confirm(`Revoke all access for ${member.name} and remove from team?`)) deleteStaff(member.id); }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="menu-card" 
              style={{ width: '100%', maxWidth: '400px', padding: '30px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: 'var(--font-h2)' }}>{editingStaff ? 'Edit Team Member' : 'New Team Member'}</h2>
                <button className="nav-item" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Name</label>
                  <input 
                    {...register('name', { required: 'Name is required' })} 
                    className={`search-bar ${errors.name ? 'error' : ''}`} 
                    placeholder="Enter staff name"
                    style={{ width: '100%', paddingLeft: '15px' }}
                  />
                  {errors.name && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.name.message}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>Security PIN (4 Digits)</label>
                  <input 
                    {...register('pin', { 
                      required: 'PIN is required', 
                      pattern: { value: /^\d{4}$/, message: 'PIN must be exactly 4 digits' },
                      validate: (value) => {
                        const isDuplicate = staff.some(s => s.pin === value && s.id !== editingStaff?.id);
                        return !isDuplicate || 'This PIN is already assigned';
                      }
                    })} 
                    type="password"
                    maxLength={4}
                    className={`search-bar ${errors.pin ? 'error' : ''}`} 
                    placeholder="e.g. 1234"
                    style={{ width: '100%', paddingLeft: '15px' }}
                  />
                  {errors.pin && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.pin.message}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>System Role</label>
                  <select 
                    {...register('role')} 
                    className="search-bar"
                    style={{ width: '100%', paddingLeft: '15px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--glass-border)' }}
                  >
                    <option value="staff">Staff Member (POS Access Only)</option>
                    <option value="admin">Manager (Full System Access)</option>
                  </select>
                </div>

                <button type="submit" className="pay-button" style={{ marginTop: '10px' }}>
                  {editingStaff ? 'Update Member' : 'Create Access Code'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStaff;
