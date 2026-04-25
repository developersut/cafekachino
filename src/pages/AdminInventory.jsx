import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Search,
  Image as ImageIcon,
  Tag,
  Layers,
  LayoutGrid,
  ChevronRight,
  Package,
  ArrowLeft,
  AlertCircle,
  TrendingDown,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useKachinoStore } from '../store/useKachinoStore';

const AdminInventory = () => {
  const { 
    items, categories, addItem, updateItem, deleteItem, addCategory, deleteCategory,
    tables, addTable, updateTable, deleteTable,
    customizations, addCustomization, updateCustomization, deleteCustomization
  } = useKachinoStore();
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', or 'tables'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCatName, setNewCatName] = useState("");
  
  // Customization Logic
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const { register: registerCust, handleSubmit: handleSubmitCust, reset: resetCust } = useForm();

  // ----- Product Logic -----
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = items.filter(item => 
    item.trackStock !== false && item.stock <= (item.lowStockThreshold || 10)
  );

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    reset(item || {
      name: '',
      description: '',
      price: '',
      stock: 50,
      trackStock: true,
      lowStockThreshold: 10,
      category: categories.find(c => c !== "All") || 'Coffee',
      image: ''
    });
    setIsModalOpen(true);
  };

  const onProductSubmit = (data) => {
    const itemData = {
      ...data,
      price: parseFloat(data.price),
      trackStock: data.trackStock,
      stock: data.trackStock ? (parseInt(data.stock) || 0) : 0,
      lowStockThreshold: data.trackStock ? (parseInt(data.lowStockThreshold) || 10) : 0,
      image: data.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'
    };

    if (editingItem) {
      updateItem(editingItem.id, { ...editingItem, ...itemData });
      toast.success(`${itemData.name} updated`);
    } else {
      addItem(itemData);
      toast.success(`${itemData.name} added to menu`);
    }
    setIsModalOpen(false);
  };

  // ----- Category Logic -----
  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName)) {
      toast.error('Category already exists');
      return;
    }
    addCategory(newCatName);
    toast.success('Category architecture updated', { description: newCatName });
    setNewCatName("");
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Unified Header */}
      <div className="header-row">
        <div>
          <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
            {activeTab === 'products' ? 'Configure your items, pricing, and visual presentation' : 'Define the taxonomy and classification of your digital menu'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
             {/* Resilience Indicators */}
             <div className="menu-card" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderColor: lowStockItems.length > 0 ? '#f87171' : 'var(--glass-border)', background: lowStockItems.length > 0 ? 'rgba(248, 113, 113, 0.05)' : 'rgba(255,255,255,0.03)' }}>
                <Activity size={18} color={lowStockItems.length > 0 ? '#f87171' : 'var(--accent-gold)'} />
                <div>
                   <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Safety Stock</div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{lowStockItems.length > 0 ? `${lowStockItems.length} CRITICAL` : 'OPTIMAL'}</div>
                </div>
             </div>
        </div>
      </div>

      {lowStockItems.length > 0 && activeTab === 'products' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="menu-card" 
            style={{ 
                background: 'rgba(248, 113, 113, 0.08)', 
                borderColor: 'rgba(248, 113, 113, 0.3)',
                padding: '12px 15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}
          >
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                <AlertCircle size={16} />
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Resilience Alert: Low Stock</h3>
             </div>
             <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                {lowStockItems.map(item => (
                    <div key={item.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', minWidth: '150px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#f87171' }}>{item.stock} left (Goal: {item.lowStockThreshold})</div>
                    </div>
                ))}
             </div>
          </motion.div>
      )}
        
        {activeTab === 'products' && (
          <button 
            className="pay-button" 
            style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)' }}
            onClick={() => handleOpenModal()}
          >
            <Plus size={20} />
            New Product
          </button>
        )}

      {/* Admin Tab Switcher */}
      <div style={{ 
        display: 'flex', 
        gap: '3px', 
        padding: '3px', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '10px', 
        width: 'fit-content',
        border: '1px solid var(--glass-border)'
      }}>
        {[
          { id: 'products', label: 'Products', icon: Package },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'customizations', label: 'Customizations', icon: Tag },
          { id: 'tables', label: 'Tables', icon: LayoutGrid }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === tab.id ? 'var(--bg-deep)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.72rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contextual Search */}
      <div className="search-container" style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
        <input 
          type="text" 
          className="search-bar" 
          placeholder={
            activeTab === 'products' ? "Filter products..." : 
            activeTab === 'categories' ? "Filter categories..." :
            activeTab === 'customizations' ? "Filter customizations..." :
            "Filter tables..."
          }
          style={{ paddingLeft: '45px', width: '100%' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <AnimatePresence>
          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="responsive-table flex-1 !overflow-hidden"
            >
              <div style={{ overflowY: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)' }}>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 15px' }}>Product</th>
                      <th style={{ padding: '12px 15px' }}>Category</th>
                      <th style={{ padding: '12px 15px' }}>Price</th>
                      <th style={{ padding: '12px 15px' }}>Stock</th>
                      <th style={{ padding: '12px 15px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '6px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={item.image} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} alt="" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px 15px' }}>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent-gold)', padding: '2px 8px', borderRadius: '8px' }}>
                            {item.category}
                          </span>
                        </td>
                        <td style={{ padding: '6px 15px', fontWeight: 'bold', fontSize: '0.85rem' }}>${item.price.toFixed(2)}</td>
                        <td style={{ padding: '6px 15px', fontSize: '0.85rem' }}>
                          {item.trackStock !== false ? (
                            <span style={{ 
                              fontWeight: 'bold', 
                              color: item.stock <= (item.lowStockThreshold || 10) ? '#f87171' : 'inherit' 
                            }}>
                              {item.stock}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Untracked</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 15px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleOpenModal(item)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                            <button onClick={() => { if(confirm('Delete product?')) deleteItem(item.id); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}
            >
              <div className="menu-card" style={{ padding: '30px', height: 'fit-content' }}>
                <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                  <Tag size={18} color="var(--accent-gold)" /> New Classification
                </h3>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    type="text" 
                    className="search-bar" 
                    placeholder="e.g., Seasonal Specials"
                    style={{ width: '100%', padding: '15px' }}
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button className="pay-button" type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Plus size={18} />
                    Commit Category
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence mode="popLayout">
                  {filteredCategories.map((cat, index) => (
                    <motion.div 
                      key={cat}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="menu-card" 
                      style={{ 
                        padding: '15px 20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        background: cat === 'All' ? 'rgba(212, 175, 55, 0.05)' : 'var(--glass-bg)',
                        borderColor: cat === 'All' ? 'var(--glass-border-gold)' : 'var(--glass-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ color: cat === 'All' ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                          <Layers size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat}</div>
                          {cat === 'All' && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>System Default</div>}
                        </div>
                      </div>
                      
                      {cat !== 'All' && (
                        <button 
                          onClick={() => deleteCategory(cat)}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '8px', borderRadius: '10px' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'customizations' && (
            <motion.div 
              key="customizations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <button 
                className="pay-button" 
                style={{ width: 'auto', alignSelf: 'start', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setEditingCust(null);
                  resetCust({ name: '', options: 'None, 25%, 50%, 75%, 100%', categories: [] });
                  setIsCustModalOpen(true);
                }}
              >
                <Plus size={18} /> New Modifier
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {customizations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(cust => (
                  <div key={cust.id} className="menu-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{cust.name}</h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Applies to: {cust.categories?.join(', ') || 'None'}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            setEditingCust(cust);
                            resetCust({ 
                              name: cust.name, 
                              options: cust.options.join(', '), 
                              categories: cust.categories || [] 
                            });
                            setIsCustModalOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('Delete this customization?')) deleteCustomization(cust.id); }}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {cust.options.map(opt => (
                        <span key={opt} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>{opt}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'tables' && (
            <motion.div 
              key="tables"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}
            >
              <div className="menu-card" style={{ padding: '30px', height: 'fit-content' }}>
                <h3 style={{ fontSize: 'var(--font-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutGrid size={18} color="var(--accent-gold)" /> New Table
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>{tables?.length || 0} Total</span>
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const name = e.target.tableName.value;
                  if (name) {
                    addTable(name);
                    e.target.reset();
                    toast.success(`Table created: ${name}`);
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    name="tableName"
                    type="text" 
                    className="search-bar" 
                    placeholder="e.g., Terrace 1"
                    style={{ width: '100%', padding: '15px' }}
                  />
                  <button className="pay-button" type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <Plus size={18} />
                    Add Table
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(tables || []).map((t, index) => (
                  <div 
                    key={t.id || index}
                    className="menu-card" 
                    style={{ 
                      padding: '15px 20px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ color: t.status === 'occupied' ? '#f87171' : 'var(--accent-gold)' }}>
                        <LayoutGrid size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.label}</div>
                        <div style={{ fontSize: '0.7rem', color: t.status === 'occupied' ? '#f87171' : '#4ade80' }}>
                          {(t.status || 'available').toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          const newName = prompt('Enter new table name:', t.label);
                          if (newName) updateTable(t.id, newName);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Delete this table?')) deleteTable(t.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content" 
              style={{ width: '450px', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingItem ? <Edit2 size={24} color="var(--accent-gold)"/> : <Plus size={24} color="var(--accent-gold)"/>}
                  {editingItem ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
              </div>

              <form onSubmit={handleSubmit(onProductSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Product Name</label>
                  <input 
                    {...register('name', { required: 'Name is required' })} 
                    className={`search-bar ${errors.name ? 'error' : ''}`} 
                    style={{ width: '100%' }} 
                    placeholder="Enter product name"
                  />
                  {errors.name && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>{errors.name.message}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Category</label>
                    <select {...register('category')} className="search-bar" style={{ width: '100%', appearance: 'auto' }}>
                      {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price ($)</label>
                    <input 
                      {...register('price', { required: 'Price is required', min: 0 })} 
                      type="number" 
                      step="0.01" 
                      className={`search-bar ${errors.price ? 'error' : ''}`} 
                      style={{ width: '100%' }} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="trackStock" 
                    {...register('trackStock')} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-gold)' }} 
                  />
                  <label htmlFor="trackStock" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Track inventory level for this product</label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', opacity: watch('trackStock') ? 1 : 0.4, pointerEvents: watch('trackStock') ? 'auto' : 'none', transition: 'all 0.3s' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>Current Stock</label>
                    <input 
                      {...register('stock')} 
                      type="number" 
                      className="search-bar" 
                      style={{ width: '100%', paddingLeft: '15px' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '8px' }}>Low Stock Alert at</label>
                    <input 
                      {...register('lowStockThreshold')} 
                      type="number" 
                      className="search-bar" 
                      style={{ width: '100%', paddingLeft: '15px' }} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Image URL</label>
                  <input 
                    {...register('image')} 
                    className="search-bar" 
                    style={{ width: '100%' }} 
                    placeholder="https://images.unsplash.com/..." 
                  />
                </div>

                <button type="submit" className="pay-button" style={{ marginTop: '10px' }}>
                  {editingItem ? 'Update Product' : 'Add to Menu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCustModalOpen && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ width: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{editingCust ? 'Edit Modifier' : 'New Modifier'}</h2>
                <button onClick={() => setIsCustModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X /></button>
              </div>

              <form onSubmit={handleSubmitCust((data) => {
                const custData = {
                  ...data,
                  options: data.options.split(',').map(o => o.trim()).filter(Boolean),
                  categories: Array.isArray(data.categories) ? data.categories : []
                };
                if (editingCust) {
                  updateCustomization(editingCust.id, { ...editingCust, ...custData });
                  toast.success('Modifier updated');
                } else {
                  addCustomization(custData);
                  toast.success('New modifier created');
                }
                setIsCustModalOpen(false);
              })} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modifier Name</label>
                  <input {...registerCust('name', { required: true })} className="search-bar" style={{ width: '100%' }} placeholder="e.g., Ice Level" />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Options (Comma separated)</label>
                  <input {...registerCust('options', { required: true })} className="search-bar" style={{ width: '100%' }} placeholder="None, 25%, 50%, 75%, 100%" />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Apply to Categories</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '150px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <input type="checkbox" value={cat} {...registerCust('categories')} style={{ accentColor: 'var(--accent-gold)' }} />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="pay-button" style={{ marginTop: '10px' }}>
                  {editingCust ? 'Save Changes' : 'Create Modifier'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInventory;
