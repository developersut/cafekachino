import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Trash2,
  Search,
  Coffee,
  ShoppingBag,
  X,
  Printer,
  CheckCircle,
  AlertTriangle,
  Home,
  User,
  ChevronDown,
  ChevronUp,
  Layout,
  Award,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Receipt from '../components/Receipt';
import { useKachinoStore } from '../store/useKachinoStore';

const POS = () => {
  const navigate = useNavigate();
  const { 
    items, 
    categories = [], 
    settings, 
    isCartOpen, 
    setCartOpen, 
    cart,
    addToCart,
    updateCartModifiers,
    updateCartQuantity,
    removeFromCart: removeGlobalItem,
    clearCart,
    recordSale,
    tables,
    saveToTable,
    loadFromTable,
    clearTable,
    customers,
    addCustomer,
    // Global Session
    activeTableId,
    diningMode,
    guestCount,
    selectedCustomerId,
    setSession,
    // Global Security
    isLocked,
    setLocked,
    moveTable,
    customizations
  } = useKachinoStore();
  const [lastOrder, setLastOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSwitchingTable, setIsSwitchingTable] = useState(false);
  const [isCheckoutMinimized, setCheckoutMinimized] = useState(false);

  // Financial States
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'fixed'
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  
  const [isTableModalOpen, setTableModalOpen] = useState(false);
  const [isNewCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [isPaidToggle, setIsPaidToggle] = useState(false); 
  const [pinInput, setPinInput] = useState("");
  const [isRedeemed, setIsRedeemed] = useState(false);
  
  // Customization State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [isEditingCartItem, setIsEditingCartItem] = useState(false);
  const [activeModifiers, setActiveModifiers] = useState({});
  const [relevantCustomizations, setRelevantCustomizations] = useState([]);


  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const handleAddToCart = (item) => {
    // Find customizations that apply to this item's category
    const relevant = customizations.filter(c => 
      c.categories?.some(cat => cat.toLowerCase() === item.category?.toLowerCase())
    );
    
    if (relevant.length > 0) {
      setCustomizingItem(item);
      setRelevantCustomizations(relevant);
      // Initialize modifiers with "None" or first option
      const initial = {};
      relevant.forEach(c => initial[c.name] = "None");
      setActiveModifiers(initial);
      setIsEditingCartItem(false);
    } else {
      addToCart(item);
      toast.success(`${item.name} added`);
    }
  };

  const confirmCustomization = () => {
    // Filter out "None" values
    const finalModifiers = {};
    Object.entries(activeModifiers).forEach(([key, val]) => {
      if (val !== "None") finalModifiers[key] = val;
    });
    
    const modifiersToSave = Object.keys(finalModifiers).length > 0 ? finalModifiers : null;

    if (isEditingCartItem) {
      updateCartModifiers(customizingItem.cartItemId, modifiersToSave);
      toast.success('Customization updated');
    } else {
      addToCart(customizingItem, modifiersToSave);
      toast.success(`${customizingItem.name} added`);
    }
    setCustomizingItem(null);
  };

  const updateQuantity = (cartItemId, delta) => updateCartQuantity(cartItemId, delta);

  const removeFromCart = (cartItemId) => {
    removeGlobalItem(cartItemId);
    toast('Item removed', { duration: 1200 });
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return subtotal * (discountValue / 100);
    }
    return Math.min(discountValue, subtotal);
  }, [subtotal, discountType, discountValue]);

  const tax = (subtotal - discountAmount) * (settings.taxRate || 0);
  const total = subtotal - discountAmount + tax;
  const changeDue = Math.max(0, amountPaid - total);

  // Auto-sync amountPaid with total
  useEffect(() => {
    setAmountPaid(total);
  }, [total]);

  const fireConfetti = () => {
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const rand = (min, max) => Math.random() * (max - min) + min;
    confetti({ ...defaults, particleCount: 50, origin: { x: rand(0.1, 0.3), y: rand(0.2, 0.6) } });
    confetti({ ...defaults, particleCount: 50, origin: { x: rand(0.7, 0.9), y: rand(0.2, 0.6) } });
    setTimeout(() => {
      confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.3 } });
    }, 150);
  };

  const handlePlaceOrder = async () => {
    const orderData = { 
      id: Date.now(), 
      timestamp: new Date().toISOString(), 
      items: cart, 
      subtotal, 
      tax, 
      discount: discountAmount,
      total,
      amountPaid: isPaidToggle ? total : amountPaid,
      change: isPaidToggle ? 0 : changeDue,
      guestCount: diningMode === 'dinein' ? guestCount : 0,
      paymentMethod,
      diningMode,
      tableNumber: activeTableId,
      customerId: selectedCustomerId,
      isRedeemed: isRedeemed
    };
    await recordSale(orderData);
    setLastOrder(orderData);



    setCheckoutModalOpen(true);
    fireConfetti();
    clearCart(); 
    setIsRedeemed(false); // Reset redemption
    toast.success('Order placed successfully!', {
      description: `Total: ${settings?.currencySymbol || '$'}${total.toFixed(2)}`,
      icon: <CheckCircle size={18} />,
      duration: 3000,
    });

    // High Security Auto-Lock
    if (settings.highSecurity) {
      setTimeout(() => setLocked(true), 2000); 
    }
  };

  const handleUnlock = () => {
    const staffMember = useKachinoStore.getState().staff.find(s => s.pin === pinInput);
    if (staffMember) {
      setLocked(false);
      setPinInput("");
      toast.success(`Welcome back, ${staffMember.name}`);
    } else {
      setPinInput("");
      toast.error('Invalid Security PIN');
    }
  };

  const handleRedeemPoints = () => {
    const { loyalty } = settings;
    const threshold = loyalty?.redemptionThreshold || 100;
    const value = loyalty?.redemptionValue || 5;

    const customer = customers.find(c => String(c.id) === String(selectedCustomerId));
    if (!customer || (customer.points || 0) < threshold) {
      toast.error('Insufficient Point Balance', { description: `Minimum ${threshold} points required.` });
      return;
    }
    
    if (isRedeemed) {
      toast.error('Already Redeemed', { description: 'Only one redemption per order allowed.' });
      return;
    }

    setDiscountValue(prev => prev + value); 
    setDiscountType('percent'); // Force percentage for loyalty rewards
    setIsRedeemed(true);
    toast.success('Loyalty Points Applied!', { description: `${value}% discount added to cart.` });
  };

  const handleReset = () => {
    clearCart();
    setDiscountValue(0);
    setAmountPaid(0);
    setPaymentMethod('cash');
    setCheckoutModalOpen(false);
    setCartOpen(false);
    setIsRedeemed(false);
    // Note: clearCart via store already resets the global session metadata.
  };
  return (
    <div className="pos-page" style={{ height: '100%' }}>
      {/* Main Content Area */}
      <main className="menu-section">
        <div className="main-content" style={{ padding: 'clamp(8px, 2vw, 15px)', overflowY: 'auto' }}>
          <div className="header-row" style={{ marginBottom: '12px' }}>
            <div className="desktop-only">
              <h1 style={{ fontSize: 'var(--font-h1)', marginBottom: '4px' }}>Cafe Kachino</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
              <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                type="text" 
                className="search-bar" 
                placeholder="Search items..." 
                style={{ paddingLeft: '45px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Table Switcher Removed as per request */}

          <div className="category-tabs">
            {["All", ...(categories || []).filter(c => c !== "All")].map(cat => (
              <button 
                key={cat} 
                className={`pos-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <motion.div layout className="menu-grid">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={(item.trackStock === false || (item.stock || 0) > 0) ? { scale: 0.95 } : {}}
                  className={`menu-card ${(item.trackStock !== false && (item.stock || 0) <= 0) ? 'sold-out' : ''}`}
                  onClick={() => (item.trackStock === false || (item.stock || 0) > 0) && handleAddToCart(item)}
                >
                   <img 
                    src={item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400'} 
                    alt={item.name} 
                    className="card-image" 
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop';
                    }}
                  />
                  <div className="card-name" style={{ marginTop: '5px' }}>{item.name}</div>
                  
                  {/* Stock Indicator */}
                  <div style={{ marginBottom: '6px' }}>
                    {item.trackStock !== false ? (
                      <>
                        {(item.stock || 0) <= 0 ? (
                          <span style={{ color: '#ff4d4d', fontSize: 'var(--font-xs)', fontWeight: 'bold' }}>SOLD OUT</span>
                        ) : (item.stock || 0) <= (item.lowStockThreshold || 10) ? (
                          <span style={{ color: '#fbbf24', fontSize: 'var(--font-xs)', fontWeight: 'bold' }}>LOW: {item.stock}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>×{item.stock}</span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', opacity: 0.5 }}>—</span>
                    )}
                  </div>

                  <div className="card-footer" style={{ 
                    borderTop: '1px solid var(--glass-border)', 
                    paddingTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div className="card-price" style={{ fontSize: 'var(--font-body)', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {settings.currencySymbol}{item.price.toFixed(2)}
                    </div>
                    <div className="add-btn" style={{ 
                      background: (item.stock > 0 || item.trackStock === false) ? 'var(--accent-gold-soft)' : 'rgba(255,255,255,0.05)', 
                      color: (item.stock > 0 || item.trackStock === false) ? 'var(--accent-gold)' : 'var(--text-muted)', 
                      padding: '3px', 
                      borderRadius: '6px', 
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-smooth)'
                    }}>
                      <Plus size={12} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>



      {/* Right Sidebar: Order Summary */}
      <aside className={`order-summary ${isCartOpen ? 'open' : ''}`}>
        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: 'var(--font-h2)', fontWeight: 700, fontFamily: 'Playfair Display' }}>Current Order</h2>
            {activeTableId && (
              <button 
                onClick={() => setIsSwitchingTable(true)}
                className="tab"
                style={{ padding: '4px 10px', fontSize: '0.65rem', border: '1px solid var(--glass-border-gold)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} /> Switch
              </button>
            )}
          </div>
          <button 
            onClick={() => setCartOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            className="mobile-only"
          >
            <X size={24} />
          </button>
        </div>

        <div className="cart-items" style={{ padding: '0 5px' }}>
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '60px', padding: '20px' }}>
                <Coffee size={40} style={{ opacity: 0.1, color: 'var(--accent-gold)', marginBottom: '15px' }} />
                <h3 style={{ fontSize: 'var(--font-body)', fontWeight: 600 }}>Empty Cart</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Select items to begin</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div key={item.cartItemId} layout initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} className="cart-item" style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 'var(--font-body)', fontWeight: 600 }}>{item.name}</span>
                        {item.modifiers && (
                          <span style={{ fontSize: '10px', color: 'var(--accent-gold)', opacity: 0.8, fontStyle: 'italic' }}>
                            {Object.entries(item.modifiers).map(([key, val]) => `${key}: ${val}`).join(' • ')}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 'var(--font-body)', color: 'white' }}>{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="cart-item-qty" style={{ border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '8px', height: '28px' }}>
                        <button onClick={() => updateQuantity(item.cartItemId, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Minus size={12} /></button>
                        <span style={{ fontSize: '0.85rem', minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}><Plus size={12} /></button>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {item.modifiers && (
                          <button 
                            onClick={() => {
                              setCustomizingItem(item);
                              // Re-calculate relevant customizations for editing
                              const relevant = customizations.filter(c => 
                                c.categories?.some(cat => cat.toLowerCase() === item.category?.toLowerCase())
                              );
                              setRelevantCustomizations(relevant);
                              setActiveModifiers(item.modifiers || {});
                              setIsEditingCartItem(true);
                            }} 
                            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: 'var(--font-xs)', textDecoration: 'underline', opacity: 0.7 }}
                          >
                            Edit
                          </button>
                        )}
                        <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: 'rgba(255,77,77,0.5)', cursor: 'pointer', fontSize: 'var(--font-xs)', textDecoration: 'underline' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="checkout-section" style={{ 
          background: 'rgba(255,255,255,0.02)', 
          padding: '12px', 
          borderRadius: '16px', 
          border: '1px solid var(--glass-border)', 
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Minimize/Expand Toggle Handle */}
          <div 
            onClick={() => setCheckoutMinimized(!isCheckoutMinimized)}
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '4px 0', 
              cursor: 'pointer',
              borderBottom: !isCheckoutMinimized ? '1px solid var(--glass-border)' : 'none',
              marginBottom: !isCheckoutMinimized ? '12px' : '0',
              transition: 'var(--transition-smooth)'
            }}
          >
            {isCheckoutMinimized ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)' }}>
                <ChevronUp size={16} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expand Checkout</span>
              </div>
            ) : (
              <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>

          <AnimatePresence>
            {!isCheckoutMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                {/* Customer Selection (CRM) */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={12} /> CUSTOMER
                    </label>
                    <button 
                      onClick={() => setNewCustomerModalOpen(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + New
                    </button>
                  </div>
                  <select 
                    className="search-bar" 
                    style={{ width: '100%', fontSize: '0.75rem', padding: '8px 10px', borderColor: selectedCustomerId ? 'var(--accent-gold)' : 'var(--glass-border)' }}
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSession({ selectedCustomerId: e.target.value })}
                  >
                    <option value="">👤 Walk-in Guest</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                          {c.name} • {c.points} pts
                      </option>
                    ))}
                  </select>
                  {selectedCustomerId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', padding: '10px', background: 'rgba(212,175,55,0.05)', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Award size={14} color="var(--accent-gold)" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                                  {customers.find(c => String(c.id) === String(selectedCustomerId))?.points || 0} pts
                              </span>
                          </div>
                          {(customers.find(c => String(c.id) === String(selectedCustomerId))?.points || 0) >= (settings.loyalty?.redemptionThreshold || 100) && (
                              <button 
                                  onClick={handleRedeemPoints}
                                  disabled={isRedeemed}
                                  style={{ 
                                    fontSize: '10px', 
                                    background: isRedeemed ? 'rgba(255,255,255,0.05)' : 'var(--accent-gold)', 
                                    color: isRedeemed ? 'var(--text-muted)' : 'black', 
                                    border: 'none', 
                                    padding: '4px 10px', 
                                    borderRadius: '6px', 
                                    fontWeight: 'bold', 
                                    cursor: isRedeemed ? 'default' : 'pointer',
                                    opacity: isRedeemed ? 0.5 : 1
                                  }}
                              >
                                  {isRedeemed ? 'Redeemed' : `Redeem ${settings.loyalty?.redemptionValue || 5}%`}
                              </button>
                          )}
                      </div>
                  )}
                </div>
                
                {/* Dining Mode Selector */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  <button 
                    onClick={() => { setSession({ diningMode: 'takeaway', activeTableId: null }); }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                      background: diningMode === 'takeaway' ? 'var(--accent-gold)' : 'transparent',
                      color: diningMode === 'takeaway' ? 'var(--bg-deep)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s',
                      fontSize: 'var(--font-xs)'
                    }}
                  >
                    <ShoppingBag size={14} /> Take-away
                  </button>
                  <button 
                    onClick={() => { setSession({ diningMode: 'dinein' }); setTableModalOpen(true); }}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                      background: diningMode === 'dinein' ? 'var(--accent-gold)' : 'transparent',
                      color: diningMode === 'dinein' ? 'var(--bg-deep)' : 'var(--text-muted)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer', transition: 'all 0.2s',
                      fontSize: 'var(--font-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Home size={14} /> Dine-in
                    </div>
                    {activeTableId && <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>T#{activeTableId} • {guestCount}G</span>}
                  </button>
                </div>

                {/* Summary Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div className="summary-row" style={{ fontSize: 'var(--font-xs)' }}><span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span>{settings.currencySymbol}{subtotal.toFixed(2)}</span></div>
                  {discountAmount > 0 && (
                    <div className="summary-row" style={{ fontSize: 'var(--font-xs)', color: '#ff4d4d' }}><span>Discount ({discountType === 'percent' ? discountValue + '%' : settings.currencySymbol + discountValue})</span><span>-{settings.currencySymbol}{discountAmount.toFixed(2)}</span></div>
                  )}
                  <div className="summary-row" style={{ fontSize: 'var(--font-xs)' }}><span style={{ color: 'var(--text-muted)' }}>Tax ({(settings.taxRate * 100).toFixed(1)}%)</span><span>{settings.currencySymbol}{tax.toFixed(2)}</span></div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '12px' }}>
                  {['cash', 'card', 'other'].map(method => (
                    <button 
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method !== 'cash') setAmountPaid(total);
                      }}
                      style={{ 
                        flex: 1, 
                        padding: '8px', 
                        borderRadius: '9px', 
                        border: 'none', 
                        background: paymentMethod === method ? 'var(--accent-gold)' : 'transparent', 
                        color: paymentMethod === method ? 'var(--bg-deep)' : 'var(--text-muted)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Payment Section */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Paid</label>
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '1px' }}>
                      <button onClick={() => setDiscountType('percent')} style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', background: discountType === 'percent' ? 'rgba(212, 175, 55, 0.2)' : 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.65rem' }}>%</button>
                      <button onClick={() => setDiscountType('fixed')} style={{ padding: '2px 6px', borderRadius: '4px', border: 'none', background: discountType === 'fixed' ? 'rgba(212, 175, 55, 0.2)' : 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.65rem' }}>{settings.currencySymbol}</button>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number"
                      className="search-bar"
                      style={{ width: '100%', height: '36px', fontSize: '0.9rem', padding: '0 30px 0 10px', textAlign: 'right', fontWeight: 600 }}
                      placeholder="0.00"
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                    <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{settings.currencySymbol}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="number"
                    className="search-bar"
                    style={{ flex: 1, height: '32px', fontSize: 'var(--font-xs)', padding: '0 10px', opacity: 0.7 }}
                    placeholder={discountType === 'percent' ? 'Discount %' : `Discount ${settings.currencySymbol}`}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>

                {amountPaid > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '15px', padding: '10px 15px', background: 'var(--accent-gold-soft)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--accent-gold)' }}>CHANGE DUE</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{settings.currencySymbol}{changeDue.toFixed(2)}</span>
                  </motion.div>
                )}

                {/* Dine-in Specific Controls */}
                {diningMode === 'dinein' && activeTableId && (
                  <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>PAYMENT STATUS</span>
                      <button 
                        onClick={() => setIsPaidToggle(!isPaidToggle)}
                        style={{ 
                          background: isPaidToggle ? '#4ade80' : 'rgba(255,255,255,0.05)', 
                          border: 'none', 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          color: isPaidToggle ? 'black' : 'white',
                          cursor: 'pointer'
                        }}
                      >
                        {isPaidToggle ? 'PAID' : 'UNPAID'}
                      </button>
                    </div>
                    <button 
                      className="pay-button"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)' }}
                      onClick={() => {
                        saveToTable(activeTableId, cart, guestCount);
                        // Update paid status if needed
                        useKachinoStore.getState().setTablePaid(activeTableId, isPaidToggle);
                        clearCart();
                        toast.success('Table context synchronized');
                        navigate('/tables');
                      }}
                    >
                      SYNC TO TABLE
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', marginTop: isCheckoutMinimized ? '8px' : '0' }}>
             <span style={{ fontSize: 'var(--font-h2)', fontWeight: 700, fontFamily: 'Playfair Display' }}>Total</span>
             <span style={{ fontSize: 'var(--font-h2)', fontWeight: 700, color: 'var(--accent-gold)' }}>{settings.currencySymbol}{total.toFixed(2)}</span>
          </div>

          <button 
            className="pay-button" 
            disabled={cart.length === 0} 
            onClick={() => {
                const totalCents = Math.round(total * 100);
                const paidCents = Math.round(amountPaid * 100);
                
                if (paidCents >= totalCents || isPaidToggle) {
                    handlePlaceOrder();
                } else {
                    toast.error('Enter payment amount or select a table');
                }
            }}
            style={{ 
                height: '38px', 
                fontSize: 'var(--font-body)', 
                fontWeight: 700,
                background: (Math.round(amountPaid * 100) >= Math.round(total * 100) || isPaidToggle) ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                color: (Math.round(amountPaid * 100) >= Math.round(total * 100) || isPaidToggle) ? 'var(--bg-deep)' : 'white'
            }}
          >
            { (Math.round(amountPaid * 100) >= Math.round(total * 100) || isPaidToggle) ? 'FINALIZE PAYMENT' : 'AWAITING PAYMENT' }
          </button>
        </div>
      </div>
    </aside>

      {/* Smart Table & Guest Selection Modal */}
      <AnimatePresence>
        {isTableModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ zIndex: 5000 }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content" style={{ maxWidth: '600px', width: '95%', padding: '0', overflow: 'hidden' }}>
              
              {/* Modal Header */}
              <div style={{ padding: '25px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>Table Assignment</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Manage floor occupancy and guest counts</p>
                </div>
                <button onClick={() => setTableModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginBottom: '30px', maxHeight: '40vh', overflowY: 'auto', paddingRight: '10px' }}>
                  {tables.map((t) => {
                    const isOccupied = t.status === 'occupied';
                    const isSelected = activeTableId === t.id;

                    return (
                      <motion.button
                        key={t.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (isOccupied && !isSelected) {
                            if (confirm(`Table ${t.id} is already occupied. Load current order?`)) {
                              loadFromTable(t.id);
                              setTableModalOpen(false);
                            }
                          } else {
                            setSession({ activeTableId: t.id, diningMode: 'dinein' });
                          }
                        }}
                        style={{
                          padding: '15px',
                          borderRadius: '16px',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--accent-gold)' : (isOccupied ? 'rgba(212, 175, 55, 0.3)' : 'var(--glass-border)'),
                          background: isSelected ? 'var(--accent-gold)' : (isOccupied ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)'),
                          color: isSelected ? 'var(--bg-deep)' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                           <Layout size={18} opacity={0.6} />
                           {isOccupied && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }} />}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.label.replace('Table ', '#')}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', marginTop: '2px' }}>
                          {isOccupied ? `Occupied (${t.guestCount})` : `Cap: ${t.capacity || 4}`}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Guest Count Step (Visible after table selection) */}
                <AnimatePresence>
                  {activeTableId && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                           <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Guest Occupancy</div>
                           <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>How many guests are seated at Table #{activeTableId}?</p>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <button onClick={() => setSession({ guestCount: Math.max(1, guestCount - 1) })} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer' }}><Minus size={20} /></button>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, minWidth: '30px', textAlign: 'center' }}>{guestCount}</span>
                            <button onClick={() => setSession({ guestCount: Math.min(12, guestCount + 1) })} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer' }}><Plus size={20} /></button>
                         </div>
                      </div>

                      <button 
                        className="pay-button" 
                        style={{ marginTop: '30px', background: 'var(--accent-gold)', color: '#000', fontWeight: 800, height: '54px' }}
                        onClick={() => setTableModalOpen(false)}
                      >
                        CONFIRM & START ORDER
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', maxWidth: '450px', width: '90%', textAlign: 'center' }}>
              <div className="animate-success">
                <CheckCircle size={64} color="var(--accent-gold)" style={{ marginBottom: '20px' }} />
              </div>
              <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Order Placed!</h2>
              <div style={{ 
                margin: '20px auto', 
                maxHeight: '400px', 
                overflowY: 'auto', 
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'white'
              }}>
                <Receipt order={lastOrder} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="pay-button" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-deep)', color: 'white', border: '1px solid var(--accent-gold)' }}
                  onClick={() => {
                    useKachinoStore.getState().setPrintOrder(lastOrder);
                    setTimeout(() => {
                      window.print();
                      useKachinoStore.getState().setPrintOrder(null);
                    }, 500);
                  }}
                >
                  <Printer size={16} />
                  Print
                </button>
                <button className="pay-button" style={{ flex: 1 }} onClick={handleReset}>Next Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* New Customer Modal */}
      <AnimatePresence>
        {isNewCustomerModalOpen && (
          <div className="modal-overlay" style={{ zIndex: 5001 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ maxWidth: '400px', width: '90%' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Add Customer</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const name = e.target.custName.value;
                const phone = e.target.custPhone.value;
                if (name && phone) {
                  const res = await addCustomer({ name, phone });
                  if (res?.success && res.customer) {
                    setSession({ selectedCustomerId: res.customer.id });
                    setNewCustomerModalOpen(false);
                    toast.success(`${name} registered and selected`);
                  } else {
                    toast.error('Registration failed: ' + (res?.error?.message || 'Unknown error'));
                  }
                }
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input name="custName" placeholder="Full Name" className="search-bar" style={{ width: '100%', padding: '12px' }} required />
                  <input name="custPhone" placeholder="Phone Number" className="search-bar" style={{ width: '100%', padding: '12px' }} required />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setNewCustomerModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white' }}>Cancel</button>
                    <button type="submit" className="pay-button" style={{ flex: 1 }}>Save Customer</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Customization Modal */}
      <AnimatePresence>
        {customizingItem && (
          <div className="modal-overlay" style={{ zIndex: 5002 }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="modal-content" style={{ maxWidth: '450px', width: '90%', padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>{isEditingCartItem ? 'Update' : 'Customize'} {customizingItem.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Select your preferred levels</p>
                </div>
                <button onClick={() => setCustomizingItem(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                {relevantCustomizations.map(cust => (
                  <div key={cust.id}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>{cust.name}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
                      {cust.options.map(level => (
                        <button 
                          key={level}
                          onClick={() => setActiveModifiers(prev => ({ ...prev, [cust.name]: level }))}
                          style={{
                            padding: '8px 0',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: activeModifiers[cust.name] === level ? 'var(--accent-gold)' : 'var(--glass-border)',
                            background: activeModifiers[cust.name] === level ? 'var(--accent-gold)' : 'rgba(255,255,255,0.02)',
                            color: activeModifiers[cust.name] === level ? 'var(--bg-deep)' : 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button 
                  onClick={() => setCustomizingItem(null)} 
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                {!isEditingCartItem && (
                  <button 
                    onClick={() => {
                      addToCart(customizingItem, null);
                      toast.success(`${customizingItem.name} added (Standard)`);
                      setCustomizingItem(null);
                    }} 
                    style={{ flex: 1.5, padding: '12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px', color: 'var(--accent-gold)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Standard
                  </button>
                )}
                <button 
                  onClick={confirmCustomization} 
                  className="pay-button" 
                  style={{ flex: 2, margin: 0, height: 'auto', padding: '12px', fontSize: '0.8rem' }}
                >
                  {isEditingCartItem ? 'Update' : 'Customized'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="modal-overlay" 
            style={{ zIndex: 6000, backdropFilter: 'blur(15px)', background: 'rgba(0,0,0,0.95)' }}
          >
            <motion.div 
              initial={{ y: 20, scale: 0.9 }} 
              animate={{ y: 0, scale: 1 }} 
              className="menu-card" 
              style={{ width: '320px', padding: '30px', textAlign: 'center' }}
            >
              <ShieldAlert size={48} color="var(--accent-gold)" style={{ marginBottom: '20px' }} />
              <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Terminal Locked</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '25px' }}>Enter Staff PIN to resume operations</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button 
                    key={n}
                    onClick={() => pinInput.length < 4 && setPinInput(prev => prev + n)}
                    style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}
                  >
                    {n}
                  </button>
                ))}
                <button onClick={() => setPinInput("")} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', fontWeight: 800, cursor: 'pointer' }}>CLR</button>
                <button onClick={() => pinInput.length < 4 && setPinInput(prev => prev + '0')} style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer' }}>0</button>
                <button onClick={handleUnlock} style={{ padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--accent-gold)', color: 'black', fontWeight: 800, cursor: 'pointer' }}>OK</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: pinInput.length > i ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)' }} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Switch Table Modal */}
      <AnimatePresence>
        {isSwitchingTable && (
          <div className="modal-overlay" style={{ zIndex: 5002 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content" 
              style={{ width: '400px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', padding: '25px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                 <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Switch Table</h2>
                 <button onClick={() => setIsSwitchingTable(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>Select target table for current order:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                 {tables.filter(t => t.status === 'available').map(t => (
                    <button 
                      key={t.id} 
                      className="tab" 
                      style={{ padding: '15px 5px', fontSize: '0.75rem' }}
                      onClick={async () => {
                         await moveTable(activeTableId, t.id);
                         setIsSwitchingTable(false);
                         toast.success(`Moved to ${t.label}`);
                      }}
                    >
                      {t.label}
                    </button>
                 ))}
              </div>
              {tables.filter(t => t.status === 'available').length === 0 && (
                 <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No tables available.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default POS;
