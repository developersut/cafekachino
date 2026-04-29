import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../supabase';
import { toast } from 'sonner';

// Simple encrypted storage using btoa/atob for localStorage obfuscation
const SECRET = 'kachino-2024';

const obfuscate = (str) => {
  try { return btoa(encodeURIComponent(str)); } catch { return str; }
};
const deobfuscate = (str) => {
  try { return decodeURIComponent(atob(str)); } catch { return str; }
};

const encryptedStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try { return JSON.parse(deobfuscate(raw)); } catch { return null; }
  },
  setItem: (name, value) => {
    localStorage.setItem(name, obfuscate(JSON.stringify(value)));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

const defaultStaff = [
  { id: 1, name: 'Manager', pin: '1234', role: 'admin' },
  { id: 2, name: 'Staff User', pin: '0000', role: 'staff' },
];

export const useKachinoStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      categories: ['All', 'Coffee', 'Tea', 'Bakery'],
      staff: defaultStaff,
      sales: [],
      expenses: [],
      auditLogs: [],
      tables: [...Array(12)].map((_, i) => ({ 
        id: i + 1, 
        label: `Table ${i + 1}`, 
        status: 'available', 
        capacity: 4,
        guestCount: 0,
        currentOrder: [],
        sessionStartTime: null,
        lastUpdated: null,
        isPaid: false
      })),
      isCartOpen: false,
      isSidebarOpen: false,
      cart: [],
      activeTableId: null,
      diningMode: 'takeaway',
      guestCount: 1,
      selectedCustomerId: null,
      customers: [],
      printOrder: null,
      expenseCategories: ['Ingredients', 'Labor', 'Utilities', 'Rent & Maintenance', 'Marketing'],
      zReports: [],
      isLocked: false,
      customizations: [
        { id: 'ice', name: 'Ice Level', options: ['None', '25%', '50%', '75%', '100%'], categories: ['Coffee', 'Tea', 'Chocolate', 'Water', 'Drinks', 'Juice'] },
        { id: 'sugar', name: 'Sugar Level', options: ['None', '25%', '50%', '75%', '100%'], categories: ['Coffee', 'Tea', 'Chocolate', 'Drinks', 'Juice'] }
      ],
      settings: {
        taxRate: 0.08,
        currency: 'USD',
        currencySymbol: '$',
        fiscalId: 'TIN-492-901',
        footerMsg: 'Thank you for visiting Kachino!',
        storeInfo: {
          name: 'CAFE KACHINO',
          address: '123 Espresso Lane, Downtown Hub',
          phone: '+1 (555) 000-0000',
          logoUrl: '/logo.png',
          welcomeMsg: 'READ • SIP • RETREAT'
        },
        loyalty: {
          spendPerPoint: 1000,
          redemptionThreshold: 100,
          redemptionValue: 5
        }
      },


      // Helpers
      addLog: async (action, details) => {
        const log = {
          timestamp: new Date().toISOString(),
          user: get().user?.name || 'System',
          action,
          details
        };

        // Update local state for immediate feedback
        set(state => ({
          auditLogs: [{ id: Date.now(), ...log }, ...state.auditLogs].slice(0, 50)
        }));

        // Persist to cloud
        await supabase.from('audit_logs').insert([log]);
      },

      // Auth
      login: (role, pin) => {
        const staff = get().staff;
        const found = staff.find(s => s.role === role && s.pin === pin);
        if (found) {
          set({ user: found });
          get().addLog('Security Login', `${found.name} entered as ${role}`);
          return true;
        }
        return false;
      },
      logout: () => {
        get().addLog('Security Logout', `${get().user?.name} logged out`);
        set({ user: null });
      },

      // Staff actions
      addStaff: async (member) => {
        // PIN Uniqueness Check
        const isDuplicate = get().staff.some(s => s.pin === member.pin);
        if (isDuplicate) {
          toast.error('PIN Conflict', { description: 'This security PIN is already assigned to another staff member.' });
          return false;
        }

        const { data, error } = await supabase.from('staff').insert([member]).select();
        if (!error && data) {
          set(state => ({ staff: [...state.staff, data[0]] }));
          get().addLog('Admin Action', `Added team member: ${member.name}`);
          toast.success('Team member synced to cloud');
          return true;
        } else {
          console.error('Staff Sync Error:', error);
          toast.error(`Staff sync failed: ${error?.message}`);
          return false;
        }
      },
      updateStaff: async (id, updated) => {
        // PIN Uniqueness Check (excluding self)
        const isDuplicate = get().staff.some(s => s.pin === updated.pin && s.id !== id);
        if (isDuplicate) {
          toast.error('PIN Conflict', { description: 'This security PIN is already assigned to another staff member.' });
          return false;
        }

        set(state => ({ staff: state.staff.map(s => s.id === id ? updated : s) }));
        const { error } = await supabase.from('staff').update(updated).eq('id', id);
        if (!error) {
          get().addLog('Admin Action', `Updated staff info for ${updated.name}`);
          return true;
        }
        return false;
      },
      deleteStaff: async (id) => {
        const member = get().staff.find(s => s.id === id);
        set(state => ({ staff: state.staff.filter(s => s.id !== id) }));
        await supabase.from('staff').delete().eq('id', id);
        get().addLog('Admin Action', `Removed staff member: ${member?.name}`);
      },

      addItem: async (item) => {
        // Generate a random 9-digit ID that fits in a standard 32-bit integer
        const tempId = Math.floor(100000000 + Math.random() * 900000000);
        const newItem = { ...item, id: tempId, lowStockThreshold: item.lowStockThreshold || 10 };
        
        set(state => ({ items: [...state.items, newItem] }));
        get().addLog('Inventory Action', `Added product: ${item.name}`);
        
        try {
          // Omit the 'id' field so Supabase can auto-generate it
          const { id, ...itemToSave } = newItem;
          const { data, error } = await supabase.from('inventory').insert([itemToSave]).select();
          
          if (error) {
            console.error('Supabase Error:', error);
            // Revert local state if save failed to prevent "ghost" data
            set(state => ({ items: state.items.filter(i => i.id !== tempId) }));
            toast.error(`Cloud Sync Failed: ${error.message}`);
          } else if (data && data[0]) {
            // Update local state with the actual data from cloud (including the real ID)
            set(state => ({
              items: state.items.map(i => i.id === tempId ? data[0] : i)
            }));
            toast.success('Product synced to cloud');
          }
        } catch (e) { 
          console.error('Fatal sync error:', e);
          toast.error('Connection error while saving to cloud');
        }
      },
      updateItem: async (id, updated) => {
        set(state => ({ items: state.items.map(i => i.id === id ? updated : i) }));
        await supabase.from('inventory').update(updated).eq('id', id);
        get().addLog('Inventory Action', `Updated product: ${updated.name}`);
      },
      deleteItem: async (id) => {
        const prev = get().items.find(i => i.id === id);
        set(state => ({ items: state.items.filter(i => i.id !== id) }));
        await supabase.from('inventory').delete().eq('id', id);
        get().addLog('Inventory Action', `Deleted product: ${prev?.name}`);
      },
      restockItem: async (id, amount) => {
        const prev = get().items.find(i => i.id === id);
        const newStock = (prev.stock || 0) + amount;
        set(state => ({
          items: state.items.map(i => i.id === id ? { ...i, stock: newStock } : i)
        }));
        await supabase.from('inventory').update({ stock: newStock }).eq('id', id);
        get().addLog('Inventory Action', `Restocked ${prev?.name} (+${amount})`);
      },

      setCart: (cart) => set({ cart }),
      setSession: (session) => set(state => ({ ...state, ...session })),
      resetSession: () => set({ 
        activeTableId: null, 
        diningMode: 'takeaway', 
        guestCount: 1, 
        selectedCustomerId: null,
        cart: []
      }),
      clearCart: () => {
        set({ cart: [], activeTableId: null, diningMode: 'takeaway', guestCount: 1, selectedCustomerId: null });
      },

      // Cloud Integration
      initializeCloudState: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        
        get().subscribeToTables();
        
        try {
          // Fetch everything in parallel for better performance
          const [
            { data: items, error: itemsError },
            { data: categories, error: catsError },
            { data: tables, error: tablesError },
            { data: customers, error: custsError },
            { data: sales, error: salesError },
            { data: staff, error: staffError },
            { data: settingsData, error: settingsError },
            { data: logs, error: logsError },
            { data: custData, error: custDataError },
            { data: expensesData, error: expensesError },
            { data: zReportsData, error: zReportsError }
          ] = await Promise.all([
            supabase.from('inventory').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('tables').select('*').order('id', { ascending: true }),
            supabase.from('customers').select('*'),
            supabase.from('sales').select('*').order('timestamp', { ascending: false }).limit(100),
            supabase.from('staff').select('*'),
            supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
            supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50),
            supabase.from('customizations').select('*'),
            supabase.from('expenses').select('*').order('timestamp', { ascending: false }).limit(200),
            supabase.from('z_reports').select('*').order('timestamp', { ascending: false }).limit(50)
          ]);

          // Table Self-Healing: If table list is empty in cloud, seed defaults
          let finalTables = tables;
          if (!tablesError && (!tables || tables.length === 0)) {
            const localTables = get().tables;
            if (localTables && localTables.length > 0) {
              finalTables = localTables;
            } else {
              const defaultTables = [...Array(12)].map((_, i) => ({ 
                id: i + 1, label: `Table ${i + 1}`, status: 'available', capacity: 4, guestCount: 0, currentOrder: []
              }));
              const { data: seeded } = await supabase.from('tables').insert(defaultTables).select();
              finalTables = seeded || defaultTables;
            }
          }

          // Staff Self-Healing
          let finalStaff = staff;
          if (!staffError && (!staff || staff.length === 0)) {
            const defaults = [
              { name: 'Manager', pin: '1234', role: 'admin' },
              { name: 'Staff User', pin: '0000', role: 'staff' }
            ];
            const { data: seeded } = await supabase.from('staff').insert(defaults).select();
            finalStaff = seeded || defaults;
          }

          // Settings Self-Healing
          let finalSettings = settingsData;
          if (!settingsError && !settingsData) {
            const defaults = {
              id: 1, taxRate: 0.08, currency: 'USD', currencySymbol: '$', fiscalId: 'TIN-492-901',
              footerMsg: 'Thank you for visiting Kachino!',
              storeInfo: { name: 'CAFE KACHINO', address: '123 Espresso Lane', phone: '+1 (555) 000-0000', welcomeMsg: 'READ • SIP • RETREAT' }
            };
            await supabase.from('settings').insert([defaults]);
            finalSettings = defaults;
          }

          set({ 
            items: itemsError ? get().items : (items || []),
            categories: catsError ? get().categories : (categories?.length ? categories.map(c => c.name) : get().categories),
            tables: tablesError ? get().tables : (finalTables || []).map(cloudTable => {
              const localTable = get().tables?.find(t => t.id === cloudTable.id);
              if (!localTable) return cloudTable;
              
              const localTime = new Date(localTable.lastUpdated || 0).getTime();
              const cloudTime = new Date(cloudTable.lastUpdated || 0).getTime();
              
              // If local state is newer than cloud (or cloud lacks timestamps),
              // preserve the local state to prevent data loss.
              if (localTime > cloudTime) {
                return { ...cloudTable, ...localTable };
              }
              
              // Otherwise, cloud is newer. Merge safely.
              return {
                ...localTable,
                ...cloudTable,
                currentOrder: cloudTable.currentOrder !== undefined ? cloudTable.currentOrder : (localTable?.currentOrder || []),
                status: cloudTable.status !== undefined ? cloudTable.status : (localTable?.status || 'available'),
                guestCount: cloudTable.guestCount !== undefined ? cloudTable.guestCount : (localTable?.guestCount || 0),
                sessionStartTime: cloudTable.sessionStartTime !== undefined ? cloudTable.sessionStartTime : (localTable?.sessionStartTime || null),
                isPaid: cloudTable.isPaid !== undefined ? cloudTable.isPaid : (localTable?.isPaid || false)
              };
            }),
            customers: custsError ? get().customers : (customers || []),
            sales: salesError ? get().sales : (sales || []),
            staff: staffError ? get().staff : (finalStaff || []),
            settings: settingsError ? get().settings : (settingsData || get().settings),
            auditLogs: logsError ? get().auditLogs : (logs || []),
            customizations: custDataError ? get().customizations : (custData || get().customizations),
            expenses: expensesError ? get().expenses : (expensesData || []),
            zReports: zReportsError ? get().zReports : (zReportsData || []),
            isLoading: false 
          });
        } catch (error) {
          console.error("Cloud Init Fatal Error:", error);
          set({ isLoading: false });
        }
      },

      subscribeToTables: () => {
        supabase.channel('table-changes')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables' }, payload => {
            set(state => ({
              tables: state.tables.map(t => {
                if (t.id === payload.new.id) {
                  const localTime = new Date(t.lastUpdated || 0).getTime();
                  const cloudTime = new Date(payload.new.lastUpdated || 0).getTime();
                  
                  if (localTime > cloudTime) {
                    return t; // Local is newer, ignore this broadcast
                  }
                  
                  return {
                    ...t,
                    ...payload.new,
                    currentOrder: payload.new.currentOrder !== undefined ? payload.new.currentOrder : (t.currentOrder || []),
                    status: payload.new.status !== undefined ? payload.new.status : (t.status || 'available'),
                    guestCount: payload.new.guestCount !== undefined ? payload.new.guestCount : (t.guestCount || 0),
                    sessionStartTime: payload.new.sessionStartTime !== undefined ? payload.new.sessionStartTime : (t.sessionStartTime || null),
                    isPaid: payload.new.isPaid !== undefined ? payload.new.isPaid : (t.isPaid || false)
                  };
                }
                return t;
              })
            }));
          })
          .subscribe();
      },

      // Category actions
      addCategory: async (name) => {
        if (get().categories.includes(name)) return;
        
        // Optimistic local update
        set(state => ({ categories: [...state.categories, name] }));
        get().addLog('Admin Action', `Added category: ${name}`);
        
        try {
          const { error } = await supabase.from('categories').insert([{ name }]);
          if (error) {
            console.error('Cloud sync failed for addCategory:', error.message);
            // Revert
            set(state => ({ categories: state.categories.filter(c => c !== name) }));
            toast.error(`Category sync failed: ${error.message}`);
          } else {
            toast.success('Category synced to cloud');
          }
        } catch (e) { 
          console.error('Cloud sync error for addCategory:', e); 
          set(state => ({ categories: state.categories.filter(c => c !== name) }));
        }
      },
      deleteCategory: async (name) => {
        if (name === 'All') return;
        const { error } = await supabase.from('categories').delete().eq('name', name);
        if (!error) {
          set(state => ({
            categories: state.categories.filter(c => c !== name)
          }));
          get().addLog('Admin Action', `Deleted category: ${name}`);
        }
      },

      // Table management
      addTable: async (label) => {
        // Generate a random 9-digit ID that fits in a standard 32-bit integer
        const tempId = Math.floor(100000000 + Math.random() * 900000000);
        const newTable = { 
          id: tempId,
          label, 
          status: 'available', 
          capacity: 4,
          guestCount: 0,
          currentOrder: [],
          sessionStartTime: null,
          lastUpdated: new Date().toISOString()
        };
        
        set(state => ({ tables: [...state.tables, newTable] }));
        get().addLog('Admin Action', `Added table: ${label}`);
        
        try {
          // Send the full newTable object including the ID, 
          // because the database table requires a manual ID.
          const { data, error } = await supabase.from('tables').insert([newTable]).select();
          
          if (error) {
            console.error('Supabase Table Error:', error);
            // Revert local state if save failed
            set(state => ({ tables: state.tables.filter(t => t.id !== tempId) }));
            toast.error(`Table sync failed: ${error.message}`);
          } else if (data && data[0]) {
            set(state => ({
              tables: state.tables.map(t => t.id === tempId ? data[0] : t)
            }));
            toast.success('Table synced to cloud');
          }
        } catch (e) { 
          console.error('Fatal table sync error:', e);
        }
      },
      updateTable: async (id, label) => {
        const { error } = await supabase.from('tables').update({ label }).eq('id', id);
        if (!error) {
          set(state => ({
            tables: state.tables.map(t => t.id === id ? { ...t, label } : t)
          }));
          get().addLog('Admin Action', `Updated table label: ${label}`);
        }
      },
      toggleTableSession: async (id) => {
        const table = get().tables.find(t => t.id === id);
        if (!table) return;
        const newStatus = table.status === 'occupied' ? 'available' : 'occupied';
        const resetData = newStatus === 'available' ? {
          guestCount: 0,
          currentOrder: [],
          sessionStartTime: null,
          isPaid: false
        } : {
          sessionStartTime: new Date().toISOString(),
          isPaid: false
        };
        
        const updated = { ...table, status: newStatus, ...resetData, lastUpdated: new Date().toISOString() };
        set(state => ({
          tables: state.tables.map(t => t.id === id ? updated : t)
        }));
        await supabase.from('tables').update(updated).eq('id', id);
        get().addLog('Table Action', `${newStatus === 'occupied' ? 'Started' : 'Ended'} session for ${table.label}`);
      },
      setTablePaid: async (id, isPaid) => {
        set(state => ({
          tables: state.tables.map(t => t.id === id ? { ...t, isPaid, lastUpdated: new Date().toISOString() } : t)
        }));
        await supabase.from('tables').update({ isPaid, lastUpdated: new Date().toISOString() }).eq('id', id);
      },
      deleteTable: async (id) => {
        const prev = get().tables.find(t => t.id === id);
        const { error } = await supabase.from('tables').delete().eq('id', id);
        if (!error) {
          set(state => ({
            tables: state.tables.filter(t => t.id !== id)
          }));
          get().addLog('Admin Action', `Deleted table: ${prev?.label}`);
        }
      },

      saveToTable: async (tableId, cart, guestCount = 0) => {
        const table = get().tables.find(t => t.id === tableId);
        const now = new Date().toISOString();
        const updatedData = { 
          status: 'occupied', 
          guestCount: guestCount || table?.guestCount || 0,
          currentOrder: cart,
          sessionStartTime: table?.sessionStartTime || now,
          lastUpdated: now,
          isPaid: table?.isPaid || false
        };

        set(state => ({
          tables: state.tables.map(t => t.id === tableId ? { ...t, ...updatedData } : t)
        }));
        
        await supabase.from('tables').update(updatedData).eq('id', tableId);
        get().addLog('POS Action', `Updated session for ${table?.label}`);
      },
      loadFromTable: (tableId) => {
        const table = get().tables.find(t => String(t.id) === String(tableId));
        if (!table) return;
        
        set({ 
          cart: table.currentOrder || [],
          activeTableId: table.id,
          diningMode: 'dinein',
          guestCount: table.guestCount || 1
        });
        
        get().addLog('POS Action', `Loaded order from ${table?.label}`);
      },
      clearTable: async (tableId) => {
        if (!tableId) return;
        const targetId = typeof tableId === 'object' ? tableId.id : tableId;
        
        const resetData = { 
          status: 'available', 
          guestCount: 0, 
          currentOrder: [], 
          sessionStartTime: null, 
          lastUpdated: new Date().toISOString(),
          isPaid: false
        };

        set(state => ({
          tables: state.tables.map(t => String(t.id) === String(targetId) ? { ...t, ...resetData } : t)
        }));

        await supabase.from('tables').update(resetData).eq('id', targetId);
      },

      moveTable: async (sourceId, targetId) => {
        const sourceTable = get().tables.find(t => String(t.id) === String(sourceId));
        const targetTable = get().tables.find(t => String(t.id) === String(targetId));
        if (!sourceTable || !targetTable || targetTable.status === 'occupied') return;
        
        const moveData = {
          status: 'occupied',
          guestCount: sourceTable.guestCount,
          currentOrder: sourceTable.currentOrder,
          sessionStartTime: sourceTable.sessionStartTime,
          lastUpdated: new Date().toISOString(),
          isPaid: sourceTable.isPaid
        };
        
        const resetData = {
          status: 'available',
          guestCount: 0,
          currentOrder: [],
          sessionStartTime: null,
          lastUpdated: new Date().toISOString(),
          isPaid: false
        };
        
        set(state => ({
          tables: state.tables.map(t => {
            if (String(t.id) === String(sourceId)) return { ...t, ...resetData };
            if (String(t.id) === String(targetId)) return { ...t, ...moveData };
            return t;
          }),
          activeTableId: targetId
        }));
        
        await supabase.from('tables').update(moveData).eq('id', targetId);
        await supabase.from('tables').update(resetData).eq('id', sourceId);
        get().addLog('Table Action', `Moved session from ${sourceTable.label} to ${targetTable.label}`);
      },

      // Settings
      updateSettings: async (newSettings) => {
        const updated = { ...get().settings, ...newSettings };
        set({ settings: updated });
        await supabase.from('settings').update(updated).eq('id', 1);
        get().addLog('Admin Action', `Updated system settings`);
      },

      setCartOpen: (val) => set({ isCartOpen: val }),
      toggleCart: () => set(state => ({ isCartOpen: !state.isCartOpen })),
      setSidebarOpen: (val) => set({ isSidebarOpen: val }),

      addToCart: (item, modifiers = null) => {
        const cart = get().cart;
        const existingIdx = cart.findIndex(i => 
          i.id === item.id && 
          JSON.stringify(i.modifiers || null) === JSON.stringify(modifiers)
        );

        if (existingIdx > -1) {
          const newCart = [...cart];
          newCart[existingIdx].quantity += 1;
          set({ cart: newCart });
        } else {
          set({ cart: [...cart, { ...item, cartItemId: Date.now() + Math.random(), quantity: 1, modifiers }] });
        }
      },
      updateCartModifiers: (cartItemId, modifiers) => {
        set(state => {
          const cart = [...state.cart];
          const idx = cart.findIndex(i => i.cartItemId === cartItemId);
          if (idx === -1) return state;
          
          const item = cart[idx];
          // Check if after updating modifiers, it matches another item in cart
          const existingIdx = cart.findIndex((i, index) => 
            index !== idx && 
            i.id === item.id && 
            JSON.stringify(i.modifiers || null) === JSON.stringify(modifiers)
          );

          if (existingIdx > -1) {
            // Merge with existing
            cart[existingIdx].quantity += item.quantity;
            cart.splice(idx, 1);
          } else {
            // Just update
            cart[idx] = { ...item, modifiers };
          }
          return { cart };
        });
      },
      updateCartQuantity: (cartItemId, delta) => {
        set(state => ({
          cart: state.cart.map(item => {
            if (item.cartItemId === cartItemId) {
              const newQty = Math.max(0, item.quantity + delta);
              return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
          }).filter(Boolean)
        }));
      },
      removeFromCart: (cartItemId) => set(state => ({ cart: state.cart.filter(i => i.cartItemId !== cartItemId) })),


      addCustomer: async (customer) => {
        const newCustomer = { 
          id: Math.floor(100000000 + Math.random() * 900000000), // Fit in standard integer
          name: customer.name, 
          phone: customer.phone,
          points: 0,
          since: new Date().toISOString()
        };
        
        const { data, error } = await supabase.from('customers').insert([newCustomer]).select();
        if (!error && data) {
          set(state => ({ customers: [...state.customers, data[0]] }));
          get().addLog('CRM Action', `Registered customer: ${customer.name}`);
          return { success: true, customer: data[0] };
        }
        
        console.error("Supabase Save Error:", error);
        return { success: false, error };
      },
      fetchCustomers: async () => {
        const { data, error } = await supabase.from('customers').select('*').order('name').limit(1);
        if (!error && data) {
          console.log("Customer Schema Debug:", data[0]);
          // Fetch all now
          const { data: all } = await supabase.from('customers').select('*').order('name');
          if (all) set({ customers: all });
        }
      },
      updateCustomer: async (id, updated) => {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...updated } : c)
        }));
        await supabase.from('customers').update(updated).eq('id', id);
      },
      deleteCustomer: async (id) => {
        set(state => ({ customers: state.customers.filter(c => c.id !== id) }));
        await supabase.from('customers').delete().eq('id', id);
        get().addLog('CRM Action', `Removed customer profile`);
      },

      recordSale: async (order) => {
        try {
          const saleId = Math.floor(Math.random() * 2147483647);
          const sale = {
            id: saleId,
            timestamp: new Date().toISOString(),
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            discount: order.discount || 0,
            total: order.total,
            amountPaid: order.amountPaid || 0,
            change: order.change || 0,
            paymentMethod: order.paymentMethod || 'cash',
            status: 'completed',
            processedBy: get().user?.name || 'System',
            customerId: order.customerId,
            diningMode: order.diningMode,
            tableNumber: order.tableNumber
          };

          // 1. Save to Cloud
          const { id, ...saleToSave } = sale;
          const { data, error } = await supabase.from('sales').insert([saleToSave]).select();
          
          if (error) {
            console.error("Supabase Sale Error:", error);
            toast.error(`Sync Failed: ${error.message}`);
            // Fallback: Add to local state even if cloud fails for immediate feedback
            const fallbackSale = { ...sale, id: saleId }; // Use our generated ID
            set(state => ({
              sales: [fallbackSale, ...state.sales].slice(0, 500)
            }));
          } else if (data && data[0]) {
            set(state => ({
              sales: [data[0], ...state.sales].slice(0, 500),
              items: state.items.map(item => {
                const sold = order.items.find(i => i.id === item.id);
                if (sold && item.trackStock !== false) {
                  const updatedItem = { ...item, stock: Math.max(0, item.stock - sold.quantity) };
                  // Async update stock in background
                  supabase.from('inventory').update({ stock: updatedItem.stock }).eq('id', item.id);
                  return updatedItem;
                }
                return item;
              }),
            }));
          }

          // Loyalty Point logic
          if (sale.customerId) {
            const { loyalty } = get().settings;
            const spendPerPoint = Math.max(1, loyalty?.spendPerPoint || 1000);
            const threshold = loyalty?.redemptionThreshold || 100;
            
            const earnedPoints = Math.floor(sale.total / spendPerPoint);
            let pointDelta = earnedPoints;
            
            const currentCustomer = get().customers.find(c => String(c.id) === String(sale.customerId));
            
            // Use isRedeemed flag from order if provided, otherwise fallback to discount detection
            const pointsRedeemed = order.isRedeemed || (sale.discount >= 5 && currentCustomer && currentCustomer.points >= threshold);
            
            if (pointsRedeemed && currentCustomer && currentCustomer.points >= threshold) {
              pointDelta -= threshold;
            }

            if (currentCustomer) {
              const newPoints = Math.max(0, (currentCustomer.points || 0) + pointDelta);
              await supabase.from('customers').update({ points: newPoints }).eq('id', sale.customerId);
              set(state => ({
                customers: state.customers.map(c => String(c.id) === String(sale.customerId) ? { ...c, points: newPoints } : c)
              }));
              get().addLog('Loyalty Update', `${currentCustomer.name} points updated: ${pointDelta > 0 ? '+' : ''}${pointDelta}. New total: ${newPoints}`);
            }
          }

          // Table Session Termination
          if (order.diningMode === 'dinein' && order.tableNumber) {
            await get().clearTable(order.tableNumber);
          }

          get().addLog('POS Sale', `Processed order for ${get().settings.currencySymbol || '$'}${sale.total.toFixed(2)}`);
          
          // Reset Global Session
          get().resetSession();
        } catch (err) {
          console.error("Fatal recordSale Error:", err);
          toast.error("An unexpected error occurred while saving the sale.");
        }
      },

      voidSale: async (saleId) => {
        const sale = get().sales.find(s => s.id === saleId);
        if (!sale || sale.status === 'voided') return;

        set(state => ({
          sales: state.sales.map(s => s.id === saleId ? { ...s, status: 'voided' } : s),
          items: state.items.map(item => {
            const returned = sale.items.find(i => i.id === item.id);
            if (returned && item.trackStock !== false) {
              const updatedStock = item.stock + returned.quantity;
              // Background update
              supabase.from('inventory').update({ stock: updatedStock }).eq('id', item.id);
              return { ...item, stock: updatedStock };
            }
            return item;
          })
        }));

        // Revert Customer Points
        const customer = get().customers.find(c => String(c.id) === String(sale.customerId));
        if (customer) {
          const { loyalty } = get().settings;
          const spendPerPoint = Math.max(1, loyalty?.spendPerPoint || 1000);
          const pointsToRevert = Math.floor(sale.total / spendPerPoint);
          
          get().updateCustomer(customer.id, {
            points: Math.max(0, (customer.points || 0) - pointsToRevert)
          });
        }

        // Sync Void to Cloud
        await supabase.from('sales').update({ status: 'voided' }).eq('id', saleId);

        get().addLog('POS Void', `Voided order #${saleId.toString().slice(-6)} ($${sale.total.toFixed(2)}). Stock and points reverted.`);
      },

      deleteSale: async (saleId) => {
        const sale = get().sales.find(s => s.id === saleId);
        if (!sale) return;

        // Revert stock and points if NOT already voided
        if (sale.status !== 'voided') {
          set(state => ({
            items: state.items.map(item => {
              const returned = sale.items.find(i => i.id === item.id);
              if (returned && item.trackStock !== false) {
                const updatedStock = item.stock + returned.quantity;
                supabase.from('inventory').update({ stock: updatedStock }).eq('id', item.id);
                return { ...item, stock: updatedStock };
              }
              return item;
            })
          }));
          
          const customer = get().customers.find(c => String(c.id) === String(sale.customerId));
          if (customer) {
            const { loyalty } = get().settings;
            const spendPerPoint = Math.max(1, loyalty?.spendPerPoint || 1000);
            const pointsToRevert = Math.floor(sale.total / spendPerPoint);
            get().updateCustomer(customer.id, {
              points: Math.max(0, (customer.points || 0) - pointsToRevert)
            });
          }
        }

        // Remove from local state
        set(state => ({
          sales: state.sales.filter(s => s.id !== saleId)
        }));

        // Remove from Cloud
        await supabase.from('sales').delete().eq('id', saleId);

        get().addLog('POS Delete', `Permanently deleted order #${saleId.toString().slice(-6)}. Record removed from system.`);
      },

      addExpense: async (expense) => {
        const newExpense = { timestamp: new Date().toISOString(), ...expense };
        const { data, error } = await supabase.from('expenses').insert([newExpense]).select();
        
        if (!error && data) {
           set(state => ({ expenses: [...state.expenses, data[0]] }));
           get().addLog('Finance Action', `Logged expense: ${expense.description}`);
           return { success: true };
        }
        return { success: false, error };
      },
      updateExpense: async (id, updated) => {
        set(state => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, ...updated } : e) }));
        await supabase.from('expenses').update(updated).eq('id', id);
        get().addLog('Finance Action', `Updated expense: ${updated.description}`);
      },
      deleteExpense: async (id) => {
        const prev = get().expenses.find(e => e.id === id);
        set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
        await supabase.from('expenses').delete().eq('id', id);
        get().addLog('Finance Action', `Deleted expense: ${prev?.description}`);
      },
      addExpenseCategory: (category) => {
        if (!get().expenseCategories.includes(category)) {
          set(state => ({ expenseCategories: [...state.expenseCategories, category] }));
          get().addLog('Finance Action', `Added expense category: ${category}`);
        }
      },
      deleteExpenseCategory: (category) => {
        set(state => ({ expenseCategories: state.expenseCategories.filter(c => c !== category) }));
        get().addLog('Finance Action', `Removed expense category: ${category}`);
      },
      fetchExpenses: async () => {
        const { data, error } = await supabase.from('expenses').select('*').order('timestamp', { ascending: false });
        if (!error && data) set({ expenses: data });
      },
      fetchSales: async () => {
        const { data, error } = await supabase.from('sales').select('*').order('timestamp', { ascending: false });
        if (!error && data) set({ sales: data });
      },
      
      // Customization actions
      addCustomization: async (cust) => {
        const tempId = Math.floor(100000000 + Math.random() * 900000000);
        const newCust = { ...cust, id: tempId };
        
        set(state => ({ customizations: [...state.customizations, newCust] }));
        get().addLog('Admin Action', `Added customization: ${cust.name}`);

        try {
          const { data, error } = await supabase.from('customizations').insert([newCust]).select();
          if (!error && data) {
            set(state => ({
              customizations: state.customizations.map(c => c.id === tempId ? data[0] : c)
            }));
            toast.success('Customization synced to cloud');
          } else {
            console.error('Customization Sync Error:', error);
            set(state => ({ customizations: state.customizations.filter(c => c !== tempId) }));
            toast.error(`Customization sync failed: ${error?.message}`);
          }
        } catch (e) {
          console.error('Fatal customization sync error:', e);
          set(state => ({ customizations: state.customizations.filter(c => c !== tempId) }));
        }
      },
      updateCustomization: async (id, updated) => {
        set(state => ({ customizations: state.customizations.map(c => c.id === id ? updated : c) }));
        await supabase.from('customizations').update(updated).eq('id', id);
        get().addLog('Admin Action', `Updated customization: ${updated.name}`);
      },
      deleteCustomization: async (id) => {
        const prev = get().customizations.find(c => c.id === id);
        set(state => ({ customizations: state.customizations.filter(c => c !== id) }));
        await supabase.from('customizations').delete().eq('id', id);
        get().addLog('Admin Action', `Deleted customization: ${prev?.name}`);
      },

      // Z-Report Actions
      saveZReport: async (report) => {
        const newReport = { 
          timestamp: new Date().toISOString(), 
          ...report,
          settledBy: get().user?.name || 'System'
        };
        
        try {
          const { data, error } = await supabase.from('z_reports').insert([newReport]).select();
          if (!error && data) {
            set(state => ({ zReports: [data[0], ...state.zReports].slice(0, 100) }));
            get().addLog('Finance Action', `Z-Report Settled: ${get().settings.currencySymbol}${report.totalTodayRevenue.toFixed(2)}`);
            toast.success('Shift record synchronized to cloud');
            return { success: true, report: data[0] };
          } else {
            console.error('Z-Report Sync Error:', error);
            // Local fallback
            set(state => ({ zReports: [{ id: Date.now(), ...newReport }, ...state.zReports].slice(0, 100) }));
            toast.error('Local settlement saved (Cloud sync pending)');
            return { success: true };
          }
        } catch (e) {
          console.error('Fatal Z-Report Error:', e);
          return { success: false };
        }
      },
      fetchZReports: async () => {
        const { data, error } = await supabase.from('z_reports').select('*').order('timestamp', { ascending: false });
        if (!error && data) set({ zReports: data });
      },

      setLocked: (locked) => set({ isLocked: locked }),
      setPrintOrder: (order) => set({ printOrder: order }),

      // Loyalty Actions
      updateCustomerPoints: async (customerId, pointsDelta) => {
        const { customers, addLog } = get();
        const customer = customers.find(c => String(c.id) === String(customerId));
        if (!customer) return;

        const newPoints = Math.max(0, (customer.points || 0) + pointsDelta);
        
        // Update locally
        set(state => ({
          customers: state.customers.map(c => 
            String(c.id) === String(customerId) ? { ...c, points: newPoints } : c
          )
        }));

        // Persist to Supabase if available
        try {
          const { error } = await supabase
            .from('customers')
            .update({ points: newPoints })
            .eq('id', customerId);
          
          if (error) throw error;
          addLog('Loyalty Update', `${customer.name} points updated by ${pointsDelta}. New total: ${newPoints}`);
        } catch (err) {
          console.error('Failed to sync points to cloud:', err);
        }
      },


      // Fiscal Calculations
      getFiscalSummary: (startDate, endDate) => {
        const { sales, expenses } = get();
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        const periodSales = sales.filter(s => {
          const d = new Date(s.timestamp);
          return d >= start && d <= end && s.status !== 'voided';
        });

        const periodExpenses = expenses.filter(e => {
          const d = new Date(e.timestamp);
          return d >= start && d <= end;
        });

        const revenue = periodSales.reduce((sum, s) => sum + s.total, 0);
        const tax = periodSales.reduce((sum, s) => sum + (s.tax || 0), 0);
        const overhead = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          revenue,
          tax,
          expenses: overhead,
          net: revenue - overhead,
          orderCount: periodSales.length
        };
      },

      // Data Resilience (Backup & Restore)
      exportSystemData: () => {
        const state = get();
        const backup = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          data: {
            items: state.items,
            categories: state.categories,
            staff: state.staff,
            sales: state.sales,
            expenses: state.expenses,
            customers: state.customers,
            tables: state.tables,
            settings: state.settings,
            customizations: state.customizations,
            zReports: state.zReports,
            auditLogs: state.auditLogs
          }
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kachino-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        get().addLog('System Action', 'Full system backup exported');
      },

      importSystemData: async (jsonString) => {
        try {
          const backup = JSON.parse(jsonString);
          if (!backup.data || !backup.version) throw new Error('Invalid backup format');

          const { data } = backup;
          
          set({ isLoading: true });

          // 1. Update Supabase
          const tablesToRestore = [
            { name: 'inventory', data: data.items },
            { name: 'categories', data: data.categories.filter(c => c !== 'All').map(c => ({ name: c })) },
            { name: 'staff', data: data.staff },
            { name: 'sales', data: data.sales },
            { name: 'expenses', data: data.expenses },
            { name: 'customers', data: data.customers },
            { name: 'tables', data: data.tables },
            { name: 'settings', data: [data.settings] },
            { name: 'customizations', data: data.customizations },
            { name: 'z_reports', data: data.zReports },
            { name: 'audit_logs', data: data.auditLogs }
          ];

          for (const table of tablesToRestore) {
            await supabase.from(table.name).delete().neq('id', -1);
            if (table.data && table.data.length > 0) {
              await supabase.from(table.name).insert(table.data);
            }
          }

          // 2. Update Local State
          set({
            items: data.items,
            categories: data.categories,
            staff: data.staff,
            sales: data.sales,
            expenses: data.expenses,
            customers: data.customers,
            tables: data.tables,
            settings: data.settings,
            customizations: data.customizations,
            zReports: data.zReports,
            auditLogs: data.auditLogs,
            isLoading: false
          });

          get().addLog('System Action', 'Full system restoration completed');
          toast.success('Data Restoration Successful');
          return true;
        } catch (err) {
          console.error('Restoration Failed:', err);
          set({ isLoading: false });
          toast.error('Restoration Failed', { description: err.message });
          return false;
        }
      },
    }),
    {
      name: 'kachino-encrypted-store',
      storage: createJSONStorage(() => encryptedStorage),
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
        staff: state.staff,
        sales: state.sales,
        expenses: state.expenses,
        auditLogs: state.auditLogs,
        user: state.user,
        settings: state.settings,
        cart: state.cart,
        customers: state.customers,
        tables: state.tables,
        customizations: state.customizations,
        zReports: state.zReports,
        activeTableId: state.activeTableId,
        diningMode: state.diningMode,
        guestCount: state.guestCount,
        selectedCustomerId: state.selectedCustomerId,
      }),
    }
  )
);
